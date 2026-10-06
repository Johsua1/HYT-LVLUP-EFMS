/**
 * Document-name matching test.
 *
 * The upload dialog suggests the employer's checklist items as document names
 * and warns (without blocking) when the chosen file name shares nothing with
 * the chosen document name — so a "vacation-photo.jpg" filed as "Insurance
 * Documents" gets flagged. These cases pin the matcher's looseness: it must
 * catch the obvious mistakes without nagging about correctly named files.
 *
 * Run with:  npm run test:document
 */
import { fileNameMatchesDocument } from '../src/lib/utils';

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

console.log('\n[fileNameMatchesDocument] correctly named files pass');
check('insurance policy for Insurance Documents', fileNameMatchesDocument('insurance-policy-2026.pdf', 'Insurance Documents'), true);
check('company registration scan', fileNameMatchesDocument('SEC_Company_Registration.pdf', 'Company Registration'), true);
check('employment contract docx', fileNameMatchesDocument('Employment Contract (signed).docx', 'Employment Contract'), true);
check('salary sheet', fileNameMatchesDocument('salary-structure.xlsx', 'Salary Information'), true);
check('job order reference', fileNameMatchesDocument('job-order-2026-0121.pdf', 'Job Order'), true);
check('accommodation cert', fileNameMatchesDocument('accommodation_certificate.jpg', 'Accommodation Certificate'), true);

console.log('\n[fileNameMatchesDocument] unrelated files are flagged');
check('holiday photo', fileNameMatchesDocument('vacation-photo.jpg', 'Insurance Documents'), false);
check('random screenshot', fileNameMatchesDocument('Screenshot 2026-10-06 at 09.12.41.png', 'Company Registration'), false);
check('CV', fileNameMatchesDocument('my-cv-final.docx', 'Employment Contract'), false);

console.log('\n[fileNameMatchesDocument] separators, case and extension are ignored');
check('uppercase + underscores', fileNameMatchesDocument('VISA_INFORMATION.PDF', 'Visa Information'), true);
check('no extension', fileNameMatchesDocument('business documents', 'Business Documents'), true);
check('hyphenated', fileNameMatchesDocument('employer-identification.jpg', 'Employer Identification'), true);

console.log('\n[fileNameMatchesDocument] nothing to compare against -> no warning');
check('name is only noise words', fileNameMatchesDocument('anything-at-all.pdf', 'Documents'), true);
check('empty document name', fileNameMatchesDocument('anything.pdf', ''), true);
check('very short document name', fileNameMatchesDocument('anything.pdf', 'ID'), true);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
