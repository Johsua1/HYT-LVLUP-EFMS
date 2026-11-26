#!/usr/bin/env node
// ============================================================================
// EFMS — configure custom SMTP + account-access email templates (non-interactive)
// ============================================================================
// Supabase will not let a free-tier project edit its email templates while it
// uses the built-in mailer. Configuring a custom SMTP provider unlocks both
// reliable delivery AND template editing — this script does both in one pass.
//
// 1. Add your provider's details to .env.admin.local (git-ignored). Example:
//
//        SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxx
//        SMTP_PROVIDER=resend
//        SMTP_USER=resend
//        SMTP_PASS=re_xxxxxxxxxxxxxxxx
//        SMTP_SENDER_EMAIL=no-reply@yourdomain.com
//        SMTP_SENDER_NAME=Level Up EFMS
//
//    Supported providers (host/port auto-filled):
//        resend | brevo | sendgrid | mailgun | gmail | custom
//    For `custom`, also set SMTP_HOST and SMTP_PORT.
//
//    No personal access token? Run `npx supabase login` first — the script
//    falls back to the token the CLI stores when SUPABASE_ACCESS_TOKEN is
//    missing or rejected.
//
// 2. Run:  npm run sb:smtp
//
// The password is read from the file and never printed.
// ============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(name) {
  const path = resolve(root, name);
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

const env = { ...loadEnvFile('.env.local'), ...loadEnvFile('.env.admin.local'), ...process.env };

const projectRef = (env.VITE_SUPABASE_URL || '').match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];

if (!projectRef) fail('Could not determine the project ref from VITE_SUPABASE_URL.');

/**
 * The CLI writes the token from `supabase login` here. Using it means the
 * template can be pushed without creating (and pasting) a personal access
 * token — and a revoked `SUPABASE_ACCESS_TOKEN` no longer blocks the script.
 */
function readCliToken() {
  const path = join(homedir(), '.supabase', 'access-token');
  if (!existsSync(path)) return null;
  const value = readFileSync(path, 'utf8').trim();
  return value || null;
}

const PROVIDERS = {
  resend: { host: 'smtp.resend.com', port: 465, user: 'resend' },
  brevo: { host: 'smtp-relay.brevo.com', port: 587 },
  sendgrid: { host: 'smtp.sendgrid.net', port: 587, user: 'apikey' },
  mailgun: { host: 'smtp.mailgun.org', port: 587 },
  gmail: { host: 'smtp.gmail.com', port: 465 },
  custom: {},
};

const provider = (env.SMTP_PROVIDER || '').trim().toLowerCase();
if (!provider) fail('Set SMTP_PROVIDER in .env.admin.local (resend | brevo | sendgrid | mailgun | gmail | custom).');
if (!(provider in PROVIDERS)) fail(`Unknown SMTP_PROVIDER "${provider}". Use one of: ${Object.keys(PROVIDERS).join(', ')}.`);

const preset = PROVIDERS[provider];
const host = (env.SMTP_HOST || preset.host || '').trim();
const port = Number(env.SMTP_PORT || preset.port || 0);
const user = (env.SMTP_USER || preset.user || '').trim();
const pass = (env.SMTP_PASS || '').trim();
const senderEmail = (env.SMTP_SENDER_EMAIL || '').trim();
const senderName = (env.SMTP_SENDER_NAME || 'EFMS').trim();

if (!host) fail('Missing SMTP_HOST (required for the "custom" provider).');
if (!port) fail('Missing SMTP_PORT.');
if (!user) fail('Missing SMTP_USER.');
if (!pass) fail('Missing SMTP_PASS (add it to .env.admin.local — do not paste it in chat).');
if (!senderEmail) fail('Missing SMTP_SENDER_EMAIL (the "From" address, e.g. no-reply@yourdomain.com).');

const api = (path = '') => `https://api.supabase.com/v1/projects/${projectRef}${path}`;

/* Use the first credential Supabase actually accepts: the token in
   .env.admin.local, then whatever `supabase login` stored. A revoked token
   should not stop the template from being deployed. */
const candidates = [
  ['SUPABASE_ACCESS_TOKEN', env.SUPABASE_ACCESS_TOKEN],
  ['Supabase CLI login', readCliToken()],
].filter(([, value]) => value);

if (!candidates.length) {
  fail(
    'No Supabase credential found. Run `npx supabase login`, or create a token at\n' +
      '  https://supabase.com/dashboard/account/tokens\n' +
      'and put it in .env.admin.local as SUPABASE_ACCESS_TOKEN.',
  );
}

let token = null;
for (const [label, value] of candidates) {
  const probe = await fetch(api('/config/auth'), { headers: { Authorization: `Bearer ${value}` } });
  if (probe.ok) {
    token = value;
    console.log(`• Credential: ${label}`);
    break;
  }
  if (probe.status === 401) {
    console.log(`• ${label} was rejected (401) — trying the next option.`);
    continue;
  }
  fail(`Could not read the auth config (${probe.status}): ${await probe.text()}`);
}
if (!token) {
  fail(
    'Every credential was rejected. Run `npx supabase login` again, or issue a new token at\n' +
      '  https://supabase.com/dashboard/account/tokens\n' +
      'and put it in .env.admin.local as SUPABASE_ACCESS_TOKEN.',
  );
}

const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function patch(body) {
  const res = await fetch(api('/config/auth'), { method: 'PATCH', headers, body: JSON.stringify(body) });
  if (!res.ok) fail(`Supabase rejected the config update (${res.status}): ${await res.text()}`);
}

async function getConfig() {
  const res = await fetch(api('/config/auth'), { headers });
  if (!res.ok) fail(`Could not read the auth config (${res.status}): ${await res.text()}`);
  return res.json();
}

console.log(`• Project ${projectRef}`);
console.log(`• SMTP provider: ${provider} → ${host}:${port} as ${user}`);
console.log(`• Sender: ${senderName} <${senderEmail}>`);

// 1. Configure custom SMTP.
await patch({
  smtp_host: host,
  smtp_port: String(port),
  smtp_user: user,
  smtp_pass: pass,
  smtp_admin_email: senderEmail,
  smtp_sender_name: senderName,
});
console.log('✓ Custom SMTP configured.');

// 2. Now that a custom provider is set, the email templates become editable.
const recoveryHtml = readFileSync(resolve(root, 'supabase/templates/recovery.html'), 'utf8');
await patch({
  mailer_subjects_recovery: 'Welcome to EFMS — set your password',
  mailer_templates_recovery_content: recoveryHtml,
  mailer_subjects_invite: 'Welcome to EFMS — activate your staff account',
  mailer_templates_invite_content: recoveryHtml,
});
console.log('✓ Account-access email templates pushed.');

// 3. Optional: point the hosted Site URL / redirects at production.
if (env.SITE_URL) {
  const siteUrl = env.SITE_URL.replace(/\/+$/, '');
  const allow = [`${siteUrl}/**`, 'http://localhost:5173/**', 'http://127.0.0.1:5173/**'].join(',');
  await patch({ site_url: siteUrl, uri_allow_list: allow });
  console.log(`✓ Site URL set to ${siteUrl} (allow-list includes localhost for dev).`);
} else {
  console.log('• SITE_URL not set — leaving the hosted Site URL unchanged.');
}

// 4. Verify.
const cfg = await getConfig();
console.log('\nVerification');
console.log('  smtp_host        ', JSON.stringify(cfg.smtp_host));
console.log('  smtp_port        ', JSON.stringify(cfg.smtp_port));
console.log('  smtp_user        ', JSON.stringify(cfg.smtp_user));
console.log('  smtp_pass set    ', Boolean(cfg.smtp_pass));
console.log('  smtp_admin_email ', JSON.stringify(cfg.smtp_admin_email));
console.log('  smtp_sender_name ', JSON.stringify(cfg.smtp_sender_name));
console.log('  recovery subject ', JSON.stringify(cfg.mailer_subjects_recovery));
console.log('  recovery branded ', (cfg.mailer_templates_recovery_content || '').includes('Level Up International'));
/* The whole point of the push: the link must be the token_hash form, not the
   default confirmation URL that only the requesting browser can complete. */
const pushed = cfg.mailer_templates_recovery_content || '';
console.log('  link uses token  ', pushed.includes('token_hash={{ .TokenHash }}'));
console.log('  no PKCE link     ', !pushed.includes('{{ .ConfirmationURL }}'));
console.log('  site_url         ', JSON.stringify(cfg.site_url));

console.log('\n✓ Done. Request a new reset email — old emails still carry the old link.');

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}
