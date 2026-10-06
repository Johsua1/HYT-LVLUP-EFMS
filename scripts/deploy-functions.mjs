#!/usr/bin/env node
// ============================================================================
// EFMS — deploy the admin-staff Edge Function (non-interactive)
// ============================================================================
// Deploys without `supabase login` (no browser flow). It reads a Supabase
// personal access token from the environment or from the git-ignored
// .env.admin.local / .env.local files, then runs the CLI for you.
//
// 1. Create a token:  https://supabase.com/dashboard/account/tokens
// 2. Add it to .env.admin.local (git-ignored):
//        SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxx
// 3. Run:
//        npm run sb:functions:deploy
//
// The token is a *personal access token* (account-level), NOT the service-role
// key, and is never printed by this script.
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

const fileEnv = { ...loadEnvFile('.env.local'), ...loadEnvFile('.env.admin.local') };
const token = process.env.SUPABASE_ACCESS_TOKEN || fileEnv.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error(
    [
      '✗ Missing SUPABASE_ACCESS_TOKEN.',
      '',
      'Create a personal access token at:',
      '  https://supabase.com/dashboard/account/tokens',
      '',
      'Then add this line to .env.admin.local (git-ignored) and re-run:',
      '  SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxx',
      '',
      'Alternatively, run the interactive login once:  npm run sb:login',
    ].join('\n'),
  );
  process.exit(1);
}

const projectRef =
  (fileEnv.VITE_SUPABASE_URL || '').match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ??
  'msaczgyoxjywhojcfgpx';

console.log(`• Deploying admin-staff to project ${projectRef} …`);

const result = spawnSync(
  'npx',
  ['supabase', 'functions', 'deploy', 'admin-staff', '--project-ref', projectRef, '--no-verify-jwt', '--use-api'],
  { stdio: 'inherit', shell: true, env: { ...process.env, SUPABASE_ACCESS_TOKEN: token } },
);

if (result.status !== 0) {
  console.error('✗ Deploy failed (see output above).');
  process.exit(result.status ?? 1);
}
console.log('✓ admin-staff deployed.');
