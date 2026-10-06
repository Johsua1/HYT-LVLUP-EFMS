/**
 * Database row shapes — the snake_case mirror of the Postgres schema in
 * `supabase/migrations/0001_init.sql`. These are the only place raw column
 * names appear; `src/lib/mappers.ts` converts between these and the camelCase
 * domain model in `src/types`.
 *
 * `timestamptz` columns are typed as `string` because PostgREST serialises
 * them to ISO-8601 strings, which is exactly what the domain model uses.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/* ---- profiles / settings ------------------------------------------------ */

export type ProfileStatus = 'invited' | 'active' | 'disabled';

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  initials: string;
  job_title: string;
  role: 'admin' | 'staff';
  status: ProfileStatus;
  invited_at: string | null;
  activated_at: string | null;
  disabled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AppSettingsRow = {
  user_id: string;
  density: 'comfortable' | 'compact';
  accent: string;
  theme: 'light' | 'dark';
  view_mode: 'table' | 'card';
  rows_per_page: number;
  landing_page: string;
  currency_display: 'php' | 'local' | 'both';
  show_archived: boolean;
  default_country: string;
  default_employer_status: string;
  notification_prefs: Record<string, boolean>;
  employer_columns: string[];
  saved_filters: Record<string, unknown> | null;
  updated_at: string;
};

/* ---- shared agency data ------------------------------------------------- */

export type EmployerRow = {
  id: string;
  company_name: string;
  legal_name: string;
  logo_initials: string;
  logo_hue: number;
  registration_number: string;
  country: string;
  country_code: string;
  city: string;
  address: string;
  industry: string;
  company_size: string;
  website: string;
  contact_person: string;
  contact_role: string;
  email: string;
  phone: string;
  years_operating: number;
  status: string;
  verification: string;
  verification_stage: number;
  verification_updated_at: string;
  description: string;
  created_by: string | null;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

export type JobOrderRow = {
  id: string;
  employer_id: string;
  reference: string;
  position: string;
  job_category: string;
  workers_needed: number;
  workers_deployed: number;
  salary_min_local: number;
  salary_max_local: number;
  currency: string;
  salary_min_php: number;
  salary_max_php: number;
  working_hours: string;
  overtime: string;
  contract_duration_months: number;
  employment_type: string;
  benefits: Record<string, unknown>;
  requirements: string[];
  status: string;
  posted_at: string;
  created_at: string;
  updated_at: string;
};

export type ContractRow = {
  id: string;
  employer_id: string;
  contract_number: string;
  job_order_id: string | null;
  start_date: string;
  end_date: string;
  duration_months: number;
  salary_min_local: number;
  salary_max_local: number;
  currency: string;
  working_conditions: string;
  renewal_status: string;
  status: string;
  signed_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type FeeRow = {
  id: string;
  employer_id: string;
  type: string;
  amount: number;
  currency: string;
  borne_by: string;
  payment_status: string;
  due_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type RequirementRow = {
  id: string;
  employer_id: string;
  key: string;
  label: string;
  description: string;
  completed: boolean;
  status: string;
  mandatory: boolean;
  updated_at: string;
};

export type DocumentRow = {
  id: string;
  employer_id: string;
  name: string;
  type: string;
  file_name: string;
  file_size_kb: number;
  storage_path: string | null;
  uploaded_at: string;
  uploaded_by: string;
  expires_at: string | null;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type NoteRow = {
  id: string;
  employer_id: string;
  author: string;
  author_id: string | null;
  body: string;
  pinned: boolean;
  created_at: string;
};

export type VerificationEventRow = {
  id: string;
  employer_id: string;
  stage: string;
  actor: string;
  outcome: string;
  comment: string;
  occurred_at: string;
};

export type ShortlistRow = {
  user_id: string;
  employer_id: string;
  note: string;
  added_by: string;
  added_at: string;
};

export type FilterPresetRow = {
  id: string;
  user_id: string | null;
  name: string;
  description: string;
  filters: Record<string, unknown>;
  system: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  message: string;
  employer_id: string | null;
  severity: string;
  read: boolean;
  created_at: string;
};

export type ActivityLogRow = {
  id: string;
  user_id: string | null;
  user_name: string;
  user_initials: string;
  action: string;
  action_type: string;
  employer_id: string | null;
  employer_name: string;
  detail: string | null;
  created_at: string;
};
