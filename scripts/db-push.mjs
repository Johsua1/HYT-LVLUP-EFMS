#!/usr/bin/env node
// ============================================================================
// EFMS — push database migrations to the hosted project (non-interactive)
// ============================================================================
// `supabase db push` needs a Supabase access token to resolve the project and
// open a connection. The bare CLI command does not read .env files, which is
// why `npm run sb:db:push` used to fail with "Cannot find project ref".
//
// This wrapper reads the token + project ref from the git-ignored env files and
// forwards everything to the CLI, so the command just works.
//
//   npm run sb:db:push              # apply pending migrations
//   npm run sb:db:push -- --dry-run # show what WOULD be applied (no changes)
//
// Extra args after `--` are passed straight through to `supabase db push`.
//
// Token/ref are read from (in order): the shell environment, then
// .env.admin.local, then .env.local.
//   SUPABASE_ACCESS_TOKEN  — Supabase personal access token (Management API)
//   VITE_SUPABASE_URL      — https://<project-ref>.supabase.co
// The token is never printed by this script.
// ============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
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

const token = env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error(
    [
      '✗ Missing SUPABASE_ACCESS_TOKEN (a Supabase personal access token).',
      '',
      'Create one at https://supabase.com/dashboard/account/tokens and add it to',
      '.env.admin.local (git-ignored):',
      '  SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxx',
      '',
      'This is the Management API token, NOT the service-role key.',
    ].join('\n'),
  );
  process.exit(1);
}

const projectRef =
  (env.VITE_SUPABASE_URL || '').match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ??
  'msaczgyoxjywhojcfgpx';

const passthrough = process.argv.slice(2);
console.log(`• Pushing migrations to project ${projectRef} …`);

const result = spawnSync(
  'npx',
  ['supabase', 'db', 'push', '--project-ref', projectRef, ...passthrough],
  { stdio: 'inherit', shell: true, env: { ...process.env, SUPABASE_ACCESS_TOKEN: token } },
);

process.exit(result.status ?? 1);
