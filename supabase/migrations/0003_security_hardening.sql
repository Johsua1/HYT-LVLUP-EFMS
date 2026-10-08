-- ============================================================================
-- EFMS — Migration 0003: deny-by-default account creation & audit integrity
-- ============================================================================
-- Hardening that makes the account model *fail closed*. 0002 already removed
-- the "first user is admin" bootstrap and disabled public registration in the
-- app, but two defaults still failed open:
--
--   • `handle_new_user()` created every new auth user as an ACTIVE staff
--     profile. If public sign-up were ever enabled (a dashboard toggle, or a
--     second project restored from this repo), anyone could self-register and
--     immediately read/write the whole agency dataset.
--   • An account could promote itself `invited → active` with a plain UPDATE
--     on its own profile row (the RLS policy allows self-updates and the guard
--     trigger allowed the transition), so `accept_invitation()` was not the
--     only path to activation.
--
-- This migration changes the default to `invited`, and only lets an account
-- activate itself when an administrator actually invited it (proved by
-- `invited_at`, which is written solely by the `admin-staff` Edge Function /
-- `scripts/create-admin.mjs`, both of which run with the service role).
--
-- It also makes the shared activity log trustworthy: the actor name is taken
-- from the caller's profile server-side instead of being trusted from the
-- request body.
--
-- Safe to run after 0002_auth_hardening.sql. Idempotent where practical.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. handle_new_user: new accounts are INVITED, never active, by default
-- ----------------------------------------------------------------------------
-- A freshly created auth user cannot touch agency data until an administrator
-- has invited them (which stamps `invited_at`). This closes the fail-open
-- default without changing the invitation flow: the Edge Function upserts the
-- profile with `status = 'invited'` and a real `invited_at` immediately after
-- creating the account, and `scripts/create-admin.mjs` upserts `status='active'`
-- with the service role (which the guard trigger treats as trusted).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_initials  text;
begin
  v_full_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
  v_initials  := upper(
                   left(regexp_replace(v_full_name, '[^a-zA-Z ]', '', 'g'), 1) ||
                   coalesce(substring(regexp_replace(v_full_name, '[^a-zA-Z ]', '', 'g') from ' ([a-zA-Z])'), '')
                 );

  -- Fail closed: no self-service activation. `invited_at` is deliberately left
  -- NULL here; only the service-role paths set it, and only an account with a
  -- non-null `invited_at` may later promote itself to `active`.
  insert into public.profiles (id, email, full_name, initials, job_title, role, status)
  values (
    new.id,
    coalesce(new.email, ''),
    v_full_name,
    v_initials,
    coalesce(new.raw_user_meta_data ->> 'job_title', ''),
    'staff',
    'invited'
  )
  on conflict (id) do nothing;

  insert into public.app_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.notifications (user_id, category, title, message, severity)
  values
    (new.id, 'System', 'Welcome to EFMS',
     'Your account is ready. Start by reviewing the employer database or registering a new employer.',
     'success');

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Backfill: never lock out an account that is already legitimately invited
-- ----------------------------------------------------------------------------
-- Existing invited rows were all created by the Edge Function (which sets
-- `invited_at`), so this is normally a no-op. It guarantees that any invited
-- row predating this migration still satisfies the new activation rule.
update public.profiles
   set invited_at = now()
 where status = 'invited'
   and invited_at is null;

-- ----------------------------------------------------------------------------
-- 3. guard_profile_privileges: self-activation requires a real invitation
-- ----------------------------------------------------------------------------
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  -- No JWT subject = service role / direct SQL (migrations, admin bootstrap,
  -- Edge Functions using the service key). Those paths are already trusted and
  -- are the only way an admin account can be created or promoted.
  if v_uid is null then
    return new;
  end if;

  -- Invited staff may complete their own onboarding exactly once — but only if
  -- an administrator actually invited them. `invited_at` is written solely by
  -- the service-role invitation path, so a self-registered account (whose
  -- invited_at is NULL) can never promote itself to active.
  if new.id = v_uid
     and old.status = 'invited'
     and new.status = 'active'
     and old.invited_at is not null
     and new.role is not distinct from old.role then
    return new;
  end if;

  -- Nobody may change their own role, account status or email mirror.
  if new.id = v_uid
     and (new.role is distinct from old.role
          or new.status is distinct from old.status
          or new.email is distinct from old.email) then
    raise exception 'You cannot change your own role, account status or email';
  end if;

  -- Only an active admin may change someone else's role, status or email.
  if (new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.email is distinct from old.email)
     and not public.is_admin() then
    raise exception 'Only administrators can change a user role, account status or email';
  end if;

  -- Never allow the workspace to lose its last active administrator.
  if old.role = 'admin'
     and old.status = 'active'
     and (new.role <> 'admin' or new.status <> 'active') then
    if not exists (
      select 1 from public.profiles
      where role = 'admin' and status = 'active' and id <> old.id
    ) then
      raise exception 'At least one active administrator must remain';
    end if;
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. accept_invitation(): same invitation requirement
-- ----------------------------------------------------------------------------
create or replace function public.accept_invitation()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set status = 'active',
         activated_at = coalesce(activated_at, now())
   where id = auth.uid()
     and status = 'invited'
     and invited_at is not null;
$$;

revoke all on function public.accept_invitation() from public;
grant execute on function public.accept_invitation() to authenticated;

-- ----------------------------------------------------------------------------
-- 5. activity_log: server-side attribution (no client-forged actor names)
-- ----------------------------------------------------------------------------
-- The insert policy already pins `user_id` to the caller, but `user_name` and
-- `user_initials` were taken verbatim from the request body, so a user could
-- file log entries under someone else's name. Override them from the caller's
-- profile whenever a JWT subject is present. Service-role / seed inserts
-- (auth.uid() is null) are left untouched.
create or replace function public.force_activity_actor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_name     text;
  v_initials text;
begin
  if v_uid is null then
    return new;
  end if;

  select coalesce(nullif(p.full_name, ''), nullif(p.email, ''), 'Unknown user'),
         coalesce(p.initials, '')
    into v_name, v_initials
    from public.profiles p
   where p.id = v_uid;

  new.user_id := v_uid;
  if v_name is not null then
    new.user_name := v_name;
    new.user_initials := v_initials;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_activity_log_actor on public.activity_log;
create trigger trg_activity_log_actor
  before insert on public.activity_log
  for each row execute function public.force_activity_actor();

-- ----------------------------------------------------------------------------
-- 6. Least privilege on callable helper functions
-- ----------------------------------------------------------------------------
-- `accept_invitation()` is a SECURITY DEFINER function that can be meaningfully
-- invoked over the API, so it is callable by `authenticated` only (never `anon`
-- or the general `public`). It is safe to expose because it can only ever act
-- on the caller's own row and only when `invited_at` is set.
--
-- The trigger functions (`handle_new_user`, `set_updated_at`,
-- `guard_profile_privileges`, `force_activity_actor`) are deliberately NOT
-- revoked: a trigger function cannot be called as an RPC (PostgREST/the API
-- rejects a direct call to a `returns trigger` function), so revoking EXECUTE
-- adds no protection while risking interference with trigger execution.
revoke all on function public.accept_invitation() from public, anon;
grant execute on function public.accept_invitation() to authenticated;

-- ============================================================================
-- Operational reminder (NOT done by this migration — hosted dashboard only):
--   Authentication → Providers → Email → disable "Enable sign-ups".
-- The app no longer *depends* on that being off, but keeping it off is still
-- the first line of defence.
-- ============================================================================
