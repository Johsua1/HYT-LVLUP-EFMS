/**
 * Security regression tests.
 *
 * Two layers, both runnable with no network and no database:
 *   1. Behavioural unit tests over the pure helpers in `src/lib/security.ts`
 *      (upload validation, password policy, error sanitisation, redirect
 *      allow-listing).
 *   2. Static assertions over the security-critical configuration files
 *      (migration, vercel headers, Supabase auth config, Edge Function), so a
 *      future edit that quietly removes a control fails this test.
 *
 * Run with:  npm run test:security
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  looksLikeInternalError,
  passwordProblem,
  resolveSafeRedirect,
  sanitizeBackendMessage,
  sanitizeStorageFileName,
  validateDocumentFile,
  emailProblem,
} from '../src/lib/security';
import { describeAuthError, parseAuthCallback, readAuthLinkError } from '../src/lib/authErrors';

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}\n        expected ${JSON.stringify(expected)}\n        got      ${JSON.stringify(actual)}`);
  }
}

function checkTrue(name: string, actual: boolean) {
  check(name, actual, true);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

/* ------------------------------------------------------------------ */
console.log('\n[upload] validateDocumentFile — accepted files');
const ok = (name: string, type: string, size = 1024) => validateDocumentFile({ name, type, size });
check('invoice.pdf', ok('invoice.pdf', 'application/pdf'), null);
check('photo.PNG (uppercase ext)', ok('photo.PNG', 'image/png'), null);
check('sheet.xlsx', ok('sheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), null);
check('doc with no MIME but valid ext', ok('notes.docx', ''), null);

console.log('\n[upload] validateDocumentFile — rejected files');
checkTrue('empty file', ok('a.pdf', 'application/pdf', 0) !== null);
checkTrue('over 10 MB', ok('big.pdf', 'application/pdf', 10 * 1024 * 1024 + 1) !== null);
checkTrue('no extension', ok('README', 'text/plain') !== null);
checkTrue('.exe', ok('malware.exe', 'application/octet-stream') !== null);
checkTrue('.svg (scriptable)', ok('logo.svg', 'image/svg+xml') !== null);
checkTrue('.html', ok('page.html', 'text/html') !== null);
checkTrue('.js', ok('app.js', 'application/javascript') !== null);
checkTrue('double extension .pdf.html', ok('invoice.pdf.html', 'application/pdf') !== null);
checkTrue('double extension .pdf.exe', ok('invoice.pdf.exe', 'application/pdf') !== null);
check('legitimate dotted name is kept', ok('my.file.pdf', 'application/pdf'), null);
check('date-prefixed name is kept', ok('2026.contract.pdf', 'application/pdf'), null);
checkTrue('mismatched declared MIME', ok('invoice.pdf', 'text/html') !== null);
checkTrue('path in name does not help', ok('../../etc/passwd.pdf', 'application/pdf') === null); // basename is passwd.pdf -> allowed

/* ------------------------------------------------------------------ */
console.log('\n[sanitize] sanitizeStorageFileName strips traversal and unsafe chars');
check('unix traversal', sanitizeStorageFileName('../../etc/passwd'), 'passwd');
check('windows traversal', sanitizeStorageFileName('..\\..\\win.ini'), 'win.ini');
check('spaces and parens', sanitizeStorageFileName('my file (1).pdf'), 'my_file_1_.pdf');
check('leading dots removed', sanitizeStorageFileName('...hidden.pdf'), 'hidden.pdf');
check('empty -> file', sanitizeStorageFileName('   '), 'file');
checkTrue('no slashes survive', !sanitizeStorageFileName('a/b/c.pdf').includes('/'));
checkTrue('no backslashes survive', !sanitizeStorageFileName('a\\b\\c.pdf').includes('\\'));

/* ------------------------------------------------------------------ */
console.log('\n[password] passwordProblem policy');
checkTrue('too short', passwordProblem('a1b2c3') !== null);
checkTrue('single character class', passwordProblem('aaaaaaaa') !== null);
checkTrue('digits only', passwordProblem('12345678') !== null);
checkTrue('too long', passwordProblem('Aa1'.repeat(60)) !== null);
check('letters + digits ok', passwordProblem('password1'), null);
check('upper + lower ok', passwordProblem('PasswordX'), null);
check('symbols ok', passwordProblem('passw0rd!'), null);

/* ------------------------------------------------------------------ */
console.log('\n[errors] sanitizeBackendMessage hides internals, keeps friendly ones');
check(
  'row level security',
  sanitizeBackendMessage('new row violates row-level security policy for table "employers"'),
  'You do not have permission to perform that action.',
);
check(
  'duplicate key',
  sanitizeBackendMessage('duplicate key value violates unique constraint "profiles_pkey"'),
  'A record with those details already exists.',
);
check(
  'missing relation',
  sanitizeBackendMessage('relation "public.employers" does not exist'),
  'Something went wrong. Please try again.',
);
check(
  'syntax error',
  sanitizeBackendMessage('syntax error at or near "SELECT"'),
  'Something went wrong. Please try again.',
);
check(
  'filesystem path',
  sanitizeBackendMessage('ENOENT: no such file or directory, open /usr/app/secret'),
  'Something went wrong. Please try again.',
);
check('friendly message passes through', sanitizeBackendMessage('Enter a valid email address'), 'Enter a valid email address');
checkTrue('looksLikeInternalError detects SQL', looksLikeInternalError('column "foo" does not exist'));
checkTrue('looksLikeInternalError ignores plain text', !looksLikeInternalError('Incorrect email or password.'));

/* ------------------------------------------------------------------ */
console.log('\n[email] emailProblem blocks the 400-causing submissions');
checkTrue('empty is rejected', emailProblem('') !== null);
checkTrue('whitespace only is rejected', emailProblem('   ') !== null);
checkTrue('no @ is rejected', emailProblem('not-an-email') !== null);
checkTrue('no TLD is rejected', emailProblem('name@company') !== null);
checkTrue('space inside is rejected', emailProblem('na me@company.com') !== null);
check('plain address is accepted', emailProblem('name@company.com'), null);
check('surrounding whitespace is tolerated', emailProblem('  name@company.com  '), null);
check('subdomain is accepted', emailProblem('name@mail.company.com.ph'), null);

/* ------------------------------------------------------------------ */
console.log('\n[auth] describeAuthError maps codes before raw messages');
checkTrue(
  'hourly email quota -> wait an hour',
  /hour/i.test(describeAuthError({ code: 'over_email_send_rate_limit', status: 429, message: 'email rate limit exceeded' })),
);
checkTrue(
  'message-only 429 is still recognised',
  /hour/i.test(describeAuthError({ message: 'email rate limit exceeded', status: 429 })),
);
checkTrue(
  'generic 429 does not claim the email quota',
  !/hour/i.test(describeAuthError({ code: 'over_request_rate_limit', status: 429, message: 'Too many requests' })),
);
check(
  'validation_failed email -> field message',
  describeAuthError({ code: 'validation_failed', message: 'Unable to validate email address: invalid format' }),
  'Enter a valid work email address.',
);
checkTrue('otp_expired -> link already used', /already been used|expired/i.test(describeAuthError({ code: 'otp_expired' })));
checkTrue(
  'flow_state_not_found -> link unusable',
  /expired|already been used/i.test(describeAuthError({ code: 'flow_state_not_found', message: 'invalid flow state' })),
);
check('same_password stays actionable', describeAuthError({ code: 'same_password', message: 'New password should be different from the old password.' }), 'Choose a password you have not used before.');
check('invalid login credentials keeps its wording', describeAuthError({ message: 'Invalid login credentials' }), 'Incorrect email or password.');
check('network failure is friendly', describeAuthError({ message: 'Failed to fetch' }), 'Network error — check your connection and try again.');
check(
  'internal detail is still suppressed',
  describeAuthError({ message: 'syntax error at or near "SELECT"' }),
  'Something went wrong. Please try again.',
);
checkTrue('empty error never echoes raw text', describeAuthError(null).length > 0);

console.log('\n[auth] readAuthLinkError parses the redirect parameters');
check(
  'error_code wins over error',
  readAuthLinkError('?error=access_denied&error_code=otp_expired&error_description=x')?.code,
  'otp_expired',
);
checkTrue(
  'expired link copy mentions requesting a new one',
  /request a new one/i.test(readAuthLinkError('?error_code=otp_expired')?.message ?? ''),
);
checkTrue(
  'unknown code still produces a message',
  (readAuthLinkError('?error_code=weird_thing')?.message ?? '').length > 0,
);
check('successful PKCE redirect has no error', readAuthLinkError('?code=abc-123'), null);
check('bare error is used when error_code is absent', readAuthLinkError('?error=access_denied')?.code, 'access_denied');
check('empty search is null', readAuthLinkError(''), null);

console.log('\n[auth] parseAuthCallback distinguishes the link formats');
const tokenLink = parseAuthCallback('https://app.example/#/login?token_hash=abc123&type=recovery');
check('token_hash link yields a token', tokenLink.recoveryToken, 'abc123');
checkTrue('token_hash link counts as an attempt', tokenLink.attempted);
checkTrue('token_hash link is cleaned to #/login', (tokenLink.cleanUrl ?? '').endsWith('#/login'));
checkTrue('token_hash link has no error', tokenLink.error === null);

const pkceLink = parseAuthCallback('https://app.example/?code=9f8e7d');
check('pkce code is not a token', pkceLink.recoveryToken, null);
checkTrue('pkce code counts as an attempt', pkceLink.attempted);
checkTrue('pkce code routes to sign-in', (pkceLink.cleanUrl ?? '').endsWith('#/login'));
checkTrue('pkce code survives for the SDK', (pkceLink.cleanUrl ?? '').includes('code=9f8e7d'));

const deadLink = parseAuthCallback('https://app.example/?error=access_denied&error_code=otp_expired');
check('dead link reports its code', deadLink.error?.code, 'otp_expired');
checkTrue('dead link counts as an attempt', deadLink.attempted);
checkTrue('dead link is cleaned to #/login', (deadLink.cleanUrl ?? '').endsWith('#/login'));

const hashError = parseAuthCallback('https://app.example/#/login?error_code=otp_expired');
check('error in the hash is found too', hashError.error?.code, 'otp_expired');

const inviteToken = parseAuthCallback('https://app.example/#/login?token_hash=abc&type=invite');
check('non-recovery token is ignored', inviteToken.recoveryToken, null);
checkTrue('non-recovery token is not treated as a callback', !inviteToken.attempted);

const plainVisit = parseAuthCallback('https://app.example/#/login');
check('plain visit is not an attempt', plainVisit.attempted, false);
check('plain visit has nothing to clean', plainVisit.cleanUrl, null);
check('plain visit has no token', plainVisit.recoveryToken, null);

/* ------------------------------------------------------------------ */
console.log('\n[redirect] resolveSafeRedirect only allows known origins');
const allowed = ['https://efms.levelup.example', 'http://localhost:5173'];
check('allowed origin kept', resolveSafeRedirect('https://efms.levelup.example/', allowed), 'https://efms.levelup.example/');
check('unknown origin falls back', resolveSafeRedirect('https://evil.example/phish', allowed), allowed[0]);
check('protocol-relative falls back', resolveSafeRedirect('//evil.example', allowed), allowed[0]);
check('javascript: falls back', resolveSafeRedirect('javascript:alert(1)', allowed), allowed[0]);
check('subdomain is not the same origin', resolveSafeRedirect('https://x.efms.levelup.example', allowed), allowed[0]);
check('null falls back', resolveSafeRedirect(null, allowed), allowed[0]);
check('empty list is safe', resolveSafeRedirect('https://evil.example', []), '');

/* ------------------------------------------------------------------ */
console.log('\n[static] migration 0003 enforces deny-by-default accounts');
const migration = read('supabase/migrations/0003_security_hardening.sql');
checkTrue('new accounts default to invited', /'invited'\s*\n?\s*\)/.test(migration) || migration.includes("'staff',\n    'invited'"));
checkTrue('guard requires invited_at', migration.includes('old.invited_at is not null'));
checkTrue('accept_invitation requires invited_at', migration.includes('and invited_at is not null'));
checkTrue('activity actor is forced server-side', migration.includes('force_activity_actor'));
checkTrue(
  'accept_invitation is not granted to anon/public',
  migration.includes('revoke all on function public.accept_invitation() from public, anon'),
);
checkTrue(
  'accept_invitation is granted to authenticated',
  migration.includes('grant execute on function public.accept_invitation() to authenticated'),
);

console.log('\n[static] vercel.json ships hardened headers');
const vercel = read('vercel.json');
checkTrue('Content-Security-Policy present', vercel.includes('Content-Security-Policy'));
checkTrue('CSP has frame-ancestors', vercel.includes('frame-ancestors'));
checkTrue('Strict-Transport-Security present', vercel.includes('Strict-Transport-Security'));
checkTrue('Permissions-Policy present', vercel.includes('Permissions-Policy'));
checkTrue('X-Frame-Options DENY', vercel.includes('"X-Frame-Options", "value": "DENY"'));

console.log('\n[static] Supabase auth config');
const config = read('supabase/config.toml');
checkTrue('public signup disabled', /^enable_signup = false/m.test(config));
checkTrue('email signup disabled', config.includes('enable_signup = false'));
checkTrue('password min length >= 8', /minimum_password_length = 8/.test(config));

/* A `{{ .ConfirmationURL }}` recovery link returns a PKCE code that only the
   requesting browser can exchange; the token_hash form works everywhere. */
console.log('\n[static] recovery email link');
const recoveryTemplate = read('supabase/templates/recovery.html');
checkTrue('uses token_hash', recoveryTemplate.includes('token_hash={{ .TokenHash }}'));
checkTrue('no ConfirmationURL left', !recoveryTemplate.includes('{{ .ConfirmationURL }}'));
checkTrue('lands on the sign-in route', recoveryTemplate.includes('#/login?token_hash='));
/* `.RedirectTo` follows the origin the app asked from (production, a preview
   deploy, or localhost); `.SiteURL` would always send users to one host. */
checkTrue('link follows the requesting origin', recoveryTemplate.includes('{{ .RedirectTo }}#/login?token_hash='));
checkTrue('no fixed SiteURL in the link', !recoveryTemplate.includes('{{ .SiteURL }}#/login'));

console.log('\n[static] admin-staff Edge Function');
const fn = read('supabase/functions/admin-staff/index.ts');
checkTrue('no unconditional wildcard CORS literal', !fn.includes("'Access-Control-Allow-Origin': '*'"));
checkTrue('redirect target is validated', fn.includes('function safeRedirect'));
checkTrue('password policy enforced server-side', fn.includes('function passwordProblem'));
checkTrue('raw errors are not echoed', fn.includes('function unexpected'));
checkTrue('AAL2 still required', fn.includes("claims?.aal !== 'aal2'"));

console.log('\n[static] no unsafe HTML sinks in the app');
const appFiles = [
  'src/App.tsx',
  'src/store/AppStore.tsx',
  'src/components/documents/DocumentManager.tsx',
  'src/components/admin/StaffManager.tsx',
];
checkTrue(
  'no dangerouslySetInnerHTML / innerHTML / eval in key files',
  appFiles.every((file) => {
    const src = read(file);
    return !/dangerouslySetInnerHTML|\.innerHTML|eval\(|new Function\(/.test(src);
  }),
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
