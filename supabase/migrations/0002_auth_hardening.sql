-- ============================================================================
-- EFMS — Migration 0002: authentication & authorization hardening
-- ============================================================================
-- Replaces the "first user to register becomes admin" bootstrap with a real,
-- admin-controlled account model:
--
--   • No public staff self-registration. Accounts are created by an
--     administrator through the `admin-staff` Edge Function (service role).
--   • Profiles gain an account status (`invited | active | disabled`).
--   • Disabled accounts are blocked at the database level by RLS, not just in
--     the UI — a stolen/expired-but-valid JWT still cannot read or write.
--   • Role and status can only be changed by an active admin, never by the
--     account itself, and the last active admin cannot be removed.
--   • Invited staff promote themselves `invited → active` exactly once, via
--     the `accept_invitation()` RPC, after they set a password.
--
-- Safe to run after 0001_init.sql. Idempotent where practical.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles: account status columns
-- ----------------------------------------------------------------------------
alter table public.profiles add column if not exists status       text        not null default 'active';
alter table public.profiles add column if not exists invited_at   timestamptz;
alter table public.profiles add column if not exists activated_at timestamptz;
alter table public.profiles add column if not exists disabled_at  timestamptz;

do $$
begin
  alter table public.profiles
    add constraint profiles_status_check check (status in ('invited', 'active', 'disabled'));
exception
  when duplicate_object then null;
end $$;

-- Any pre-existing rows (created by the old bootstrap) are treated as active.
update public.profiles set status = 'active' where status is null;

create index if not exists idx_profiles_status on public.profiles (status);
create index if not exists idx_profiles_role   on public.profiles (role);

-- ----------------------------------------------------------------------------
-- 2. Authorization helpers
-- ----------------------------------------------------------------------------

-- An active admin: the only role allowed to manage the team or invite staff.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

-- Any non-disabled member may use agency data. Invited users are *not* active
-- yet: they cannot touch agency tables until they complete account setup.
create or replace function public.is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'active'
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. handle_new_user: no self-service admin, no trust in client metadata
-- ----------------------------------------------------------------------------
-- Every account starts as an ordinary, active staff profile. Administrators
-- are only created out-of-band by the service role (see scripts/create-admin.mjs),
-- so a crafted `signUp({ options: { data: { role: 'admin' } } })` can never
-- escalate privileges. The admin-staff Edge Function then flips invited staff
-- to `status = 'invited'`.
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

  insert into public.profiles (id, email, full_name, initials, job_title, role, status, activated_at)
  values (
    new.id,
    coalesce(new.email, ''),
    v_full_name,
    v_initials,
    coalesce(new.raw_user_meta_data ->> 'job_title', ''),
    'staff',
    'active',
    now()
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
-- 4. Guard: who may change role / status
-- ----------------------------------------------------------------------------
drop trigger if exists trg_profiles_guard_role on public.profiles;
drop function if exists public.guard_profile_role();

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

  -- Invited staff may complete their own onboarding exactly once.
  if new.id = v_uid
     and old.status = 'invited'
     and new.status = 'active'
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

drop trigger if exists trg_profiles_guard_privileges on public.profiles;
create trigger trg_profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ----------------------------------------------------------------------------
-- 5. accept_invitation(): self-service invited → active, exactly once
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
     and status = 'invited';
$$;

revoke all on function public.accept_invitation() from public;
grant execute on function public.accept_invitation() to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Row Level Security — re-point at the active-account check
-- ----------------------------------------------------------------------------

-- profiles -------------------------------------------------------------------
drop policy if exists profiles_select        on public.profiles;
drop policy if exists profiles_update_self   on public.profiles;
drop policy if exists profiles_update_admin  on public.profiles;
drop policy if exists profiles_delete_admin  on public.profiles;

-- A member can always read their own row (so the app can show "disabled"),
-- and any active member can read the directory needed for the team list.
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_active());

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy profiles_delete_admin on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- Note: there is deliberately NO insert policy. Profile rows are only created
-- by the SECURITY DEFINER trigger, so a client cannot forge a profile (or an
-- admin role) by inserting a row directly.

-- app_settings ---------------------------------------------------------------
drop policy if exists app_settings_all on public.app_settings;
create policy app_settings_all on public.app_settings
  for all to authenticated
  using (user_id = auth.uid() and public.is_active())
  with check (user_id = auth.uid() and public.is_active());

-- shared agency data ---------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'employers', 'job_orders', 'contracts', 'fees', 'requirements',
    'documents', 'notes', 'verification_events'
  ]
  loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('drop policy if exists %I_write  on public.%I', t, t);
    execute format(
      'create policy %I_select on public.%I for select to authenticated using (public.is_active())', t, t);
    execute format(
      'create policy %I_write on public.%I for all to authenticated using (public.is_active()) with check (public.is_active())',
      t, t);
  end loop;
end $$;

-- shortlist (per user) -------------------------------------------------------
drop policy if exists shortlist_all on public.shortlist;
create policy shortlist_all on public.shortlist
  for all to authenticated
  using (user_id = auth.uid() and public.is_active())
  with check (user_id = auth.uid() and public.is_active());

-- filter_presets -------------------------------------------------------------
drop policy if exists filter_presets_select on public.filter_presets;
drop policy if exists filter_presets_write  on public.filter_presets;

create policy filter_presets_select on public.filter_presets
  for select to authenticated
  using (public.is_active() and (user_id is null or user_id = auth.uid()));

create policy filter_presets_write on public.filter_presets
  for all to authenticated
  using (public.is_active() and user_id = auth.uid() and system = false)
  with check (public.is_active() and user_id = auth.uid() and system = false);

-- notifications (per user) ---------------------------------------------------
drop policy if exists notifications_all on public.notifications;
create policy notifications_all on public.notifications
  for all to authenticated
  using (user_id = auth.uid() and public.is_active())
  with check (user_id = auth.uid() and public.is_active());

-- activity_log (shared, append-only, attributed) -----------------------------
drop policy if exists activity_log_select on public.activity_log;
drop policy if exists activity_log_insert on public.activity_log;

create policy activity_log_select on public.activity_log
  for select to authenticated using (public.is_active());

create policy activity_log_insert on public.activity_log
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_active());

-- storage: private "documents" bucket ----------------------------------------
drop policy if exists documents_bucket_select on storage.objects;
drop policy if exists documents_bucket_insert on storage.objects;
drop policy if exists documents_bucket_update on storage.objects;
drop policy if exists documents_bucket_delete on storage.objects;

create policy documents_bucket_select on storage.objects
  for select to authenticated using (bucket_id = 'documents' and public.is_active());

create policy documents_bucket_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'documents' and public.is_active());

create policy documents_bucket_update on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and public.is_active())
  with check (bucket_id = 'documents' and public.is_active());

create policy documents_bucket_delete on storage.objects
  for delete to authenticated using (bucket_id = 'documents' and public.is_active());

-- ============================================================================
-- Bootstrap the first administrator (run ONCE, out-of-band)
-- ============================================================================
-- Preferred: run `node scripts/create-admin.mjs` from the project root. It uses
-- the service-role key server-side and never touches the browser.
--
-- Equivalent SQL after the account exists (service role / SQL editor only):
--   update public.profiles
--      set role = 'admin', status = 'active'
--    where email = 'admin@levelup.example';
-- ============================================================================
