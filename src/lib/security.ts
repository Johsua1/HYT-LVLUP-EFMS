/**
 * Client-side security helpers.
 *
 * These are *pure functions* (no network, no DOM) so they can be unit-tested
 * directly (see `scripts/test-security.ts`). None of them is a security
 * boundary on its own — the database (RLS), the storage bucket policy and the
 * `admin-staff` Edge Function are. They exist to fail fast, give honest error
 * messages, and avoid leaking internals to the UI.
 */

/* ------------------------------------------------------------------ */
/* File upload validation                                              */
/* ------------------------------------------------------------------ */

/** The subset of `File` this module needs — keeps it trivially testable. */
export interface UploadCandidate {
  name: string;
  size: number;
  type: string;
}

/** Max upload size in bytes — mirrors the `documents` bucket limit. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** MIME types accepted by the bucket and the upload form. */
export const ALLOWED_DOCUMENT_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/**
 * Extensions we accept. The bucket enforces MIME server-side, but the browser
 * MIME string is attacker-controlled, so the extension is checked too — and
 * anything that looks like a double extension (e.g. `invoice.pdf.html`) is
 * rejected outright.
 */
const ALLOWED_DOCUMENT_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'webp'];

const EXECUTABLE_EXT = new Set([
  'html', 'htm', 'xhtml', 'svg', 'xml', 'js', 'mjs', 'cjs', 'exe', 'dll', 'bat', 'cmd', 'com',
  'sh', 'ps1', 'php', 'phtml', 'jar', 'scr', 'msi', 'vbs', 'hta', 'apk', 'app', 'wasm',
]);

/** Returns the lower-case extension without the dot, or '' when there is none. */
function extensionOf(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

/**
 * Validates a file before upload. Returns a human-readable error, or null when
 * the file is acceptable. Deliberately conservative: a name with an executable
 * or script extension is rejected even if the declared MIME looks harmless.
 */
export function validateDocumentFile(file: UploadCandidate): string | null {
  if (!file.name || !file.name.trim()) return 'That file has no name.';
  if (file.size <= 0) return 'That file is empty.';
  if (file.size > MAX_DOCUMENT_BYTES) return 'That file is larger than the 10 MB limit.';

  const ext = extensionOf(file.name);
  if (!ext) return 'That file has no extension, so its type cannot be verified.';
  if (EXECUTABLE_EXT.has(ext)) {
    return 'That file type is not allowed. Use PDF, Word, Excel or an image.';
  }
  if (!ALLOWED_DOCUMENT_EXT.includes(ext)) {
    return 'That file type is not allowed. Use PDF, Word, Excel or an image.';
  }
  // A second, *known* extension before the final one (`x.pdf.html`, `x.doc.exe`)
  // is a classic upload-filter bypass. Only known document/executable
  // extensions count — so a legitimate dotted name like `my.file.pdf` is fine.
  const stem = file.name.slice(0, file.name.length - ext.length - 1);
  if (/\.[a-z0-9]{1,5}$/i.test(stem)) {
    const inner = extensionOf(stem);
    const knownInner = inner && (EXECUTABLE_EXT.has(inner) || ALLOWED_DOCUMENT_EXT.includes(inner));
    if (knownInner && inner !== ext) {
      return 'That file name has more than one extension. Rename it and try again.';
    }
  }
  // The declared MIME, when present, must also be on the allow-list. (The
  // bucket re-checks this server-side.)
  if (file.type && !(ALLOWED_DOCUMENT_MIME as readonly string[]).includes(file.type)) {
    return 'That file type is not allowed. Use PDF, Word, Excel or an image.';
  }
  return null;
}

/**
 * Builds a storage object name from a user-supplied file name: keeps only
 * `[a-zA-Z0-9._-]`, collapses everything else to `_`, and strips any path
 * separators so the object can never escape its `employers/<id>/` prefix.
 */
export function sanitizeStorageFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^[._]+/, '');
  return cleaned || 'file';
}

/* ------------------------------------------------------------------ */
/* Password strength                                                   */
/* ------------------------------------------------------------------ */

/**
 * Minimum viable password policy enforced in the UI. Supabase Auth is the real
 * gate (and should be configured to match); this keeps the forms honest and
 * gives a clear message. Requires length + a mix of character classes rather
 * than a single arbitrary rule.
 */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Choose a password of at least 8 characters.';
  if (password.length > 128) return 'That password is too long (128 characters maximum).';
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (classes < 2) {
    return 'Use a mix of letters, numbers or symbols — a single character type is too easy to guess.';
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Error message sanitisation                                          */
/* ------------------------------------------------------------------ */

/**
 * Patterns that betray internal implementation detail (SQL, schema, stack
 * traces, filesystem paths). Anything matching these is replaced with a
 * generic message so the UI never echoes database internals.
 */
const INTERNAL_ERROR_PATTERNS: RegExp[] = [
  /syntax error/i,
  /relation ".*" does not exist/i,
  /column ".*" does not exist/i,
  /invalid input syntax/i,
  /violates .*constraint/i,
  /value too long/i,
  /null value in column/i,
  /\bpg_[a-z]+/i,
  /\bpostgres\b/i,
  /stack trace/i,
  /\/usr\/|\/var\/|[A-Za-z]:\\/,
  /ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i,
];

/** True when a message looks like it leaks server internals. */
export function looksLikeInternalError(message: string): boolean {
  return INTERNAL_ERROR_PATTERNS.some((re) => re.test(message));
}

/**
 * Maps a backend error message to something safe to show a user. Known,
 * actionable PostgREST/Supabase messages are translated; anything that looks
 * like it leaks schema, SQL or infrastructure detail is replaced.
 */
export function sanitizeBackendMessage(message: string): string {
  if (!message) return 'Something went wrong.';
  if (/row-level security|permission denied|violates row-level/i.test(message)) {
    return 'You do not have permission to perform that action.';
  }
  if (/duplicate key value/i.test(message)) {
    return 'A record with those details already exists.';
  }
  if (/foreign key/i.test(message)) {
    return 'That record is still referenced by other data and cannot be changed.';
  }
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    return 'Network error — check your connection and try again.';
  }
  if (looksLikeInternalError(message)) {
    return 'Something went wrong. Please try again.';
  }
  return message;
}

/* ------------------------------------------------------------------ */
/* Safe redirects                                                      */
/* ------------------------------------------------------------------ */

/**
 * Resolves a caller-supplied redirect target against an allow-list. Only exact
 * origin matches (scheme + host + port) are accepted; anything else — a
 * different host, a protocol-relative `//evil.com`, or a `javascript:` URL —
 * falls back to the first allowed origin. Used to keep the invitation email
 * link from being turned into a phishing vector.
 */
export function resolveSafeRedirect(candidate: string | null | undefined, allowedOrigins: string[]): string {
  const fallback = allowedOrigins[0] ?? '';
  if (!candidate) return fallback;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return fallback;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return fallback;
  const normalise = (value: string) => value.replace(/\/+$/, '');
  const ok = allowedOrigins.some((origin) => normalise(origin) === normalise(parsed.origin));
  return ok ? parsed.href : fallback;
}
