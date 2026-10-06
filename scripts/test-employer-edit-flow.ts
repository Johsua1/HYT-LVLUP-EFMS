/**
 * Employer-edit round-trip test.
 *
 * The registration/edit form presents one job order per employer — the
 * "primary" job — and `saveEmployer` must write back to that same row.
 * When an employer has several job orders (the seeds do), selecting a
 * different row on write makes an edit appear not to stick: the contract
 * updates, yet the form keeps showing the untouched job order's values.
 *
 * These cases pin the selection rule and its stability so read and write
 * cannot drift apart again.
 *
 * Run with:  npm run test:employer
 */
import type { EmployerRecord, JobOrder } from '../src/types';
import { draftFromRecord } from '../src/lib/employerDraft';
import { pickPrimaryJob } from '../src/lib/selectors';

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

function job(overrides: Partial<JobOrder> & { id: string }): JobOrder {
  return {
    employerId: 'emp-1',
    reference: overrides.id,
    position: 'Factory Worker',
    jobCategory: 'Production & Assembly',
    workersNeeded: 10,
    workersDeployed: 0,
    salaryMinLocal: 1000,
    salaryMaxLocal: 2000,
    currency: 'AED',
    salaryMinPhp: 15000,
    salaryMaxPhp: 30000,
    workingHours: '8 hours/day',
    overtime: 'Available',
    contractDurationMonths: 24,
    employmentType: 'Full-time',
    benefits: {
      accommodation: 'Not Provided',
      transportation: 'Not Provided',
      foodAllowance: 'Not Provided',
      healthInsurance: false,
      overtimePay: false,
      annualLeave: '0 days',
      airfare: 'Worker Paid',
    },
    requirements: [],
    status: 'Open',
    postedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

console.log('\n[pickPrimaryJob] empty and single job');
check('no jobs -> null', pickPrimaryJob([]), null);
const only = job({ id: 'a', workersNeeded: 5 });
check('single job -> itself', pickPrimaryJob([only])?.id, 'a');

console.log('\n[pickPrimaryJob] open orders win over closed ones');
const closedBig = job({ id: 'closed', status: 'On Hold', workersNeeded: 999 });
const openSmall = job({ id: 'open', status: 'Open', workersNeeded: 3 });
check('open beats a larger closed order', pickPrimaryJob([closedBig, openSmall])?.id, 'open');

console.log('\n[pickPrimaryJob] most workers wins among open orders');
const gulf = [
  job({ id: 'JO-0051', status: 'Open', workersNeeded: 70, contractDurationMonths: 24 }),
  job({ id: 'JO-0052', status: 'Open', workersNeeded: 35, contractDurationMonths: 24 }),
  job({ id: 'JO-0053', status: 'On Hold', workersNeeded: 70, contractDurationMonths: 36 }),
];
check('picks the open 70-worker order', pickPrimaryJob(gulf)?.id, 'JO-0051');

console.log('\n[edit round-trip] the edited row stays the primary job');
/* Simulate `saveEmployer`: change the duration on the job the form read. */
const chosen = pickPrimaryJob(gulf);
const edited = gulf.map((item) =>
  item.id === chosen?.id ? { ...item, contractDurationMonths: 36 } : item,
);
check('duration actually changed', edited.find((j) => j.id === 'JO-0051')?.contractDurationMonths, 36);
check('same row is still primary after the edit', pickPrimaryJob(edited)?.id, 'JO-0051');
check(
  'form would now read the new duration',
  pickPrimaryJob(edited)?.contractDurationMonths,
  36,
);

console.log('\n[draftFromRecord] duration is read from the contract, not the job');
/* The seeds let a job order and its contract carry different terms. The form
   must reflect the contract, which is the row `saveEmployer` actually edits. */
const recordOf = (contractMonths: number | null, jobMonths: number) =>
  ({
    employer: { companyName: 'Gulf Construction Services', status: 'Active', verification: 'Verified' },
    primaryJob: job({ id: 'JO-0051', contractDurationMonths: jobMonths }),
    fees: [],
    contract: contractMonths === null ? null : { durationMonths: contractMonths },
  }) as unknown as EmployerRecord;

check(
  'contract 36 vs job 24 -> form shows 3 years',
  draftFromRecord(recordOf(36, 24)).contractDurationMonths,
  36,
);
check(
  'no contract -> falls back to the job order',
  draftFromRecord(recordOf(null, 24)).contractDurationMonths,
  24,
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
