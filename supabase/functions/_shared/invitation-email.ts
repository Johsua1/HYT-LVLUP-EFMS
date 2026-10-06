// ============================================================================
// EFMS — invitation email (carries the temporary password)
// ============================================================================
// Rendered by the admin-staff function and sent via the SMTP mailer. Kept in
// _shared/ so the same markup can be reused by the local test harness.
// ============================================================================

export interface InvitationEmailInput {
  fullName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
  /** True when this is a re-send, which issues a brand-new temporary password. */
  resent?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderInvitationEmail(input: InvitationEmailInput): { subject: string; html: string } {
  const name = escapeHtml(input.fullName || 'there');
  const email = escapeHtml(input.email);
  const password = escapeHtml(input.tempPassword);
  const loginUrl = escapeHtml(input.loginUrl);
  const intro = input.resent
    ? 'A new temporary password has been issued for your EFMS account.'
    : 'An administrator has created an EFMS account for you.';

  const subject = 'Your EFMS login details';

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Your EFMS login email and temporary password — please sign in and change it.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(16,24,40,0.08);">
            <tr>
              <td style="background-color:#044aa9;padding:26px 32px;">
                <p style="margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#b3d1f9;font-weight:600;">
                  Employer Filtering Management System
                </p>
                <p style="margin:6px 0 0;font-size:19px;font-weight:700;color:#ffffff;">
                  Level Up International Manpower Services Corp.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;">
                  Welcome to EFMS, ${name}
                </h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
                  ${intro} Use the details below to sign in for the first time.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;margin:0 0 16px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;font-weight:600;">
                        Login email
                      </p>
                      <p style="margin:0;font-size:15px;font-weight:600;color:#044aa9;word-break:break-all;">
                        ${email}
                      </p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin:0 0 24px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#92400e;font-weight:600;">
                        Temporary password
                      </p>
                      <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:17px;font-weight:700;color:#111827;letter-spacing:0.04em;word-break:break-all;">
                        ${password}
                      </p>
                      <p style="margin:8px 0 0;font-size:12px;line-height:1.5;color:#92400e;">
                        You will be asked to choose a new password as soon as you sign in.
                      </p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td align="center" style="border-radius:10px;background-color:#044aa9;">
                      <a href="${loginUrl}"
                         style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
                        Sign in to EFMS
                      </a>
                    </td>
                  </tr>
                </table>

                <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />

                <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#111827;">
                  How to sign in for the first time
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.6;color:#374151;">
                  <tr>
                    <td valign="top" style="width:26px;padding:0 0 10px;font-weight:700;color:#044aa9;">1.</td>
                    <td style="padding:0 0 10px;">Open <a href="${loginUrl}" style="color:#044aa9;font-weight:600;">${loginUrl}</a>.</td>
                  </tr>
                  <tr>
                    <td valign="top" style="width:26px;padding:0 0 10px;font-weight:700;color:#044aa9;">2.</td>
                    <td style="padding:0 0 10px;">Sign in with your login email and the temporary password above.</td>
                  </tr>
                  <tr>
                    <td valign="top" style="width:26px;padding:0 0 10px;font-weight:700;color:#044aa9;">3.</td>
                    <td style="padding:0 0 10px;">Choose a new password when prompted — this is required before you can continue.</td>
                  </tr>
                  <tr>
                    <td valign="top" style="width:26px;padding:0;">4.</td>
                    <td style="padding:0;">Use your new password from then on. Administrators also set up two-factor authentication.</td>
                  </tr>
                </table>

                <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
                  Keep this password private — it is a temporary credential. If you did not expect this account, contact
                  the administrator and do not sign in.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:11px;line-height:1.6;color:#9ca3af;">
                  EFMS · Level Up International Manpower Services Corp. · This is an automated message.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}
