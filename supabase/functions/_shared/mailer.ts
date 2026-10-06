// ============================================================================
// EFMS — minimal SMTP sender for Edge Functions
// ============================================================================
// Supabase's own mailer can only send fixed templates, so it cannot carry a
// per-recipient temporary password. This module sends the message directly
// over SMTP (implicit TLS, e.g. Gmail on 465) using the same credentials the
// project already uses for auth email.
//
// Credentials come from Edge Function secrets:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SENDER_EMAIL, SMTP_SENDER_NAME
//
// The body is base64-encoded, which sidesteps line-length limits and SMTP
// dot-stuffing entirely.
// ============================================================================

export interface MailInput {
  to: string;
  subject: string;
  html: string;
}

export interface MailResult {
  ok: boolean;
  error: string | null;
}

const CONNECT_TIMEOUT_MS = 15_000;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** RFC 2047 encodes a header value only when it contains non-ASCII characters. */
function encodeHeader(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${toBase64(new TextEncoder().encode(value))}?=`;
}

/** Base64 bodies must be wrapped; 76 chars per line is the safe maximum. */
function wrapBase64(encoded: string): string {
  const lines: string[] = [];
  for (let i = 0; i < encoded.length; i += 76) lines.push(encoded.slice(i, i + 76));
  return lines.join('\r\n');
}

function buildMessage(from: string, fromName: string, to: string, subject: string, html: string): string {
  const headers = [
    `From: ${encodeHeader(fromName)} <${from}>`,
    `To: <${to}>`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    `Date: ${new Date().toUTCString()}`,
  ];
  return `${headers.join('\r\n')}\r\n\r\n${wrapBase64(toBase64(new TextEncoder().encode(html)))}`;
}

/**
 * Sends one HTML email over SMTP. Never throws — returns { ok, error } so the
 * caller can report a delivery failure separately from a creation failure.
 */
export async function sendMail({ to, subject, html }: MailInput): Promise<MailResult> {
  const host = Deno.env.get('SMTP_HOST');
  const port = Number(Deno.env.get('SMTP_PORT') ?? '465');
  const user = Deno.env.get('SMTP_USER');
  const pass = Deno.env.get('SMTP_PASS');
  const from = Deno.env.get('SMTP_SENDER_EMAIL') ?? user;
  const fromName = Deno.env.get('SMTP_SENDER_NAME') ?? 'EFMS';

  if (!host || !user || !pass || !from) {
    return { ok: false, error: 'SMTP is not configured for this project' };
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const chunk = new Uint8Array(4096);
  let buffer = '';

  let conn: Deno.TlsConn | null = null;
  const timeout = setTimeout(() => {
    try {
      conn?.close();
    } catch {
      /* already closed */
    }
  }, CONNECT_TIMEOUT_MS);

  try {
    conn = await Deno.connectTls({ hostname: host, port });

    const readReply = async (): Promise<string> => {
      for (;;) {
        const lines = buffer.split('\r\n').filter((line) => line.length > 0);
        const last = lines[lines.length - 1];
        // A final response line is "250 ..." (a hyphen in position 3 means more lines follow).
        if (last && /^\d{3} /.test(last)) {
          const reply = buffer;
          buffer = '';
          return reply;
        }
        const read = await conn!.read(chunk);
        if (read === null) throw new Error('SMTP connection closed unexpectedly');
        buffer += decoder.decode(chunk.subarray(0, read));
      }
    };

    const send = (line: string) => conn!.write(encoder.encode(`${line}\r\n`));

    const expect = async (step: string, code: string): Promise<void> => {
      const reply = await readReply();
      if (!reply.startsWith(code)) {
        throw new Error(`${step} failed: ${reply.split('\r\n')[0]}`);
      }
    };

    await expect('greeting', '220');
    send(`EHLO efms.local`);
    await expect('EHLO', '250');
    send('AUTH LOGIN');
    await expect('AUTH', '334');
    send(toBase64(encoder.encode(user)));
    await expect('AUTH user', '334');
    send(toBase64(encoder.encode(pass)));
    await expect('AUTH password', '235');
    send(`MAIL FROM:<${from}>`);
    await expect('MAIL FROM', '250');
    send(`RCPT TO:<${to}>`);
    await expect('RCPT TO', '250');
    send('DATA');
    await expect('DATA', '354');

    const message = buildMessage(from, fromName, to, subject, html);
    // Terminating dot on its own line ends the DATA block.
    send(`${message}\r\n.`);
    await expect('message body', '250');

    send('QUIT');
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
    try {
      conn?.close();
    } catch {
      /* already closed */
    }
  }
}
