-- ============================================================================
-- EFMS — Employer Filtering Management System
-- Migration 0001: schema, functions, triggers, Row Level Security, storage
-- ============================================================================
-- Safe to run once against a brand-new Supabase project (SQL Editor → Run, or
-- `supabase db push`). Everything is idempotent where practical so re-running
-- after a partial failure is harmless.
--
-- Access model
--   • Roles:        admin | staff   (profiles.role)
--   • Shared data:  employers, job_orders, contracts, fees, requirements,
--                   documents, notes, verification_events, activity_log
--                   → readable AND writable by every authenticated user.
--   • Per-user:     app_settings, notifications, shortlist
--                   → rows are private to the owning user.
--   • Presets:      system presets (user_id IS NULL) are read-only to everyone;
--                   personal presets are private to their owner.
--   • Admin only:   managing profiles / roles.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Helper: keep updated_at fresh
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. profiles  (one row per auth user)
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text        not null default '',
  full_name   text        not null default '',
  initials    text        not null default '',
  job_title   text        not null default '',
  role        text        not null default 'staff'
                check (role in ('admin', 'staff')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Helper: is the caller an admin? SECURITY DEFINER so it can read profiles
-- without recursing through that table's own RLS policies.
-- Defined AFTER public.profiles: LANGUAGE sql functions are validated at
-- creation time, so the referenced table must already exist.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- 2. app_settings  (one row per user — the Settings screen)
-- ============================================================================
create table if not exists public.app_settings (
  user_id                 uuid primary key references public.profiles (id) on delete cascade,
  density                 text    not null default 'comfortable'
                            check (density in ('comfortable', 'compact')),
  accent                  text    not null default 'levelup',
  theme                   text    not null default 'light'
                            check (theme in ('light', 'dark')),
  view_mode               text    not null default 'table'
                            check (view_mode in ('table', 'card')),
  rows_per_page           integer not null default 10 check (rows_per_page between 5 and 200),
  landing_page            text    not null default '/dashboard',
  currency_display        text    not null default 'both'
                            check (currency_display in ('php', 'local', 'both')),
  show_archived           boolean not null default false,
  default_country         text    not null default '',
  default_employer_status text    not null default '',
  notification_prefs      jsonb   not null default
    '{"Contract":true,"Document":true,"Verification":true,"Fee":true,"Requirement":true,"Employer":false,"System":true}'::jsonb,
  employer_columns        text[]  not null default
    '{company,country,industry,positions,salary,contract,fees,requirements,verification,status,updated}',
  saved_filters           jsonb,
  updated_at              timestamptz not null default now()
);

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 3. employers
-- ============================================================================
create table if not exists public.employers (
  id                      uuid primary key default gen_random_uuid(),
  company_name            text        not null,
  legal_name              text        not null default '',
  logo_initials           text        not null default '',
  logo_hue                integer     not null default 210,
  registration_number     text        not null default '',
  country                 text        not null,
  country_code            text        not null default '',
  city                    text        not null default '',
  address                 text        not null default '',
  industry                text        not null default '',
  company_size            text        not null default '',
  website                 text        not null default '',
  contact_person          text        not null default '',
  contact_role            text        not null default '',
  email                   text        not null default '',
  phone                   text        not null default '',
  years_operating         integer     not null default 0 check (years_operating >= 0),
  status                  text        not null default 'Pending'
                            check (status in ('Active', 'Pending', 'Inactive', 'Suspended', 'Archived')),
  verification            text        not null default 'Pending'
                            check (verification in ('Verified', 'Under Review', 'Pending', 'Requires Revision', 'Rejected', 'On Hold')),
  verification_stage      integer     not null default 0 check (verification_stage between 0 and 4),
  verification_updated_at timestamptz not null default now(),
  description             text        not null default '',
  created_by              uuid        references public.profiles (id) on delete set null,
  updated_by              text        not null default '',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_employers_status        on public.employers (status);
create index if not exists idx_employers_country       on public.employers (country);
create index if not exists idx_employers_verification  on public.employers (verification);
create index if not exists idx_employers_updated_at    on public.employers (updated_at desc);

drop trigger if exists trg_employers_updated_at on public.employers;
create trigger trg_employers_updated_at
  before update on public.employers
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 4. job_orders  (many per employer)
-- ============================================================================
create table if not exists public.job_orders (
  id                       uuid primary key default gen_random_uuid(),
  employer_id              uuid        not null references public.employers (id) on delete cascade,
  reference                text        not null default '',
  position                 text        not null default '',
  job_category             text        not null default '',
  workers_needed           integer     not null default 0 check (workers_needed >= 0),
  workers_deployed         integer     not null default 0 check (workers_deployed >= 0),
  salary_min_local         numeric     not null default 0,
  salary_max_local         numeric     not null default 0,
  currency                 text        not null default 'PHP',
  salary_min_php           numeric     not null default 0,
  salary_max_php           numeric     not null default 0,
  working_hours            text        not null default '8 hours/day',
  overtime                 text        not null default 'Available'
                             check (overtime in ('Available', 'Limited', 'None')),
  contract_duration_months integer     not null default 12,
  employment_type          text        not null default 'Full-time'
                             check (employment_type in ('Full-time', 'Contractual', 'Project-based')),
  benefits                 jsonb       not null default '{}'::jsonb,
  requirements             text[]      not null default '{}',
  status                   text        not null default 'Open'
                             check (status in ('Open', 'Filled', 'On Hold', 'Closed', 'Cancelled')),
  posted_at                timestamptz not null default now(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists idx_job_orders_employer on public.job_orders (employer_id);
create index if not exists idx_job_orders_status   on public.job_orders (status);

drop trigger if exists trg_job_orders_updated_at on public.job_orders;
create trigger trg_job_orders_updated_at
  before update on public.job_orders
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 5. contracts  (one per employer)
-- ============================================================================
create table if not exists public.contracts (
  id                 uuid primary key default gen_random_uuid(),
  employer_id        uuid        not null unique references public.employers (id) on delete cascade,
  contract_number    text        not null default '',
  job_order_id       uuid        references public.job_orders (id) on delete set null,
  start_date         timestamptz not null default now(),
  end_date           timestamptz not null default now(),
  duration_months    integer     not null default 12 check (duration_months >= 0),
  salary_min_local   numeric     not null default 0,
  salary_max_local   numeric     not null default 0,
  currency           text        not null default 'PHP',
  working_conditions text        not null default '',
  renewal_status     text        not null default 'Not Started'
                       check (renewal_status in ('Not Started', 'Renewal Pending', 'Renewed', 'Not Renewable')),
  status             text        not null default 'Draft'
                       check (status in ('Draft', 'Under Review', 'Active', 'Expiring Soon', 'Expired', 'Renewed')),
  signed_at          timestamptz,
  notes              text        not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_contracts_end_date on public.contracts (end_date);

drop trigger if exists trg_contracts_updated_at on public.contracts;
create trigger trg_contracts_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 6. fees
-- ============================================================================
create table if not exists public.fees (
  id             uuid primary key default gen_random_uuid(),
  employer_id    uuid        not null references public.employers (id) on delete cascade,
  type           text        not null
                   check (type in ('Processing Fee', 'Placement Fee', 'Visa Fee', 'Medical Fee',
                                   'Documentation Fee', 'Insurance', 'Other Fees')),
  amount         numeric     not null default 0,
  currency       text        not null default 'PHP',
  borne_by       text        not null default 'Worker'
                   check (borne_by in ('Worker', 'Employer', 'Shared')),
  payment_status text        not null default 'Pending'
                   check (payment_status in ('Paid', 'Pending', 'Included', 'Waived', 'Not Applicable')),
  due_date       timestamptz,
  notes          text        not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_fees_employer on public.fees (employer_id);

drop trigger if exists trg_fees_updated_at on public.fees;
create trigger trg_fees_updated_at
  before update on public.fees
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 7. requirements  (checklist per employer)
-- ============================================================================
create table if not exists public.requirements (
  id          uuid primary key default gen_random_uuid(),
  employer_id uuid        not null references public.employers (id) on delete cascade,
  key         text        not null,
  label       text        not null,
  description text        not null default '',
  completed   boolean     not null default false,
  status      text        not null default 'Incomplete'
                check (status in ('Complete', 'Incomplete', 'Under Review', 'Missing Documents')),
  mandatory   boolean     not null default false,
  updated_at  timestamptz not null default now(),
  unique (employer_id, key)
);

create index if not exists idx_requirements_employer on public.requirements (employer_id);

-- ============================================================================
-- 8. documents  (metadata + Supabase Storage object path)
-- ============================================================================
create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  employer_id   uuid        not null references public.employers (id) on delete cascade,
  name          text        not null,
  type          text        not null default 'Other',
  file_name     text        not null default '',
  file_size_kb  integer     not null default 0 check (file_size_kb >= 0),
  storage_path  text,
  uploaded_at   timestamptz not null default now(),
  uploaded_by   text        not null default '',
  expires_at    timestamptz,
  status        text        not null default 'Pending Review'
                  check (status in ('Verified', 'Pending Review', 'Rejected', 'Expired')),
  notes         text        not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_documents_employer on public.documents (employer_id);

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 9. notes  (internal, agency-wide)
-- ============================================================================
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  employer_id uuid        not null references public.employers (id) on delete cascade,
  author      text        not null default '',
  author_id   uuid        references public.profiles (id) on delete set null,
  body        text        not null default '',
  pinned      boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notes_employer on public.notes (employer_id);

-- ============================================================================
-- 10. verification_events  (workflow audit per employer)
-- ============================================================================
create table if not exists public.verification_events (
  id          uuid primary key default gen_random_uuid(),
  employer_id uuid        not null references public.employers (id) on delete cascade,
  stage       text        not null default '',
  actor       text        not null default '',
  outcome     text        not null default 'pending'
                check (outcome in ('completed', 'current', 'pending', 'failed')),
  comment     text        not null default '',
  occurred_at timestamptz not null default now()
);

create index if not exists idx_verification_events_employer on public.verification_events (employer_id);

-- ============================================================================
-- 11. shortlist  (per-user)
-- ============================================================================
create table if not exists public.shortlist (
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  employer_id uuid        not null references public.employers (id) on delete cascade,
  note        text        not null default '',
  added_by    text        not null default '',
  added_at    timestamptz not null default now(),
  primary key (user_id, employer_id)
);

-- ============================================================================
-- 12. filter_presets  (system presets have user_id IS NULL)
-- ============================================================================
create table if not exists public.filter_presets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        references public.profiles (id) on delete cascade,
  name         text        not null,
  description  text        not null default '',
  filters      jsonb       not null default '{}'::jsonb,
  system       boolean     not null default false,
  use_count    integer     not null default 0 check (use_count >= 0),
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_filter_presets_user on public.filter_presets (user_id);

-- ============================================================================
-- 13. notifications  (per-user feed)
-- ============================================================================
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  category    text        not null default 'System'
                check (category in ('Contract', 'Document', 'Verification', 'Fee', 'Requirement', 'Employer', 'System')),
  title       text        not null,
  message     text        not null default '',
  employer_id uuid        references public.employers (id) on delete cascade,
  severity    text        not null default 'info'
                check (severity in ('info', 'warning', 'critical', 'success')),
  read        boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

-- ============================================================================
-- 14. activity_log  (agency-wide, append-only)
-- ============================================================================
create table if not exists public.activity_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid        references public.profiles (id) on delete set null,
  user_name     text        not null default '',
  user_initials text        not null default '',
  action        text        not null,
  action_type   text        not null
                  check (action_type in ('created', 'updated', 'verified', 'rejected', 'shortlisted',
                                         'removed', 'status-changed', 'uploaded', 'exported')),
  employer_id   uuid        references public.employers (id) on delete set null,
  employer_name text        not null default '',
  detail        text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_activity_log_created on public.activity_log (created_at desc);

-- ============================================================================
-- Trigger: provision a profile, settings row and welcome notifications on signup
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_initials  text;
  v_role      text;
begin
  v_full_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
  v_initials  := upper(
                   left(regexp_replace(v_full_name, '[^a-zA-Z ]', '', 'g'), 1) ||
                   coalesce(substring(regexp_replace(v_full_name, '[^a-zA-Z ]', '', 'g') from ' ([a-zA-Z])'), '')
                 );

  -- The very first account to register bootstraps the workspace as admin.
  if exists (select 1 from public.profiles) then
    v_role := 'staff';
  else
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, full_name, initials, job_title, role)
  values (
    new.id,
    coalesce(new.email, ''),
    v_full_name,
    v_initials,
    coalesce(new.raw_user_meta_data ->> 'job_title', ''),
    v_role
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Guard: only admins may change a role
-- ============================================================================
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only administrators can change a user role';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_guard_role on public.profiles;
create trigger trg_profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.app_settings        enable row level security;
alter table public.employers           enable row level security;
alter table public.job_orders          enable row level security;
alter table public.contracts           enable row level security;
alter table public.fees                enable row level security;
alter table public.requirements        enable row level security;
alter table public.documents           enable row level security;
alter table public.notes               enable row level security;
alter table public.verification_events enable row level security;
alter table public.shortlist           enable row level security;
alter table public.filter_presets      enable row level security;
alter table public.notifications       enable row level security;
alter table public.activity_log        enable row level security;

-- ---- profiles ---------------------------------------------------------------
drop policy if exists profiles_select        on public.profiles;
drop policy if exists profiles_update_self   on public.profiles;
drop policy if exists profiles_update_admin  on public.profiles;
drop policy if exists profiles_delete_admin  on public.profiles;

create policy profiles_select on public.profiles
  for select to authenticated using (true);

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy profiles_delete_admin on public.profiles
  for delete to authenticated using (public.is_admin());

-- ---- app_settings -----------------------------------------------------------
drop policy if exists app_settings_all on public.app_settings;
create policy app_settings_all on public.app_settings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---- shared agency data -----------------------------------------------------
-- Read + write for every authenticated member of the agency.
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
    execute format('create policy %I_select on public.%I for select to authenticated using (true)', t, t);
    execute format(
      'create policy %I_write on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ---- shortlist (per user) ---------------------------------------------------
drop policy if exists shortlist_all on public.shortlist;
create policy shortlist_all on public.shortlist
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---- filter_presets ---------------------------------------------------------
drop policy if exists filter_presets_select on public.filter_presets;
drop policy if exists filter_presets_write  on public.filter_presets;

create policy filter_presets_select on public.filter_presets
  for select to authenticated
  using (user_id is null or user_id = auth.uid());

create policy filter_presets_write on public.filter_presets
  for all to authenticated
  using (user_id = auth.uid() and system = false)
  with check (user_id = auth.uid() and system = false);

-- ---- notifications (per user) ----------------------------------------------
drop policy if exists notifications_all on public.notifications;
create policy notifications_all on public.notifications
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---- activity_log (shared, append-only, attributed) ------------------------
drop policy if exists activity_log_select on public.activity_log;
drop policy if exists activity_log_insert on public.activity_log;

create policy activity_log_select on public.activity_log
  for select to authenticated using (true);

create policy activity_log_insert on public.activity_log
  for insert to authenticated
  with check (user_id = auth.uid());

-- ============================================================================
-- Storage: private "documents" bucket
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760, -- 10 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists documents_bucket_select on storage.objects;
drop policy if exists documents_bucket_insert on storage.objects;
drop policy if exists documents_bucket_update on storage.objects;
drop policy if exists documents_bucket_delete on storage.objects;

create policy documents_bucket_select on storage.objects
  for select to authenticated using (bucket_id = 'documents');

create policy documents_bucket_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'documents');

create policy documents_bucket_update on storage.objects
  for update to authenticated
  using (bucket_id = 'documents') with check (bucket_id = 'documents');

create policy documents_bucket_delete on storage.objects
  for delete to authenticated using (bucket_id = 'documents');

-- ============================================================================
-- Manual admin bootstrap (only needed if you want to promote an existing user)
-- Run after that user has signed up:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================================
