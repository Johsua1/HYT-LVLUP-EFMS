/**
 * Inspect-guard test.
 *
 * Verifies which keyboard shortcuts the deterrent blocks, and — just as
 * important — which it leaves alone (so it never eats normal typing or
 * app shortcuts). The guard is cosmetic; this only checks the wiring is right.
 *
 * Run with:  npm run test:guard
 */
import { isBlockedShortcut, type KeyLike } from '../src/lib/inspectGuard';

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

const key = (code: string, opts: Partial<Omit<KeyLike, 'code'>> = {}): KeyLike => ({
  code,
  ctrlKey: false,
  shiftKey: false,
  metaKey: false,
  ...opts,
});

console.log('\n[blocked] DevTools / view-source shortcuts');
check('F12', isBlockedShortcut(key('F12')), true);
check('Ctrl+Shift+I (Chrome DevTools)', isBlockedShortcut(key('KeyI', { ctrlKey: true, shiftKey: true })), true);
check('Cmd+Shift+I (macOS)', isBlockedShortcut(key('KeyI', { metaKey: true, shiftKey: true })), true);
check('Ctrl+Shift+J (console)', isBlockedShortcut(key('KeyJ', { ctrlKey: true, shiftKey: true })), true);
check('Ctrl+Shift+C (inspect element)', isBlockedShortcut(key('KeyC', { ctrlKey: true, shiftKey: true })), true);
check('Ctrl+Shift+K (Firefox console)', isBlockedShortcut(key('KeyK', { ctrlKey: true, shiftKey: true })), true);
check('Ctrl+U (view source)', isBlockedShortcut(key('KeyU', { ctrlKey: true })), true);

console.log('\n[allowed] normal typing and app shortcuts');
check('plain "i"', isBlockedShortcut(key('KeyI')), false);
check('Ctrl+I (italic, no shift)', isBlockedShortcut(key('KeyI', { ctrlKey: true })), false);
check('Ctrl+Shift+U (not a DevTools key)', isBlockedShortcut(key('KeyU', { ctrlKey: true, shiftKey: true })), false);
check('Ctrl+Shift+P (browser menu)', isBlockedShortcut(key('KeyP', { ctrlKey: true, shiftKey: true })), false);
check('Ctrl+R (reload)', isBlockedShortcut(key('KeyR', { ctrlKey: true })), false);
check('F5 (reload)', isBlockedShortcut(key('F5')), false);
check('Ctrl+C (copy, no shift)', isBlockedShortcut(key('KeyC', { ctrlKey: true })), false);
check('Ctrl+V (paste)', isBlockedShortcut(key('KeyV', { ctrlKey: true })), false);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
