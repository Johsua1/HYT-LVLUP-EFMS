/**
 * Auth error translation.
 *
 * Supabase Auth returns a machine-readable `code` and an HTTP `status` alongside
 * the raw `msg`. The raw message is written for developers ("email rate limit
 * exceeded"), so it is mapped here to something a member of staff can act on.
 *
 * Pure (no network, no Supabase client) so `scripts/test-security.ts` can cover
 * it. Anything not recognised falls through to `sanitizeBackendMessage`, which
 * already strips SQL/schema/infrastructure detail.
 */
import { sanitizeBackendMessage } from '@/lib/security';

/** The parts of an `AuthError` this module reads. */
interface AuthErrorShape {
  message?: unknown;
  code?: unknown;
  status?: unknown;
}

const MESSAGES = {
  /** Supabase Auth's project-wide hourly email quota (`email_sent`). */
  emailRateLimit:
    'Too many account emails have been requested in the last hour, so the mail service is paused. ' +
    'Wait up to an hour before trying again — or ask an administrator to reset your password from Staff Management.',
  requestRateLimit: 'Too many attempts from this device. Wait a few minutes, then try again.',
  invalidEmail: 'Enter a valid work email address.',
  deadLink: 'That reset link has expired or has already been used. Request a new one below.',
  expiredSession: 'Your session has expired. Sign in again.',
  samePassword: 'Choose a password you have not used before.',
  weakPassword:
    'That password does not meet the security requirements. Use at least 8 characters with a mix of letters, numbers or symbols.',
  badCredentials: 'Incorrect email or password.',
  emailNotConfirmed: 'Please confirm your email address before signing in.',
  network: 'Network error — check your connection and try again.',
  unknown: 'Something went wrong. Please try again.',
} as const;

function shape(error: unknown): { message: string; code: string | null; status: number | null } {
  if (!error) return { message: '', code: null, status: null };
  if (typeof error === 'string') return { message: error, code: null, status: null };
  const value = error as AuthErrorShape;
  return {
    message: typeof value.message === 'string' ? value.message : '',
    code: typeof value.code === 'string' ? value.code : null,
    status: typeof value.status === 'number' ? value.status : null,
  };
}

/**
 * Maps a Supabase Auth error to a short, actionable message.
 *
 * Order matters: the hourly email quota is checked before the generic 429
 * handler, and `invalid login credentials` is checked before the generic
 * fallback so the sign-in screen keeps its existing wording.
 */
export function describeAuthError(error: unknown): string {
  const { message, code, status } = shape(error);
  const key = `${code ?? ''} ${message}`;

  if (/over_email_send_rate_limit|email rate limit exceeded/i.test(key)) return MESSAGES.emailRateLimit;
  if (/over_request_rate_limit|too many requests/i.test(key) || status === 429) {
    return MESSAGES.requestRateLimit;
  }
  if (/email_address_invalid|validation_failed|unable to validate email/i.test(key)) {
    return MESSAGES.invalidEmail;
  }
  if (/otp_expired|flow_state_not_found|flow_state_expired|bad_code_verifier|pkce_code_verifier/i.test(key)) {
    return MESSAGES.deadLink;
  }
  if (/session_not_found|session_expired|refresh_token_not_found|bad_jwt|invalid claim/i.test(key)) {
    return MESSAGES.expiredSession;
  }
  if (/same_password/i.test(key)) return MESSAGES.samePassword;
  if (/weak_password|password should be|password is too (short|long)/i.test(key)) {
    return MESSAGES.weakPassword;
  }
  if (/invalid login credentials/i.test(key)) return MESSAGES.badCredentials;
  if (/email not confirmed/i.test(key)) return MESSAGES.emailNotConfirmed;
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(key)) return MESSAGES.network;

  return sanitizeBackendMessage(message || MESSAGES.unknown);
}

/* ------------------------------------------------------------------ */
/* Errors left on the URL by a failed email link                       */
/* ------------------------------------------------------------------ */

const LINK_ERROR_COPY: Record<string, string> = {
  otp_expired: 'That reset link has expired. Request a new one below.',
  access_denied: 'That reset link has already been used or is no longer valid. Request a new one below.',
  /* PKCE stores the code verifier in the browser that asked for the email, so
     a link opened elsewhere — or a second time — cannot be exchanged. */
  flow_state_not_found:
    'That link was opened in a different browser, or it has already been used. Request a new one below.',
  flow_state_expired: 'That reset link has expired. Request a new one below.',
  bad_code_verifier:
    'That link was opened in a different browser, or it has already been used. Request a new one below.',
  server_error: 'The sign-in service could not complete that link. Request a new one below.',
};

export interface AuthLinkError {
  code: string;
  message: string;
}

/**
 * Reads `?error=…&error_code=…&error_description=…` from a redirect URL.
 *
 * Supabase reports a dead/expired recovery link by redirecting back with those
 * query parameters instead of an HTTP error page. The SDK detects them during
 * initialisation but only logs the result, so the app would otherwise show the
 * landing page with no explanation.
 */
export function readAuthLinkError(search: string): AuthLinkError | null {
  const query = search.startsWith('?') ? search.slice(1) : search;
  if (!query) return null;
  const params = new URLSearchParams(query);
  const code = params.get('error_code') || params.get('error');
  if (!code) return null;
  return {
    code,
    message: LINK_ERROR_COPY[code] ?? 'That sign-in link is no longer valid. Request a new one below.',
  };
}

/* ------------------------------------------------------------------ */
/* Auth callbacks carried in the URL                                   */
/* ------------------------------------------------------------------ */

export interface AuthCallback {
  /** A dead/expired link reported by Supabase (`?error_code=…`). */
  error: AuthLinkError | null;
  /** `token_hash` from a custom recovery link, exchanged with `verifyOtp`. */
  recoveryToken: string | null;
  /**
   * True when the URL looks like it was meant to sign someone in. Used to
   * explain a silent failure instead of dropping the user on the landing page.
   */
  attempted: boolean;
  /** URL to replace the current one with (params stripped), or null. */
  cleanUrl: string | null;
}

/**
 * Reads an auth callback out of a full URL.
 *
 * Two link formats are understood:
 *   - `?code=…`      — the PKCE redirect from `{{ .ConfirmationURL }}`. Needs
 *                      the code verifier stored by the browser that requested
 *                      the email, so it is left for supabase-js to exchange.
 *   - `#/login?token_hash=…&type=recovery` — the custom link this app now puts
 *                      in the recovery email. Exchanged with `verifyOtp`, which
 *                      needs nothing from browser storage and therefore works
 *                      on a phone or in a mail app's browser.
 */
export function parseAuthCallback(href: string): AuthCallback {
  const url = new URL(href);
  const hash = url.hash;
  const queryAt = hash.indexOf('?');
  const hashQuery = queryAt >= 0 ? hash.slice(queryAt + 1) : '';
  const hashParams = new URLSearchParams(hashQuery);

  const get = (key: string) => url.searchParams.get(key) ?? hashParams.get(key);
  const has = (key: string) => url.searchParams.has(key) || hashParams.has(key);

  const error = readAuthLinkError(url.search) ?? readAuthLinkError(hashQuery);

  const tokenHash = get('token_hash');
  const type = get('type');
  const recoveryToken = tokenHash && (!type || type === 'recovery') ? tokenHash : null;

  const attempted = Boolean(
    error || recoveryToken || has('code') || has('access_token') || type === 'recovery',
  );

  /* Strip a spent token or a reported error so a refresh does not replay it,
     and put the app on the sign-in route — the only place that can explain a
     failure and offer a fresh link. A PKCE `code` is kept in the query (the SDK
     consumes it itself); only the route is set. */
  let cleanUrl: string | null = null;
  if (recoveryToken || error) {
    const clean = new URL(href);
    for (const key of ['token_hash', 'type', 'error', 'error_code', 'error_description']) {
      clean.searchParams.delete(key);
    }
    clean.hash = '#/login';
    cleanUrl = clean.toString();
  } else if (has('code')) {
    const clean = new URL(href);
    clean.hash = '#/login';
    cleanUrl = clean.toString();
  }

  return { error, recoveryToken, attempted, cleanUrl };
}
