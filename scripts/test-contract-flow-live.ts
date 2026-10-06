/**
 * Live end-to-end test of the contract approval flow.
 *
 * Signs in as the real admin (anon key + password → RLS-enforced session), then
 * drives a throwaway Draft contract through the exact UPDATE the store performs:
 *
 *   Draft ──submit──▶ Under Review ──approve──▶ Active
 *
 * Verifies the stored status, the signed-at stamp, the derived display status,
 * and that the activity_log insert the store relies on is permitted by RLS.
 * All test rows are removed afterwards (service-role cleanup).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { deriveContractStatus, nextContractStatus } from '../src/lib/selectors';

function loadEnv(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match) continue;
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      out[match[1]] = value;
    }
  } catch {
    /* file missing */
  }
  return out;
}

const env = { ...loadEnv('.env.local'), ...loadEnv('.env.admin.local') };
const url = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_ANON_KEY;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

let passed = 0;
let failed = 0;
const check = (name: string, actual: unknown, expected: unknown) => {
  if (actual === expected) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const iso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

if (!url || !anon) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(2);
}
if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
  console.error('Missing ADMIN_EMAIL / ADMIN_PASSWORD in .env.admin.local');
  process.exit(2);
}

const supabase = createClient(url, anon, { auth: { persistSession: false } });
const cleanup = serviceRole ? createClient(url, serviceRole, { auth: { persistSession: false } }) : null;

let employerId: string | null = null;

try {
  console.log('\n[setup] signing in with the admin account (anon key, RLS enforced)');
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  });
  if (authErr || !auth.session || !auth.user) {
    console.error(`  FAIL  sign-in: ${authErr?.message ?? 'no session'}`);
    process.exit(2);
  }
  const userId = auth.user.id;
  console.log(`  ok    signed in as ${auth.user.email}`);
  console.log(`  info  session aal = ${(auth.session as { aal?: string }).aal ?? 'unknown'} (RLS does not require aal2)`);

  console.log('\n[setup] creating a throwaway Draft contract');
  const { data: emp, error: empErr } = await supabase
    .from('employers')
    .insert({ company_name: 'ZZ TEST — Contract Flow', country: 'Japan', created_by: userId })
    .select('*')
    .single();
  check('employer insert', empErr, null);
  if (!emp) throw new Error(`employer insert failed: ${empErr?.message}`);
  employerId = emp.id;

  const { data: con, error: conErr } = await supabase
    .from('contracts')
    .insert({ employer_id: emp.id, contract_number: 'CT-TEST-FLOW', status: 'Draft', end_date: iso(365) })
    .select('*')
    .single();
  check('contract insert', conErr, null);
  if (!con) throw new Error(`contract insert failed: ${conErr?.message}`);

  console.log('\n[1] freshly created contract');
  check('stored status', con.status, 'Draft');
  check('derived display', deriveContractStatus(con.status, con.end_date), 'Draft');
  check('next manual step', nextContractStatus(con.status), 'Under Review');

  console.log('\n[2] submit for review  →  the store runs: update({status, signed_at})');
  const { data: s1, error: e1 } = await supabase
    .from('contracts')
    .update({ status: 'Under Review', signed_at: con.signed_at })
    .eq('id', con.id)
    .select('*')
    .single();
  check('update accepted (RLS + constraint)', e1, null);
  check('stored status', s1?.status, 'Under Review');
  check('derived display', deriveContractStatus(s1!.status, s1!.end_date), 'Under Review');
  check('next manual step', nextContractStatus(s1!.status), 'Active');

  console.log('\n[3] approve & activate  →  the store stamps signed_at');
  const { data: s2, error: e2 } = await supabase
    .from('contracts')
    .update({ status: 'Active', signed_at: con.signed_at ?? new Date().toISOString() })
    .eq('id', con.id)
    .select('*')
    .single();
  check('update accepted', e2, null);
  check('stored status', s2?.status, 'Active');
  check('signed_at stamped', Boolean(s2?.signed_at), true);
  check('derived display (future end)', deriveContractStatus(s2!.status, s2!.end_date), 'Active');
  check('no further manual step', nextContractStatus(s2!.status), null);

  console.log('\n[4] derived projection as the end date approaches');
  check('31 days left', deriveContractStatus('Active', iso(31)), 'Active');
  check('29 days left', deriveContractStatus('Active', iso(29)), 'Expiring Soon');
  check('overdue', deriveContractStatus('Active', iso(-1)), 'Expired');

  console.log('\n[5] activity_log insert (the audit entry the store writes)');
  const { error: actErr } = await supabase.from('activity_log').insert({
    user_id: userId,
    user_name: auth.user.user_metadata?.full_name ?? env.ADMIN_EMAIL,
    user_initials: 'ZZ',
    action: 'test: activated the contract',
    action_type: 'verified',
    employer_id: emp.id,
    employer_name: emp.company_name,
    detail: 'automated contract-flow test',
  });
  check('insert permitted by RLS', actErr, null);
} catch (err) {
  failed += 1;
  console.error(`  FAIL  unexpected: ${(err as Error).message}`);
} finally {
  console.log('\n[cleanup] removing throwaway rows');
  if (employerId) {
    const remover = cleanup ?? supabase;
    const { error: actDel } = await remover.from('activity_log').delete().eq('employer_id', employerId);
    const { error: empDel } = await remover.from('employers').delete().eq('id', employerId);
    check('activity rows removed', actDel, null);
    check('employer removed (cascades contract)', empDel, null);
    if (!cleanup) {
      console.log('  warn  no service-role key — activity row may remain (append-only RLS)');
    }
  }
  await supabase.auth.signOut();
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
