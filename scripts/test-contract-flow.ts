/**
 * Contract approval-flow test.
 *
 * Exercises the real state-machine helpers the UI and store depend on:
 *   - `nextContractStatus`  — the manual Draft → Under Review → Active steps
 *   - `deriveContractStatus` — the end-date-driven projection (Active/Expiring/Expired)
 *
 * Run with:  node scripts/run-contract-flow-test.mjs
 */
import { CONTRACT_STEP_LABEL, deriveContractStatus, nextContractStatus } from '../src/lib/selectors';
import type { ContractStatus } from '../src/types';

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const iso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

console.log('\n[nextContractStatus] manual lifecycle steps');
check('Draft -> Under Review', nextContractStatus('Draft'), 'Under Review');
check('Under Review -> Active', nextContractStatus('Under Review'), 'Active');
for (const status of ['Active', 'Expiring Soon', 'Expired', 'Renewed'] as ContractStatus[]) {
  check(`${status} -> null (no manual step)`, nextContractStatus(status), null);
}

console.log('\n[CONTRACT_STEP_LABEL] button copy');
check('Draft label', CONTRACT_STEP_LABEL.Draft, 'Submit for review');
check('Under Review label', CONTRACT_STEP_LABEL['Under Review'], 'Approve & activate');

console.log('\n[deriveContractStatus] pinned states ignore the end date');
check('Draft pinned (future end)', deriveContractStatus('Draft', iso(365)), 'Draft');
check('Draft pinned (past end)', deriveContractStatus('Draft', iso(-10)), 'Draft');
check('Under Review pinned', deriveContractStatus('Under Review', iso(-10)), 'Under Review');
check('Renewed pinned', deriveContractStatus('Renewed', iso(365)), 'Renewed');

console.log('\n[deriveContractStatus] Active projects from the end date');
check('Active, 365d left', deriveContractStatus('Active', iso(365)), 'Active');
check('Active, 31d left', deriveContractStatus('Active', iso(31)), 'Active');
check('Active, 30d left', deriveContractStatus('Active', iso(30)), 'Expiring Soon');
check('Active, 5d left', deriveContractStatus('Active', iso(5)), 'Expiring Soon');
check('Active, overdue', deriveContractStatus('Active', iso(-1)), 'Expired');
check('no end date -> raw status', deriveContractStatus('Active', null), 'Active');

console.log('\n[end-to-end] Draft -> Under Review -> Active -> Expired');
let raw: ContractStatus = 'Draft';
const endDate = iso(365);
check('newly created shows', deriveContractStatus(raw, endDate), 'Draft');

let step = nextContractStatus(raw);
check('step 1 target', step, 'Under Review');
raw = step!;
check('after "Submit for review"', deriveContractStatus(raw, endDate), 'Under Review');

step = nextContractStatus(raw);
check('step 2 target', step, 'Active');
raw = step!;
check('after "Approve & activate"', deriveContractStatus(raw, endDate), 'Active');
check('no further manual step', nextContractStatus(raw), null);

check('time passes: 31d left', deriveContractStatus(raw, iso(31)), 'Active');
check('time passes: 29d left', deriveContractStatus(raw, iso(29)), 'Expiring Soon');
check('time passes: overdue', deriveContractStatus(raw, iso(-1)), 'Expired');

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
