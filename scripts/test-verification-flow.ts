/**
 * Verification-workflow test.
 *
 * Covers `verificationStagesCompleted` — the helper that decides how many of the
 * five stages are done — plus the progress/header arithmetic the timeline derives
 * from it. The regression it guards: a `Verified` employer must show all five
 * stages complete at 100%, not four at 80%.
 *
 * Run with:  npm run test:verification
 */
import { VERIFICATION_STAGES } from '../src/lib/constants';
import { verificationStagesCompleted } from '../src/lib/selectors';
import type { VerificationStatus } from '../src/types';

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

const TOTAL = VERIFICATION_STAGES.length;
const progress = (verification: VerificationStatus, stage: number) =>
  Math.round((verificationStagesCompleted({ verification, verificationStage: stage }) / TOTAL) * 100);
const headerStage = (verification: VerificationStatus, stage: number) =>
  Math.min(verificationStagesCompleted({ verification, verificationStage: stage }) + 1, TOTAL);

console.log('\n[verificationStagesCompleted] completed stage count');
check('Verified @ 4 -> all stages', verificationStagesCompleted({ verification: 'Verified', verificationStage: 4 }), TOTAL);
check('Under Review @ 3 -> 3', verificationStagesCompleted({ verification: 'Under Review', verificationStage: 3 }), 3);
check('Pending @ 0 -> 0', verificationStagesCompleted({ verification: 'Pending', verificationStage: 0 }), 0);
check('On Hold @ 2 -> 2', verificationStagesCompleted({ verification: 'On Hold', verificationStage: 2 }), 2);
check('Rejected @ 3 -> 3', verificationStagesCompleted({ verification: 'Rejected', verificationStage: 3 }), 3);

console.log('\n[progress] the workflow bar');
check('just created', progress('Pending', 0), 0);
check('stage 3 of 5', progress('Under Review', 3), 60);
check('reached final stage, not verified', progress('On Hold', 4), 80);
check('Verified -> 100% (regression)', progress('Verified', 4), 100);

console.log('\n[header] "Stage N of 5 — status"');
check('just created', headerStage('Pending', 0), 1);
check('stage 3', headerStage('Under Review', 3), 4);
check('Verified', headerStage('Verified', 4), 5);

console.log('\n[timeline outcomes] Verified renders every stage complete');
const completed = verificationStagesCompleted({ verification: 'Verified', verificationStage: 4 });
const outcomes = VERIFICATION_STAGES.map((_, index) =>
  index < completed ? 'completed' : index === completed ? 'current' : 'pending',
);
check('stage count rendered complete', outcomes.filter((o) => o === 'completed').length, TOTAL);
check('no stage left in progress', outcomes.includes('current'), false);
check('no stage left not-started', outcomes.includes('pending'), false);
check('"Employer Approved" (last) is completed', outcomes[TOTAL - 1], 'completed');

console.log('\n[timeline outcomes] in-flight employer keeps a single current stage');
const inflight = verificationStagesCompleted({ verification: 'Under Review', verificationStage: 3 });
const inflightOutcomes = VERIFICATION_STAGES.map((_, index) =>
  index < inflight ? 'completed' : index === inflight ? 'current' : 'pending',
);
check('3 completed', inflightOutcomes.filter((o) => o === 'completed').length, 3);
check('1 in progress', inflightOutcomes.filter((o) => o === 'current').length, 1);
check('1 not started', inflightOutcomes.filter((o) => o === 'pending').length, 1);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
