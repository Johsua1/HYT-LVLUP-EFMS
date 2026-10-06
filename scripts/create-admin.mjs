#!/usr/bin/env node
// ============================================================================
// EFMS — create or promote the dedicated administrator account
// ============================================================================
// This is the ONLY supported way to bootstrap an admin. It runs on your machine
// (or CI), uses the service-role key server-side, and never touches the browser.
//
// Usage:
//   node scripts/create-admin.mjs \
//     --email admin@levelup.example \
//     --password 'a-strong-password' \
//     --name 'Workspace Administrator'
//
// The service-role key is read from (in order): the shell environment, then
// .env.admin.local, then .env.local. Put it in .env.admin.local and keep that
// file git-ignored — it must never be committed or shipped to the client.
//
//   .env.admin.local:
//     SUPABASE_SERVICE_ROLE_KEY=eyJ...
//
// The created admin signs in with the password, then enrols TOTP MFA on first
// login. No password is ever stored or logged by this script.
// ============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

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

function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      i += 1;
    } else {
      flags[key] = 'true';
    }
  }
  return { flags, positionals };
}

function printUsage() {
  console.log(`
EFMS — create or promote the administrator account

Option A (recommended): put the details in a git-ignored file, then run the
script with no arguments.

  .env.admin.local
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
    ADMIN_EMAIL=admin@levelup.example
    ADMIN_PASSWORD=a-strong-password
    ADMIN_NAME=Workspace Administrator

  npm run admin:create

Option B: pass flags directly to node (NOT through npm — on Windows,
\`npm run <script> -- --flag\` strips the flags):

  node scripts/create-admin.mjs --email admin@levelup.example --password "a-strong-password" --name "Workspace Administrator"
`);
}

function initialsOf(name) {
  const cleaned = name.replace(/[^a-zA-Z ]/g, '');
  const first = cleaned.trim().charAt(0).toUpperCase();
  const second = (cleaned.match(/ ([a-zA-Z])/) || [])[1]?.toUpperCase() ?? '';
  return `${first}${second}` || 'AD';
}

async function main() {
  const fileEnv = { ...loadEnvFile('.env.local'), ...loadEnvFile('.env.admin.local') };
  const env = { ...fileEnv, ...process.env };
  const { flags, positionals } = parseArgs(process.argv.slice(2));

  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const email = (flags.email || env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = flags.password || env.ADMIN_PASSWORD || '';
  const name = (flags.name || env.ADMIN_NAME || 'Workspace Administrator').trim();

  if (flags.help === 'true' || flags.h === 'true') {
    printUsage();
    process.exit(0);
  }

  if (!url) {
    console.error('✗ Missing Supabase URL. Set VITE_SUPABASE_URL in .env.local.');
    process.exit(1);
  }
  if (!serviceKey) {
    console.error(
      '✗ Missing SUPABASE_SERVICE_ROLE_KEY.\n' +
        '  Add it to .env.admin.local (git-ignored). Never commit or ship this key.',
    );
    process.exit(1);
  }
  if (!email) {
    console.error('✗ No admin email provided.');
    if (positionals.length > 0) {
      console.error(
        '  It looks like the flag names were stripped (a known npm-on-Windows quirk:\n' +
          '  `npm run <script> -- --flag` drops the --flag tokens).',
      );
    }
    printUsage();
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('✗ Provide a valid --email (or ADMIN_EMAIL).');
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Find an existing auth user for this email (paginate lightly).
  let userId = null;
  for (let page = 1; page <= 10 && !userId; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error(`✗ Could not list users: ${error.message}`);
      process.exit(1);
    }
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) userId = found.id;
    if (data.users.length < 200) break;
  }

  if (!userId) {
    if (!password || password.length < 8) {
      console.error('✗ A new admin needs --password (or ADMIN_PASSWORD) of at least 8 characters.');
      process.exit(1);
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error || !data.user) {
      console.error(`✗ Could not create the admin user: ${error?.message ?? 'unknown error'}`);
      process.exit(1);
    }
    userId = data.user.id;
    console.log(`• Created auth user ${email}`);
  } else {
    console.log(`• Found existing auth user ${email}`);
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: name,
      initials: initialsOf(name),
      role: 'admin',
      status: 'active',
      activated_at: now,
      disabled_at: null,
    },
    { onConflict: 'id' },
  );
  if (profileError) {
    console.error(`✗ Could not set the admin profile: ${profileError.message}`);
    process.exit(1);
  }

  console.log('');
  console.log(`✓ ${email} is now an active administrator.`);
  console.log('  Sign in with the email + password, then enrol your authenticator app when prompted.');
  console.log('  (No password is stored or printed by this script.)');
}

main().catch((error) => {
  console.error(`✗ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
