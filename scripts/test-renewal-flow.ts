/**
 * Contract renewal-flow test.
 *
 * Exercises the pure date maths the renewal action depends on:
 *   - `addMonths`    — calendar-month addition with end-of-month clamping
 *   - `renewalTerm`  — the start/end dates of a renewed term
 *
 * It also proves the renewed term actually derives back to an `Active`
 * contract, which is what returns the employer to good standing.
 *
 * Run with:  npm run test:renewal
 */
import { addMonths } from '../src/lib/utils';
import { deriveContractStatus, renewalTerm } from '../src/lib/selectors';

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

/* A fixed clock keeps every assertion deterministic. */
const NOW = new Date('2026-06-15T00:00:00.000Z');
const at = (iso: string) => new Date(iso).toISOString();

console.log('\n[addMonths] whole calendar months');
check('+12 months', addMonths('2026-01-15T00:00:00.000Z', 12), at('2027-01-15T00:00:00.000Z'));
check('+24 months', addMonths('2026-01-15T00:00:00.000Z', 24), at('2028-01-15T00:00:00.000Z'));
check('+0 months is identity', addMonths('2026-01-15T00:00:00.000Z', 0), at('2026-01-15T00:00:00.000Z'));

console.log('\n[addMonths] end-of-month clamping');
check('31 Jan + 1 month -> 28 Feb', addMonths('2026-01-31T00:00:00.000Z', 1), at('2026-02-28T00:00:00.000Z'));
check('31 Jan + 1 month (leap) -> 29 Feb', addMonths('2024-01-31T00:00:00.000Z', 1), at('2024-02-29T00:00:00.000Z'));
check('31 Mar + 1 month -> 30 Apr', addMonths('2026-03-31T00:00:00.000Z', 1), at('2026-04-30T00:00:00.000Z'));
check('30 Apr + 1 month -> 30 May', addMonths('2026-04-30T00:00:00.000Z', 1), at('2026-05-30T00:00:00.000Z'));

console.log('\n[renewalTerm] lapsed contract restarts today');
const lapsed = renewalTerm('2026-01-01T00:00:00.000Z', 12, NOW);
check('start = now', lapsed.startDate, NOW.toISOString());
check('end = now + duration', lapsed.endDate, at('2027-06-15T00:00:00.000Z'));

console.log('\n[renewalTerm] early renewal is continuous (no gap)');
const early = renewalTerm('2026-09-01T00:00:00.000Z', 6, NOW);
check('start = old end date', early.startDate, at('2026-09-01T00:00:00.000Z'));
check('end = old end + duration', early.endDate, at('2027-03-01T00:00:00.000Z'));

console.log('\n[renewalTerm] null end date falls back to today');
const noEnd = renewalTerm(null, 24, NOW);
check('start = now', noEnd.startDate, NOW.toISOString());
check('end = now + 24 months', noEnd.endDate, at('2028-06-15T00:00:00.000Z'));

console.log('\n[end-to-end] renewed term derives back to Active');
const renewed = renewalTerm(null, 12); // real clock: a full year ahead
check('renewed end is Active', deriveContractStatus('Active', renewed.endDate), 'Active');
check('expired end is Expired', deriveContractStatus('Active', '2020-01-01T00:00:00.000Z'), 'Expired');

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
