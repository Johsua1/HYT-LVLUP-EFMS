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

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

interface AdminProfile {
  role: string;
  status: string;
}

interface MailResult {
  ok: boolean;
  error: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) return json({ error: 'Server is not configured' }, 500);

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'Missing bearer token' }, 401);

  const admin: SupabaseClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Verify the token really belongs to a live user.
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const caller: User | undefined = userData?.user ?? undefined;
  if (userError || !caller) return json({ error: 'Invalid or expired session' }, 401);

  // 2. Require MFA (AAL2) — the server-side counterpart of the app's MFA gate.
  const claims = decodeJwtPayload(token);
  if (claims?.aal !== 'aal2') {
    return json({ error: 'Multi-factor authentication is required for this action' }, 403);
  }

  // 3. Require an active administrator profile.
  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role, status')
    .eq('id', caller.id)
    .maybeSingle<AdminProfile>();
  if (!callerProfile || callerProfile.role !== 'admin' || callerProfile.status !== 'active') {
    return json({ error: 'Administrator privileges are required' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const action = String(body.action ?? '');
  const redirectTo = typeof body.redirectTo === 'string' && body.redirectTo ? body.redirectTo : undefined;

  try {
    switch (action) {
      case 'invite':
        return await inviteStaff(admin, caller.id, body, redirectTo);
      case 'resend_invite':
        return await resendInvite(admin, body, redirectTo);
      case 'update':
        return await updateStaff(admin, caller.id, body);
      case 'set_status':
        return await setStaffStatus(admin, caller.id, body);
      case 'delete':
        return await deleteStaff(admin, caller.id, body);
      default:
        return json({ error: `Unknown action: ${action || '(none)'}` }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return json({ error: message }, 500);
  }
});

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

async function inviteStaff(
  admin: SupabaseClient,
  callerId: string,
  body: Record<string, unknown>,
  redirectTo?: string,
): Promise<Response> {
  const email = String(body.email ?? '').trim().toLowerCase();
  const fullName = String(body.fullName ?? '').trim();
  const jobTitle = String(body.jobTitle ?? '').trim();
  const role = body.role === 'admin' ? 'admin' : 'staff';
  const tempPassword = String(body.tempPassword ?? '');

  if (!EMAIL_RE.test(email)) return json({ error: 'Enter a valid email address' }, 400);
  if (!fullName) return json({ error: 'Full name is required' }, 400);
  if (tempPassword.length < 8) {
    return json({ error: 'The temporary password must be at least 8 characters.' }, 400);
  }

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
    return json(
      {
        error: duplicate
          ? 'A user with that email address already exists. Use "Resend invitation" instead.'
          : (createError?.message ?? 'The account could not be created.'),
      },
      duplicate ? 409 : 400,
    );
  }

  const userId = created.user.id;

  // --- 2. Create the staff profile. ----------------------------------------
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
    return json({ error: `Could not create the staff profile: ${profileError.message}` }, 500);
  }

  // --- 3. Verify the profile really exists before emailing. ----------------
  const { data: verified } = await admin
    .from('profiles')
    .select('id, status')
    .eq('id', userId)
    .maybeSingle<{ id: string; status: string }>();
  if (!verified) {
    await rollbackUser(admin, userId);
    return json({ error: 'The staff profile could not be verified, so no invitation was sent.' }, 500);
  }

  // --- 4. Only now send the credentials email (login email + temp password). --
  const mail = await sendInvitationEmail({ email, fullName, tempPassword, redirectTo });

  return json({
    ok: true,
    user: { id: userId, email },
    emailSent: mail.ok,
    warning: mail.ok
      ? null
      : `The account was created, but the invitation email could not be sent (${mail.error}). Share the temporary password with the staff member directly, or use "Resend".`,
  });
}

async function resendInvite(
  admin: SupabaseClient,
  body: Record<string, unknown>,
  redirectTo?: string,
): Promise<Response> {
  const userId = String(body.userId ?? '');
  if (!userId) return json({ error: 'userId is required' }, 400);

  const { data: profile } = await admin
    .from('profiles')
    .select('email, full_name, status')
    .eq('id', userId)
    .maybeSingle<{ email: string; full_name: string; status: string }>();
  if (!profile?.email) return json({ error: 'That account has no email address on file' }, 400);
  if (profile.status === 'disabled') {
    return json({ error: 'Re-enable this account before resending the invitation.' }, 400);
  }
  if (profile.status !== 'invited') {
    return json(
      { error: 'This account is already active. Ask them to use "Forgot password" on the sign-in screen.' },
      400,
    );
  }

  // No account is created here. A brand-new temporary password is issued
  // because the previous one is never stored — it only ever went out by email.
  const tempPassword = generateTempPassword();
  const { error: passwordError } = await admin.auth.admin.updateUserById(userId, {
    password: tempPassword,
  });
  if (passwordError) return json({ error: passwordError.message }, 500);

  const mail = await sendInvitationEmail({
    email: profile.email,
    fullName: profile.full_name,
    tempPassword,
    redirectTo,
    resent: true,
  });
  if (!mail.ok) {
    return json({
      ok: true,
      emailSent: false,
      warning: `A new temporary password was set, but the email could not be sent (${mail.error}). Try "Resend" again.`,
    });
  }

  await admin.from('profiles').update({ invited_at: new Date().toISOString() }).eq('id', userId);
  return json({ ok: true, emailSent: true });
}

async function updateStaff(
  admin: SupabaseClient,
  callerId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const userId = String(body.userId ?? '');
  if (!userId) return json({ error: 'userId is required' }, 400);

  const patch: Record<string, unknown> = {};
  if (typeof body.fullName === 'string') {
    const fullName = body.fullName.trim();
    if (!fullName) return json({ error: 'Full name cannot be empty' }, 400);
    patch.full_name = fullName;
    patch.initials = initialsOf(fullName);
  }
  if (typeof body.jobTitle === 'string') patch.job_title = body.jobTitle.trim();

  if (body.role === 'admin' || body.role === 'staff') {
    if (userId === callerId) return json({ error: 'You cannot change your own role' }, 400);
    if (body.role === 'staff') {
      const guard = await wouldRemoveLastAdmin(admin, userId);
      if (guard) return json({ error: guard }, 400);
    }
    patch.role = body.role;
  }

  if (Object.keys(patch).length === 0) return json({ error: 'Nothing to update' }, 400);

  const { error } = await admin.from('profiles').update(patch).eq('id', userId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

async function setStaffStatus(
  admin: SupabaseClient,
  callerId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const userId = String(body.userId ?? '');
  const status = body.status === 'disabled' ? 'disabled' : body.status === 'active' ? 'active' : '';
  if (!userId) return json({ error: 'userId is required' }, 400);
  if (!status) return json({ error: "status must be 'active' or 'disabled'" }, 400);
  if (userId === callerId) return json({ error: 'You cannot change your own account status' }, 400);

  if (status === 'disabled') {
    const guard = await wouldRemoveLastAdmin(admin, userId);
    if (guard) return json({ error: guard }, 400);
  }

  const { error } = await admin
    .from('profiles')
    .update({
      status,
      disabled_at: status === 'disabled' ? new Date().toISOString() : null,
      ...(status === 'active' ? { activated_at: new Date().toISOString() } : {}),
    })
    .eq('id', userId);
  if (error) return json({ error: error.message }, 500);

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

  return json({ ok: true });
}

async function deleteStaff(
  admin: SupabaseClient,
  callerId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const userId = String(body.userId ?? '');
  if (!userId) return json({ error: 'userId is required' }, 400);
  if (userId === callerId) return json({ error: 'You cannot delete your own account' }, 400);

  const guard = await wouldRemoveLastAdmin(admin, userId);
  if (guard) return json({ error: guard }, 400);

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
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
