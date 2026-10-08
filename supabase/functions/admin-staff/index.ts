// ============================================================================
// EFMS — admin-staff Edge Function
// ============================================================================
// The ONLY place that performs privileged (service-role) user management.
// The service-role key lives in this function's environment — it is never sent
// to, or reachable from, the browser.
//
// Authorization (enforced here, server-side, on every call):
//   1. A valid Supabase access token must be present.
//   2. The token must be AAL2 — i.e. the admin completed their TOTP MFA step.
//   3. The caller's profile must be role = 'admin' AND status = 'active'.
//
// Actions (body.action):
//   invite        { email, fullName, jobTitle, role, tempPassword } → account + credentials email
//   resend_invite { userId }                           → new temp password + email
//   update        { userId, fullName, jobTitle, role } → edit staff
//   set_status    { userId, status }                   → 'active' | 'disabled'
//   delete        { userId }                           → remove account
//
// Invitation ordering (no email is sent unless the account really exists):
//   create auth user  →  create staff profile  →  verify profile
//                     →  send credentials email  →  return result to the admin
// If profile creation fails the auth user is rolled back and no email is sent.
// If only the email fails, the account is kept and the failure is reported
// separately so the admin can resend.
//
// The invitation email is sent by this function over SMTP (see _shared/mailer)
// because Supabase's own mailer only renders fixed templates and therefore
// cannot carry a per-recipient temporary password.
//
// Deploy:  npm run sb:functions:deploy
// ============================================================================

import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';
import { sendMail } from '../_shared/mailer.ts';
import { renderInvitationEmail } from '../_shared/invitation-email.ts';

/* ------------------------------------------------------------------ */
/* CORS                                                                */
/* ------------------------------------------------------------------ */
// Bearer-token auth (not cookies) already means a hostile origin cannot
// silently ride a victim's session, but the endpoint should still not advertise
// itself to the whole web. Origins come from SITE_URL / ALLOWED_ORIGINS; when
// nothing is configured we fall back to `*` so a deployment is never broken by
// a missing env var (set ALLOWED_ORIGINS on the hosted function to lock it down).
const LOCALHOST_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function allowedOrigins(): string[] {
  const raw = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const site = (Deno.env.get('SITE_URL') ?? '').trim();
  if (site) raw.push(site);
  const normalised = [...raw, ...LOCALHOST_ORIGINS].map((origin) => origin.replace(/\/+$/, ''));
  return [...new Set(normalised)];
}

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  const configured = allowedOrigins();
  const requestOrigin = (origin ?? '').replace(/\/+$/, '');
  const nonLocal = configured.filter((value) => !LOCALHOST_ORIGINS.includes(value));

  if (nonLocal.length === 0) {
    // Nothing configured — behave like before (`*`) rather than break the app.
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (requestOrigin && configured.includes(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;
  } else {
    headers['Access-Control-Allow-Origin'] = nonLocal[0];
  }
  return headers;
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

/** Decodes a JWT payload without verifying it (verification happens via getUser). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function initialsOf(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z ]/g, '');
  const first = cleaned.trim().charAt(0).toUpperCase();
  const second = (cleaned.match(/ ([a-zA-Z])/) || [])[1]?.toUpperCase() ?? '';
  return `${first}${second}` || 'ST';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Field limits — mirrored from the form, enforced again here so a direct API
   call cannot push oversized values into the database. */
const MAX_EMAIL = 254;
const MAX_NAME = 120;
const MAX_TITLE = 120;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

/** Same policy the client enforces: length plus at least two character classes. */
function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD) return `The password must be at least ${MIN_PASSWORD} characters.`;
  if (password.length > MAX_PASSWORD) return `The password must be at most ${MAX_PASSWORD} characters.`;
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (classes < 2) {
    return 'Use a mix of letters, numbers or symbols — a single character type is too easy to guess.';
  }
  return null;
}

/**
 * Logs the real error server-side and returns a generic message to the client.
 * Provider/database errors can name tables, columns or accounts, so they must
 * never be echoed verbatim.
 */
function unexpected(error: unknown, context: string): string {
  console.error(`[admin-staff] ${context}:`, error instanceof Error ? error.message : error);
  return 'The request could not be completed. Please try again.';
}

/** Only accept a redirect target on one of our own origins; otherwise use SITE_URL. */
function safeRedirect(candidate: unknown): string | undefined {
  const site = (Deno.env.get('SITE_URL') ?? '').trim() || undefined;
  const allowed = allowedOrigins();
  const fallback = site ?? allowed.find((origin) => !LOCALHOST_ORIGINS.includes(origin)) ?? allowed[0];
  if (typeof candidate !== 'string' || !candidate) return fallback;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return fallback;
    const normalise = (value: string) => value.replace(/\/+$/, '');
    return allowed.some((origin) => normalise(origin) === normalise(parsed.origin)) ? parsed.href : fallback;
  } catch {
    return fallback;
  }
}

interface AdminProfile {
  role: string;
  status: string;
}

interface MailResult {
  ok: boolean;
  error: string | null;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) return json({ error: 'Server is not configured' }, 500, origin);

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'Missing bearer token' }, 401, origin);

  const admin: SupabaseClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Verify the token really belongs to a live user.
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const caller: User | undefined = userData?.user ?? undefined;
  if (userError || !caller) {
    console.warn('[admin-staff] rejected: invalid or expired session');
    return json({ error: 'Invalid or expired session' }, 401, origin);
  }

  // 2. Require MFA (AAL2) — the server-side counterpart of the app's MFA gate.
  const claims = decodeJwtPayload(token);
  if (claims?.aal !== 'aal2') {
    console.warn(`[admin-staff] rejected: AAL1 session for user ${caller.id}`);
    return json({ error: 'Multi-factor authentication is required for this action' }, 403, origin);
  }

  // 3. Require an active administrator profile.
  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role, status')
    .eq('id', caller.id)
    .maybeSingle<AdminProfile>();
  if (!callerProfile || callerProfile.role !== 'admin' || callerProfile.status !== 'active') {
    console.warn(`[admin-staff] rejected: caller ${caller.id} is not an active admin`);
    return json({ error: 'Administrator privileges are required' }, 403, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, origin);
  }

  const action = String(body.action ?? '');
  const redirectTo = safeRedirect(body.redirectTo);

  try {
    switch (action) {
      case 'invite':
        return await inviteStaff(admin, caller.id, body, redirectTo, origin);
      case 'resend_invite':
        return await resendInvite(admin, body, redirectTo, origin);
      case 'update':
        return await updateStaff(admin, caller.id, body, origin);
      case 'set_status':
        return await setStaffStatus(admin, caller.id, body, origin);
      case 'delete':
        return await deleteStaff(admin, caller.id, body, origin);
      default:
        return json({ error: `Unknown action: ${action || '(none)'}` }, 400, origin);
    }
  } catch (error) {
    return json({ error: unexpected(error, `action "${action}"`) }, 500, origin);
  }
});

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

async function inviteStaff(
  admin: SupabaseClient,
  callerId: string,
  body: Record<string, unknown>,
  redirectTo: string | undefined,
  origin: string | null,
): Promise<Response> {
  const email = String(body.email ?? '').trim().toLowerCase();
  const fullName = String(body.fullName ?? '').trim();
  const jobTitle = String(body.jobTitle ?? '').trim();
  const role = body.role === 'admin' ? 'admin' : 'staff';
  const tempPassword = String(body.tempPassword ?? '');

  if (email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return json({ error: 'Enter a valid email address' }, 400, origin);
  }
  if (!fullName) return json({ error: 'Full name is required' }, 400, origin);
  if (fullName.length > MAX_NAME) return json({ error: 'That full name is too long.' }, 400, origin);
  if (jobTitle.length > MAX_TITLE) return json({ error: 'That job title is too long.' }, 400, origin);
  const pwProblem = passwordProblem(tempPassword);
  if (pwProblem) return json({ error: pwProblem }, 400, origin);

  // --- 1. Create the auth user with the temporary password. ----------------
  // The Admin API sends no email here — the credentials go out in step 4, only
  // after the profile exists, so a half-created account never receives mail.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, job_title: jobTitle, invited_by: callerId },
  });
  if (createError || !created?.user) {
    const duplicate = /already|registered|exists/i.test(createError?.message ?? '');
    if (!duplicate) console.error('[admin-staff] createUser failed:', createError?.message);
    return json(
      {
        error: duplicate
          ? 'A user with that email address already exists. Use "Resend invitation" instead.'
          : 'The account could not be created.',
      },
      duplicate ? 409 : 400,
      origin,
    );
  }

  const userId = created.user.id;

  // --- 2. Create the staff profile. ----------------------------------------
  // `invited_at` is what authorises this account to activate itself later; it
  // is only ever written here (service role), never by the account.
  const now = new Date().toISOString();
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      initials: initialsOf(fullName),
      job_title: jobTitle,
      role,
      status: 'invited',
      invited_at: now,
      activated_at: null,
      disabled_at: null,
    },
    { onConflict: 'id' },
  );
  if (profileError) {
    await rollbackUser(admin, userId);
    return json({ error: unexpected(profileError, 'profile upsert') }, 500, origin);
  }

  // --- 3. Verify the profile really exists before emailing. ----------------
  const { data: verified } = await admin
    .from('profiles')
    .select('id, status')
    .eq('id', userId)
    .maybeSingle<{ id: string; status: string }>();
  if (!verified) {
    await rollbackUser(admin, userId);
    return json({ error: 'The staff profile could not be verified, so no invitation was sent.' }, 500, origin);
  }

  // --- 4. Only now send the credentials email (login email + temp password). --
  const mail = await sendInvitationEmail({ email, fullName, tempPassword, redirectTo });

  return json(
    {
      ok: true,
      user: { id: userId, email },
      emailSent: mail.ok,
      warning: mail.ok
        ? null
        : `The account was created, but the invitation email could not be sent (${mail.error}). Share the temporary password with the staff member directly, or use "Resend".`,
    },
    200,
    origin,
  );
}

async function resendInvite(
  admin: SupabaseClient,
  body: Record<string, unknown>,
  redirectTo: string | undefined,
  origin: string | null,
): Promise<Response> {
  const userId = String(body.userId ?? '');
  if (!userId) return json({ error: 'userId is required' }, 400, origin);

  const { data: profile } = await admin
    .from('profiles')
    .select('email, full_name, status')
    .eq('id', userId)
    .maybeSingle<{ email: string; full_name: string; status: string }>();
  if (!profile?.email) return json({ error: 'That account has no email address on file' }, 400, origin);
  if (profile.status === 'disabled') {
    return json({ error: 'Re-enable this account before resending the invitation.' }, 400, origin);
  }
  if (profile.status !== 'invited') {
    return json(
      { error: 'This account is already active. Ask them to use "Forgot password" on the sign-in screen.' },
      400,
      origin,
    );
  }

  // No account is created here. A brand-new temporary password is issued
  // because the previous one is never stored — it only ever went out by email.
  const tempPassword = generateTempPassword();
  const { error: passwordError } = await admin.auth.admin.updateUserById(userId, {
    password: tempPassword,
  });
  if (passwordError) return json({ error: unexpected(passwordError, 'resend password') }, 500, origin);

  const mail = await sendInvitationEmail({
    email: profile.email,
    fullName: profile.full_name,
    tempPassword,
    redirectTo,
    resent: true,
  });
  if (!mail.ok) {
    return json(
      {
        ok: true,
        emailSent: false,
        warning: `A new temporary password was set, but the email could not be sent (${mail.error}). Try "Resend" again.`,
      },
      200,
      origin,
    );
  }

  await admin.from('profiles').update({ invited_at: new Date().toISOString() }).eq('id', userId);
  return json({ ok: true, emailSent: true }, 200, origin);
}

async function updateStaff(
  admin: SupabaseClient,
  callerId: string,
  body: Record<string, unknown>,
  origin: string | null,
): Promise<Response> {
  const userId = String(body.userId ?? '');
  if (!userId) return json({ error: 'userId is required' }, 400, origin);

  const patch: Record<string, unknown> = {};
  if (typeof body.fullName === 'string') {
    const fullName = body.fullName.trim();
    if (!fullName) return json({ error: 'Full name cannot be empty' }, 400, origin);
    if (fullName.length > MAX_NAME) return json({ error: 'That full name is too long.' }, 400, origin);
    patch.full_name = fullName;
    patch.initials = initialsOf(fullName);
  }
  if (typeof body.jobTitle === 'string') {
    const jobTitle = body.jobTitle.trim();
    if (jobTitle.length > MAX_TITLE) return json({ error: 'That job title is too long.' }, 400, origin);
    patch.job_title = jobTitle;
  }

  if (body.role === 'admin' || body.role === 'staff') {
    if (userId === callerId) return json({ error: 'You cannot change your own role' }, 400, origin);
    if (body.role === 'staff') {
      const guard = await wouldRemoveLastAdmin(admin, userId);
      if (guard) return json({ error: guard }, 400, origin);
    }
    patch.role = body.role;
  }

  if (Object.keys(patch).length === 0) return json({ error: 'Nothing to update' }, 400, origin);

  const { error } = await admin.from('profiles').update(patch).eq('id', userId);
  if (error) return json({ error: unexpected(error, 'update staff') }, 500, origin);
  return json({ ok: true }, 200, origin);
}

async function setStaffStatus(
  admin: SupabaseClient,
  callerId: string,
  body: Record<string, unknown>,
  origin: string | null,
): Promise<Response> {
  const userId = String(body.userId ?? '');
  const status = body.status === 'disabled' ? 'disabled' : body.status === 'active' ? 'active' : '';
  if (!userId) return json({ error: 'userId is required' }, 400, origin);
  if (!status) return json({ error: "status must be 'active' or 'disabled'" }, 400, origin);
  if (userId === callerId) return json({ error: 'You cannot change your own account status' }, 400, origin);

  if (status === 'disabled') {
    const guard = await wouldRemoveLastAdmin(admin, userId);
    if (guard) return json({ error: guard }, 400, origin);
  }

  const { error } = await admin
    .from('profiles')
    .update({
      status,
      disabled_at: status === 'disabled' ? new Date().toISOString() : null,
      ...(status === 'active' ? { activated_at: new Date().toISOString() } : {}),
    })
    .eq('id', userId);
  if (error) return json({ error: unexpected(error, 'set staff status') }, 500, origin);

  // Revoke the account's ability to refresh its session. A banned user cannot
  // sign in or mint new tokens; combined with RLS (which blocks every table for
  // a disabled profile) access stops immediately, not when the token expires.
  try {
    await admin.auth.admin.updateUserById(userId, {
      ban_duration: status === 'disabled' ? '876000h' : 'none',
    });
  } catch {
    /* Best effort — RLS already blocks the account. */
  }

  return json({ ok: true }, 200, origin);
}

async function deleteStaff(
  admin: SupabaseClient,
  callerId: string,
  body: Record<string, unknown>,
  origin: string | null,
): Promise<Response> {
  const userId = String(body.userId ?? '');
  if (!userId) return json({ error: 'userId is required' }, 400, origin);
  if (userId === callerId) return json({ error: 'You cannot delete your own account' }, 400, origin);

  const guard = await wouldRemoveLastAdmin(admin, userId);
  if (guard) return json({ error: guard }, 400, origin);

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return json({ error: unexpected(error, 'delete staff') }, 500, origin);
  return json({ ok: true }, 200, origin);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Sends the invitation email (login email + temporary password) over SMTP. The
 * account already exists by this point, so a failure here is reported
 * separately and the admin can resend.
 */
async function sendInvitationEmail(input: {
  email: string;
  fullName: string;
  tempPassword: string;
  redirectTo?: string;
  resent?: boolean;
}): Promise<MailResult> {
  const loginUrl = input.redirectTo || Deno.env.get('SITE_URL') || 'http://localhost:5173/';
  const { subject, html } = renderInvitationEmail({
    fullName: input.fullName,
    email: input.email,
    tempPassword: input.tempPassword,
    loginUrl,
    resent: input.resent,
  });
  const result = await sendMail({ to: input.email, subject, html });
  return { ok: result.ok, error: result.error };
}

/** 16 characters from an alphabet that omits easily-confused glyphs. */
function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** Best-effort rollback when a staff account is only half-created. */
async function rollbackUser(admin: SupabaseClient, userId: string): Promise<void> {
  try {
    await admin.auth.admin.deleteUser(userId);
  } catch {
    /* Nothing else we can do — the profile row never landed, so the account is unusable. */
  }
}

/** Returns an error string when disabling/demoting `userId` would leave zero active admins. */
async function wouldRemoveLastAdmin(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data: target } = await admin
    .from('profiles')
    .select('role, status')
    .eq('id', userId)
    .maybeSingle<AdminProfile>();
  if (!target || target.role !== 'admin' || target.status !== 'active') return null;

  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
    .eq('status', 'active')
    .neq('id', userId);

  return (count ?? 0) === 0 ? 'At least one active administrator must remain' : null;
}
