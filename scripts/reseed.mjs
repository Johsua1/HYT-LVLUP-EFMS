#!/usr/bin/env node
// ============================================================================
// EFMS — replace the seeded employer dataset on a hosted Supabase project
// ============================================================================
// The app is 100% Supabase-backed, so editing src/data/seeds.ts only changes
// what generate-seed.mjs writes to supabase/seed.sql — it does NOT touch the
// live database. `supabase db push` applies migrations only, never the seed.
//
// This script performs the clean "remove the demo data and load the new data"
// step that a plain re-run of seed.sql cannot: the generated seed uses
// `ON CONFLICT DO UPDATE` on a handful of columns, so re-applying it over the
// old rows would leave stale addresses, contacts, fees and documents behind.
// Instead it deletes the seeded rows and inserts the new dataset fresh, inside
// a single transaction (all-or-nothing).
//
//   node scripts/reseed.mjs          # dry run — reports what WOULD change
//   node scripts/reseed.mjs --yes    # execute the destructive reseed
//
// Run it with `node` directly (NOT `npm run ... -- --yes` — npm on Windows
// strips the flags).
//
// Credentials are read from (in order) the shell environment, then
// .env.admin.local, then .env.local:
//   VITE_SUPABASE_URL        — https://<project-ref>.supabase.co
//   SUPABASE_ACCESS_TOKEN    — a Supabase personal access token (Management API)
//
// DESTRUCTIVE: this permanently deletes every employer row (and everything that
// cascades from it), plus the seeded activity-log and system-preset rows. Do
// not run it against a project that already holds real, hand-entered data.
// ============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

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

function printUsage() {
  console.log(`
EFMS — replace the seeded employer dataset on Supabase

  node scripts/reseed.mjs           Dry run (default). Prints what would change.
  node scripts/reseed.mjs --yes     Delete the 12 legacy demo employers, keep any
                                    hand-created ones, then load the new dataset.
  node scripts/reseed.mjs --all     DANGER: delete EVERY employer (hand-created
                                    ones included), then load the new dataset.

Required (environment, .env.admin.local or .env.local):
  VITE_SUPABASE_URL       https://<project-ref>.supabase.co
  SUPABASE_ACCESS_TOKEN   Supabase personal access token (Management API)

Regenerate supabase/seed.sql first with:  node scripts/generate-seed.mjs
`);
}

/* ------------------------------------------------------------------ */
/* Legacy demo employer ids                                            */
/* ------------------------------------------------------------------ */

/**
 * The original hand-authored demo dataset used ids `emp-001`…`emp-012`, which
 * `generate-seed.mjs` turned into deterministic UUIDv5 primary keys. Deleting
 * exactly those ids removes the demo employers while leaving any employer a
 * user created through the app untouched.
 */
const NAMESPACE = 'ef2c7c1a-1f5e-4b3a-9d2e-7a6b5c4d3e2f';
const LEGACY_DEMO_IDS = Array.from({ length: 12 }, (_, i) => `emp-${String(i + 1).padStart(3, '0')}`);

function uuidV5(name) {
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(ns).update(Buffer.from(name, 'utf8')).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const LEGACY_UUIDS = LEGACY_DEMO_IDS.map(uuidV5);
const LEGACY_IN_LIST = LEGACY_UUIDS.map((id) => `'${id}'`).join(', ');

const CLEANUP_SHARED_SQL = `delete from public.activity_log where user_id is null;
delete from public.filter_presets where user_id is null;`;

const COUNT_SQL = `select
  (select count(*) from public.employers)         as employers,
  (select count(*) from public.job_orders)        as job_orders,
  (select count(*) from public.contracts)         as contracts,
  (select count(*) from public.fees)              as fees,
  (select count(*) from public.requirements)      as requirements,
  (select count(*) from public.documents)         as documents,
  (select count(*) from public.notes)             as notes,
  (select count(*) from public.verification_events) as verification_events,
  (select count(*) from public.filter_presets)    as filter_presets,
  (select count(*) from public.activity_log)      as activity_log;`;

const BREAKDOWN_SQL = `select
  (select count(*) from public.employers) as total,
  (select count(*) from public.employers where id in (${LEGACY_IN_LIST})) as legacy_demo;`;

async function main() {
  const fileEnv = { ...loadEnvFile('.env.local'), ...loadEnvFile('.env.admin.local') };
  const env = { ...fileEnv, ...process.env };

  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }
  const confirmed = args.includes('--yes');
  const deleteAll = args.includes('--all');

  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const token = env.SUPABASE_ACCESS_TOKEN;

  if (!url) {
    console.error('✗ Missing Supabase URL. Set VITE_SUPABASE_URL in .env.local.');
    process.exit(1);
  }
  if (!token) {
    console.error(
      '✗ Missing SUPABASE_ACCESS_TOKEN (a Supabase personal access token).\n' +
        '  Add it to .env.admin.local (git-ignored). This is the Management API\n' +
        '  token, NOT the service-role key.',
    );
    process.exit(1);
  }

  const ref = new URL(url).hostname.split('.')[0];
  if (!ref) {
    console.error(`✗ Could not derive the project ref from VITE_SUPABASE_URL (${url}).`);
    process.exit(1);
  }

  const seedPath = resolve(root, 'supabase', 'seed.sql');
  if (!existsSync(seedPath)) {
    console.error('✗ supabase/seed.sql not found. Run: node scripts/generate-seed.mjs');
    process.exit(1);
  }
  const seedSql = readFileSync(seedPath, 'utf8');
  const employerInserts = (seedSql.match(/insert into public\.employers/g) || []).length;
  if (employerInserts === 0) {
    console.error('✗ supabase/seed.sql contains no employer rows. Regenerate it first.');
    process.exit(1);
  }

  // Strip the seed's own begin;/commit; so it can be nested in one transaction.
  const seedBody = seedSql.replace(/\bbegin;\s*/i, '').replace(/\s*commit;\s*$/i, '');

  const endpoint = `https://api.supabase.com/v1/projects/${ref}/database/query`;
  const runQuery = async (query) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Management API ${response.status}: ${text.slice(0, 500)}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  console.log(`• Project ref: ${ref}`);
  console.log('• Reading current state…');
  const before = await runQuery(COUNT_SQL);
  const breakdown = (await runQuery(BREAKDOWN_SQL))?.[0] ?? {};
  const total = Number(breakdown.total ?? 0);
  const legacyDemo = Number(breakdown.legacy_demo ?? 0);
  const preserved = total - legacyDemo;

  console.log('  current rows:', before?.[0] ?? before);
  console.log(`  employers: ${total} total · ${legacyDemo} legacy demo · ${preserved} hand-created`);

  if (legacyDemo === 0) {
    console.error(
      '✗ None of the 12 legacy demo employer ids were found. Aborting so the new\n' +
        '  dataset is not inserted on top of the existing employers.',
    );
    process.exit(1);
  }
  if (legacyDemo < LEGACY_DEMO_IDS.length) {
    console.warn(
      `  ⚠ Only ${legacyDemo} of the ${LEGACY_DEMO_IDS.length} legacy demo ids matched — the rest were already removed.`,
    );
  }

  const employerDelete = deleteAll
    ? 'delete from public.employers;'
    : `delete from public.employers where id in (${LEGACY_IN_LIST});`;

  if (!confirmed) {
    console.log('');
    console.log('DRY RUN — nothing was changed. The reseed would:');
    console.log('  1. delete from public.activity_log  where user_id is null');
    console.log('  2. delete from public.filter_presets where user_id is null');
    if (deleteAll) {
      console.log(`  3. delete ALL ${total} employers (hand-created ones included)`);
    } else {
      console.log(`  3. delete the ${legacyDemo} legacy demo employers (cascades to their jobs,`);
      console.log('     contracts, fees, requirements, documents, notes, verification events)');
      if (preserved > 0) console.log(`     — preserving ${preserved} hand-created employer(s)`);
    }
    console.log(`  4. insert ${employerInserts} employers and their full dataset from supabase/seed.sql`);
    console.log('');
    console.log('Re-run with --yes to apply:  node scripts/reseed.mjs --yes');
    return;
  }

  console.log('• Applying the reseed in a single transaction…');
  const transaction = `begin;\n${CLEANUP_SHARED_SQL}\n${employerDelete}\n${seedBody}\ncommit;`;
  await runQuery(transaction);

  const after = await runQuery(COUNT_SQL);
  console.log('  after: ', after?.[0] ?? after);
  console.log('');
  console.log(`✓ Reseed complete — ${employerInserts} employers loaded.`);
}

main().catch((error) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
