import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Single shared Supabase client.
 *
 * Only the URL and anon (public) key are used in the browser. The anon key is
 * safe to ship because every table is protected by Row Level Security — it can
 * only do what the signed-in user is allowed to do. The `service_role` key must
 * never appear in this project.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True once `.env.local` has real credentials. Gates the whole app. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/* A harmless placeholder keeps the client constructible when the env is not
   filled in yet — the app shows a setup screen instead of calling it. */
export const supabase: SupabaseClient = createClient(
  url || 'http://localhost:54321',
  anonKey || 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      /* PKCE keeps the password-recovery redirect to a `?code=` query param,
         which survives the HashRouter without clobbering the route fragment. */
      flowType: 'pkce',
    },
  },
);

/** The private bucket that stores uploaded compliance documents. */
export const DOCUMENTS_BUCKET = 'documents';

/**
 * Creates a short-lived signed URL for a private storage object. The bucket is
 * private, so downloads must go through this rather than a public URL.
 */
export async function createDocumentSignedUrl(
  path: string,
  expiresInSeconds = 60,
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return { url: null, error: describeError(error) };
  return { url: data?.signedUrl ?? null, error: null };
}

/** Max upload size in bytes — mirrors the bucket limit set in the migration. */
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
 * Turns a Supabase/PostgREST error into a message that is useful to a person
 * without leaking schema or policy internals.
 */
export function describeError(error: unknown): string {
  if (!error) return 'Something went wrong.';
  const message =
    typeof error === 'string'
      ? error
      : typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'Unexpected error.';

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
  return message;
}

/** Where Supabase sends users after an invite or password-recovery email. */
export const AUTH_REDIRECT_URL = `${window.location.origin}/`;

export interface FunctionResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Invokes the privileged `admin-staff` Edge Function. All staff account
 * management (invite / edit / disable / reset / delete) goes through here so
 * the service-role key never reaches the browser. The signed-in user's access
 * token is attached automatically, and the function independently re-checks
 * that the caller is an MFA-verified administrator.
 */
export async function invokeAdminStaff<T = Record<string, unknown>>(
  body: Record<string, unknown>,
): Promise<FunctionResult<T>> {
  const { data, error } = await supabase.functions.invoke('admin-staff', {
    body: { ...body, redirectTo: body.redirectTo ?? AUTH_REDIRECT_URL },
  });

  if (error) {
    let message = error.message || 'The request could not be completed.';
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const payload = (await context.clone().json()) as { error?: string };
        if (payload?.error) message = payload.error;
      } catch {
        /* Fall back to the transport message. */
      }
    }
    if (/failed to send a request to the edge function|edge function returned a non-2xx/i.test(message)) {
      message = 'The staff service is unavailable. Make sure the "admin-staff" Edge Function is deployed.';
    }
    return { data: null, error: message };
  }

  if (data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)) {
    return { data: null, error: String((data as { error: unknown }).error) };
  }
  return { data: (data as T) ?? null, error: null };
}
