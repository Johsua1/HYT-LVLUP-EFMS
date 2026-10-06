import type {
  ActivityLogEntry,
  AppSettings,
  Benefits,
  Contract,
  DocumentRecord,
  Employer,
  FeeItem,
  FilterPreset,
  FilterState,
  JobOrder,
  Note,
  NotificationItem,
  RequirementItem,
  ShortlistEntry,
  VerificationEvent,
} from '@/types';
import type {
  ActivityLogRow,
  AppSettingsRow,
  ContractRow,
  DocumentRow,
  EmployerRow,
  FeeRow,
  FilterPresetRow,
  JobOrderRow,
  NoteRow,
  NotificationRow,
  RequirementRow,
  ShortlistRow,
  VerificationEventRow,
} from './database.types';

/**
 * Converters between the snake_case Postgres rows and the camelCase domain
 * model. Keeping them in one file means column renames are a single edit.
 *
 * Enum-like columns are cast to the domain unions: the database CHECK
 * constraints are the real guard, and the domain types are already validated
 * on the way in.
 */

/* ------------------------------------------------------------------ */
/* Generic helpers                                                     */
/* ------------------------------------------------------------------ */

/** camelCase object keys → snake_case, dropping `undefined` values. */
export function snakeize(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    out[key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = value;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Employer                                                            */
/* ------------------------------------------------------------------ */

export function employerFromRow(row: EmployerRow): Employer {
  return {
    id: row.id,
    companyName: row.company_name,
    legalName: row.legal_name,
    logoInitials: row.logo_initials,
    logoHue: row.logo_hue,
    registrationNumber: row.registration_number,
    country: row.country,
    countryCode: row.country_code,
    city: row.city,
    address: row.address,
    industry: row.industry,
    companySize: row.company_size,
    website: row.website,
    contactPerson: row.contact_person,
    contactRole: row.contact_role,
    email: row.email,
    phone: row.phone,
    yearsOperating: row.years_operating,
    status: row.status as Employer['status'],
    verification: row.verification as Employer['verification'],
    verificationStage: row.verification_stage,
    verificationUpdatedAt: row.verification_updated_at,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export function employerToRow(employer: Employer, createdBy: string | null): EmployerRow {
  return {
    id: employer.id,
    company_name: employer.companyName,
    legal_name: employer.legalName,
    logo_initials: employer.logoInitials,
    logo_hue: employer.logoHue,
    registration_number: employer.registrationNumber,
    country: employer.country,
    country_code: employer.countryCode,
    city: employer.city,
    address: employer.address,
    industry: employer.industry,
    company_size: employer.companySize,
    website: employer.website,
    contact_person: employer.contactPerson,
    contact_role: employer.contactRole,
    email: employer.email,
    phone: employer.phone,
    years_operating: employer.yearsOperating,
    status: employer.status,
    verification: employer.verification,
    verification_stage: employer.verificationStage,
    verification_updated_at: employer.verificationUpdatedAt,
    description: employer.description,
    created_by: createdBy,
    updated_by: employer.updatedBy,
    created_at: employer.createdAt,
    updated_at: employer.updatedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Job order                                                           */
/* ------------------------------------------------------------------ */

export function jobFromRow(row: JobOrderRow): JobOrder {
  return {
    id: row.id,
    employerId: row.employer_id,
    reference: row.reference,
    position: row.position,
    jobCategory: row.job_category,
    workersNeeded: row.workers_needed,
    workersDeployed: row.workers_deployed,
    salaryMinLocal: Number(row.salary_min_local),
    salaryMaxLocal: Number(row.salary_max_local),
    currency: row.currency,
    salaryMinPhp: Number(row.salary_min_php),
    salaryMaxPhp: Number(row.salary_max_php),
    workingHours: row.working_hours as JobOrder['workingHours'],
    overtime: row.overtime as JobOrder['overtime'],
    contractDurationMonths: row.contract_duration_months,
    employmentType: row.employment_type as JobOrder['employmentType'],
    benefits: row.benefits as unknown as Benefits,
    requirements: row.requirements ?? [],
    status: row.status as JobOrder['status'],
    postedAt: row.posted_at,
  };
}

export function jobToRow(job: JobOrder): JobOrderRow {
  return {
    id: job.id,
    employer_id: job.employerId,
    reference: job.reference,
    position: job.position,
    job_category: job.jobCategory,
    workers_needed: job.workersNeeded,
    workers_deployed: job.workersDeployed,
    salary_min_local: job.salaryMinLocal,
    salary_max_local: job.salaryMaxLocal,
    currency: job.currency,
    salary_min_php: job.salaryMinPhp,
    salary_max_php: job.salaryMaxPhp,
    working_hours: job.workingHours,
    overtime: job.overtime,
    contract_duration_months: job.contractDurationMonths,
    employment_type: job.employmentType,
    benefits: job.benefits as unknown as Record<string, unknown>,
    requirements: job.requirements,
    status: job.status,
    posted_at: job.postedAt,
    created_at: job.postedAt,
    updated_at: job.postedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Contract                                                            */
/* ------------------------------------------------------------------ */

export function contractFromRow(row: ContractRow): Contract {
  return {
    id: row.id,
    employerId: row.employer_id,
    contractNumber: row.contract_number,
    jobOrderId: row.job_order_id,
    startDate: row.start_date,
    endDate: row.end_date,
    durationMonths: row.duration_months,
    salaryMinLocal: Number(row.salary_min_local),
    salaryMaxLocal: Number(row.salary_max_local),
    currency: row.currency,
    workingConditions: row.working_conditions,
    renewalStatus: row.renewal_status as Contract['renewalStatus'],
    status: row.status as Contract['status'],
    signedAt: row.signed_at,
    notes: row.notes,
  };
}

export function contractToRow(contract: Contract): ContractRow {
  return {
    id: contract.id,
    employer_id: contract.employerId,
    contract_number: contract.contractNumber,
    job_order_id: contract.jobOrderId,
    start_date: contract.startDate,
    end_date: contract.endDate,
    duration_months: contract.durationMonths,
    salary_min_local: contract.salaryMinLocal,
    salary_max_local: contract.salaryMaxLocal,
    currency: contract.currency,
    working_conditions: contract.workingConditions,
    renewal_status: contract.renewalStatus,
    status: contract.status,
    signed_at: contract.signedAt,
    notes: contract.notes,
    created_at: contract.startDate,
    updated_at: contract.startDate,
  };
}

/* ------------------------------------------------------------------ */
/* Fee                                                                 */
/* ------------------------------------------------------------------ */

export function feeFromRow(row: FeeRow): FeeItem {
  return {
    id: row.id,
    employerId: row.employer_id,
    type: row.type as FeeItem['type'],
    amount: Number(row.amount),
    currency: row.currency,
    borneBy: row.borne_by as FeeItem['borneBy'],
    paymentStatus: row.payment_status as FeeItem['paymentStatus'],
    dueDate: row.due_date,
    notes: row.notes,
  };
}

export function feeToRow(fee: FeeItem): FeeRow {
  return {
    id: fee.id,
    employer_id: fee.employerId,
    type: fee.type,
    amount: fee.amount,
    currency: fee.currency,
    borne_by: fee.borneBy,
    payment_status: fee.paymentStatus,
    due_date: fee.dueDate,
    notes: fee.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Requirement                                                         */
/* ------------------------------------------------------------------ */

export function requirementFromRow(row: RequirementRow): RequirementItem {
  return {
    id: row.id,
    employerId: row.employer_id,
    key: row.key,
    label: row.label,
    description: row.description,
    completed: row.completed,
    status: row.status as RequirementItem['status'],
    mandatory: row.mandatory,
    updatedAt: row.updated_at,
  };
}

export function requirementToRow(req: RequirementItem): RequirementRow {
  return {
    id: req.id,
    employer_id: req.employerId,
    key: req.key,
    label: req.label,
    description: req.description,
    completed: req.completed,
    status: req.status,
    mandatory: req.mandatory,
    updated_at: req.updatedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Document                                                            */
/* ------------------------------------------------------------------ */

export function documentFromRow(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    employerId: row.employer_id,
    name: row.name,
    type: row.type,
    fileName: row.file_name,
    fileSizeKb: row.file_size_kb,
    storagePath: row.storage_path,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
    expiresAt: row.expires_at,
    status: row.status as DocumentRecord['status'],
    notes: row.notes,
  };
}

export function documentToRow(doc: DocumentRecord): DocumentRow {
  return {
    id: doc.id,
    employer_id: doc.employerId,
    name: doc.name,
    type: doc.type,
    file_name: doc.fileName,
    file_size_kb: doc.fileSizeKb,
    storage_path: doc.storagePath,
    uploaded_at: doc.uploadedAt,
    uploaded_by: doc.uploadedBy,
    expires_at: doc.expiresAt,
    status: doc.status,
    notes: doc.notes,
    created_at: doc.uploadedAt,
    updated_at: doc.uploadedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Note                                                                */
/* ------------------------------------------------------------------ */

export function noteFromRow(row: NoteRow): Note {
  return {
    id: row.id,
    employerId: row.employer_id,
    author: row.author,
    body: row.body,
    createdAt: row.created_at,
    pinned: row.pinned,
  };
}

export function noteToRow(note: Note, authorId: string | null): NoteRow {
  return {
    id: note.id,
    employer_id: note.employerId,
    author: note.author,
    author_id: authorId,
    body: note.body,
    pinned: note.pinned,
    created_at: note.createdAt,
  };
}

/* ------------------------------------------------------------------ */
/* Verification event                                                  */
/* ------------------------------------------------------------------ */

export function verificationEventFromRow(row: VerificationEventRow): VerificationEvent {
  return {
    id: row.id,
    employerId: row.employer_id,
    stage: row.stage,
    actor: row.actor,
    timestamp: row.occurred_at,
    outcome: row.outcome as VerificationEvent['outcome'],
    comment: row.comment,
  };
}

/* ------------------------------------------------------------------ */
/* Shortlist                                                           */
/* ------------------------------------------------------------------ */

export function shortlistFromRow(row: ShortlistRow): ShortlistEntry {
  return {
    employerId: row.employer_id,
    note: row.note,
    addedAt: row.added_at,
    addedBy: row.added_by,
  };
}

/* ------------------------------------------------------------------ */
/* Filter preset                                                       */
/* ------------------------------------------------------------------ */

export function presetFromRow(row: FilterPresetRow): FilterPreset {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    filters: row.filters as unknown as FilterState,
    system: row.system,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    useCount: row.use_count,
  };
}

/* ------------------------------------------------------------------ */
/* Notification                                                        */
/* ------------------------------------------------------------------ */

export function notificationFromRow(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    category: row.category as NotificationItem['category'],
    title: row.title,
    message: row.message,
    employerId: row.employer_id,
    createdAt: row.created_at,
    read: row.read,
    severity: row.severity as NotificationItem['severity'],
  };
}

/* ------------------------------------------------------------------ */
/* Activity log                                                        */
/* ------------------------------------------------------------------ */

export function activityFromRow(row: ActivityLogRow): ActivityLogEntry {
  return {
    id: row.id,
    user: row.user_name,
    userInitials: row.user_initials,
    action: row.action,
    actionType: row.action_type as ActivityLogEntry['actionType'],
    employerId: row.employer_id,
    employerName: row.employer_name,
    timestamp: row.created_at,
    detail: row.detail ?? undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export interface SettingsBundle {
  settings: AppSettings;
  employerColumns: string[];
  savedFilters: FilterState | null;
}

export function settingsFromRow(row: AppSettingsRow): SettingsBundle {
  return {
    settings: {
      density: row.density,
      accent: row.accent as AppSettings['accent'],
      theme: row.theme,
      viewMode: row.view_mode,
      rowsPerPage: row.rows_per_page,
      landingPage: row.landing_page,
      currencyDisplay: row.currency_display,
      showArchived: row.show_archived,
      defaultCountry: row.default_country,
      defaultEmployerStatus: row.default_employer_status,
      notificationPrefs: row.notification_prefs as unknown as AppSettings['notificationPrefs'],
    },
    employerColumns: row.employer_columns ?? [],
    savedFilters: (row.saved_filters as unknown as FilterState | null) ?? null,
  };
}

export function settingsToRow(
  userId: string,
  settings: AppSettings,
  employerColumns: string[],
  savedFilters: FilterState | null,
): AppSettingsRow {
  return {
    user_id: userId,
    density: settings.density,
    accent: settings.accent,
    theme: settings.theme,
    view_mode: settings.viewMode,
    rows_per_page: settings.rowsPerPage,
    landing_page: settings.landingPage,
    currency_display: settings.currencyDisplay,
    show_archived: settings.showArchived,
    default_country: settings.defaultCountry,
    default_employer_status: settings.defaultEmployerStatus,
    notification_prefs: settings.notificationPrefs as unknown as Record<string, boolean>,
    employer_columns: employerColumns,
    saved_filters: savedFilters as unknown as Record<string, unknown> | null,
    updated_at: new Date().toISOString(),
  };
}
