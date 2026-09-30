/**
 * EFMS domain model.
 *
 * The shape below is deliberately API-shaped: every entity has a stable `id`,
 * foreign keys are explicit (`employerId`), and timestamps are ISO strings.
 * Swapping the mock data source in `src/data` for a real REST/GraphQL client
 * therefore requires no changes to components or business logic.
 */

/* ------------------------------------------------------------------ */
/* Enumerations                                                        */
/* ------------------------------------------------------------------ */

export type EmployerStatus =
  | 'Active'
  | 'Pending'
  | 'Inactive'
  | 'Suspended'
  | 'Archived';

export type VerificationStatus =
  | 'Verified'
  | 'Under Review'
  | 'Pending'
  | 'Requires Revision'
  | 'Rejected'
  | 'On Hold';

export type ContractStatus =
  | 'Draft'
  | 'Under Review'
  | 'Active'
  | 'Expiring Soon'
  | 'Expired'
  | 'Renewed';

export type RenewalStatus = 'Not Started' | 'Renewal Pending' | 'Renewed' | 'Not Renewable';

export type JobStatus = 'Open' | 'Filled' | 'On Hold' | 'Closed' | 'Cancelled';

export type RequirementStatus = 'Complete' | 'Incomplete' | 'Under Review' | 'Missing Documents';

export type DocumentStatus = 'Verified' | 'Pending Review' | 'Rejected' | 'Expired';

export type FeeType =
  | 'Processing Fee'
  | 'Placement Fee'
  | 'Visa Fee'
  | 'Medical Fee'
  | 'Documentation Fee'
  | 'Insurance'
  | 'Other Fees';

export type PaymentStatus = 'Paid' | 'Pending' | 'Included' | 'Waived' | 'Not Applicable';

export type EmploymentType = 'Full-time' | 'Contractual' | 'Project-based';

export type WorkingHours = '8 hours/day' | '9 hours/day' | '10 hours/day' | '12 hours/day' | 'Shift-based';

export type OvertimeAvailability = 'Available' | 'Limited' | 'None';

export type ProvisionLevel = 'Provided' | 'Allowance' | 'Not Provided';

export type AirfareArrangement = 'Employer Paid' | 'Shared' | 'Worker Paid';

export type NotificationCategory =
  | 'Contract'
  | 'Document'
  | 'Verification'
  | 'Fee'
  | 'Requirement'
  | 'Employer'
  | 'System';

export type ActivityActionType =
  | 'created'
  | 'updated'
  | 'verified'
  | 'rejected'
  | 'shortlisted'
  | 'removed'
  | 'status-changed'
  | 'uploaded'
  | 'exported';

/* ------------------------------------------------------------------ */
/* Entities                                                            */
/* ------------------------------------------------------------------ */

export interface Benefits {
  accommodation: ProvisionLevel;
  transportation: ProvisionLevel;
  foodAllowance: ProvisionLevel;
  healthInsurance: boolean;
  overtimePay: boolean;
  /** Free-text so real-world values such as "14 days" / "15 days + 5 sick" survive. */
  annualLeave: string;
  airfare: AirfareArrangement;
}

export interface JobOrder {
  id: string;
  employerId: string;
  reference: string;
  position: string;
  jobCategory: string;
  workersNeeded: number;
  workersDeployed: number;
  /** Salary expressed in the employer's local currency. */
  salaryMinLocal: number;
  salaryMaxLocal: number;
  currency: string;
  /** Normalised monthly gross in PHP so cross-country comparison is meaningful. */
  salaryMinPhp: number;
  salaryMaxPhp: number;
  workingHours: WorkingHours;
  overtime: OvertimeAvailability;
  contractDurationMonths: number;
  employmentType: EmploymentType;
  benefits: Benefits;
  requirements: string[];
  status: JobStatus;
  postedAt: string;
}

export interface Contract {
  id: string;
  employerId: string;
  contractNumber: string;
  jobOrderId: string | null;
  startDate: string;
  endDate: string;
  durationMonths: number;
  salaryMinLocal: number;
  salaryMaxLocal: number;
  currency: string;
  workingConditions: string;
  renewalStatus: RenewalStatus;
  status: ContractStatus;
  signedAt: string | null;
  notes: string;
}

export interface FeeItem {
  id: string;
  employerId: string;
  type: FeeType;
  /** Amount in PHP — agency-side fees are quoted in the recruiting country. */
  amount: number;
  currency: string;
  /** Present when the fee is shouldered by the employer rather than the worker. */
  borneBy: 'Worker' | 'Employer' | 'Shared';
  paymentStatus: PaymentStatus;
  dueDate: string | null;
  notes: string;
}

export interface RequirementItem {
  id: string;
  employerId: string;
  key: string;
  label: string;
  description: string;
  completed: boolean;
  status: RequirementStatus;
  mandatory: boolean;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  employerId: string;
  name: string;
  type: string;
  fileName: string;
  fileSizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
  expiresAt: string | null;
  status: DocumentStatus;
  notes: string;
}

export interface Note {
  id: string;
  employerId: string;
  author: string;
  body: string;
  createdAt: string;
  pinned: boolean;
}

export interface Employer {
  id: string;
  companyName: string;
  legalName: string;
  /** Initials used by the logo avatar — real logos are out of scope for a prototype. */
  logoInitials: string;
  logoHue: number;
  registrationNumber: string;
  country: string;
  countryCode: string;
  city: string;
  address: string;
  industry: string;
  companySize: string;
  website: string;
  contactPerson: string;
  contactRole: string;
  email: string;
  phone: string;
  yearsOperating: number;
  status: EmployerStatus;
  verification: VerificationStatus;
  /** Index into `VERIFICATION_STAGES`; 0 means not yet submitted for review. */
  verificationStage: number;
  verificationUpdatedAt: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  employerId: string | null;
  createdAt: string;
  read: boolean;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export interface ActivityLogEntry {
  id: string;
  user: string;
  userInitials: string;
  action: string;
  actionType: ActivityActionType;
  employerId: string | null;
  employerName: string;
  timestamp: string;
  detail?: string;
}

export interface ShortlistEntry {
  employerId: string;
  note: string;
  addedAt: string;
  addedBy: string;
}

export interface VerificationEvent {
  id: string;
  employerId: string;
  stage: string;
  actor: string;
  timestamp: string;
  outcome: 'completed' | 'current' | 'pending' | 'failed';
  comment: string;
}

/* ------------------------------------------------------------------ */
/* Filtering                                                           */
/* ------------------------------------------------------------------ */

export interface FilterState {
  search: string;

  // Basic
  country: string[];
  city: string[];
  industry: string[];
  jobCategory: string[];
  position: string[];
  employerStatus: string[];
  verification: string[];

  // Employment
  salaryMin: number | null;
  salaryMax: number | null;
  contractDuration: number[];
  employmentType: string[];
  workingHours: string[];
  overtime: string[];

  // Financial
  processingFeeMax: number | null;
  placementFeeMax: number | null;
  visaFeeMax: number | null;
  medicalFeeMax: number | null;
  documentationFeeMax: number | null;
  totalCostMax: number | null;

  // Benefits
  accommodation: string[];
  transportation: string[];
  foodAllowance: string[];
  healthInsurance: string[];
  overtimePay: string[];
  annualLeave: string[];
  airfare: string[];

  // Contract
  contractStatus: string[];

  // Requirements
  requirementStatus: string[];

  sortBy: SortKey;
}

export type SortKey =
  | 'name-asc'
  | 'name-desc'
  | 'salary-desc'
  | 'salary-asc'
  | 'fee-asc'
  | 'fee-desc'
  | 'updated-desc'
  | 'updated-asc'
  | 'requirements-desc'
  | 'requirements-asc'
  | 'country-asc'
  | 'country-desc'
  | 'contract-expiry-asc'
  | 'contract-expiry-desc';

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: FilterState;
  system: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  useCount: number;
}

/**
 * A denormalised, read-optimised projection of one employer and everything
 * attached to it. Components consume `EmployerRecord` so they never have to
 * join collections themselves.
 */
export interface EmployerRecord {
  employer: Employer;
  jobs: JobOrder[];
  contract: Contract | null;
  fees: FeeItem[];
  requirements: RequirementItem[];
  documents: DocumentRecord[];
  notes: Note[];
  verificationEvents: VerificationEvent[];

  /* Derived — computed once in `buildEmployerRecords` */
  positionsAvailable: number;
  openJobOrders: number;
  salaryMinPhp: number;
  salaryMaxPhp: number;
  primaryJob: JobOrder | null;
  benefits: Benefits | null;
  feeTotals: Record<FeeType, number>;
  totalEstimatedCost: number;
  requirementCompletion: number;
  mandatoryOutstanding: number;
  daysToContractExpiry: number | null;
  expiredDocumentCount: number;
  pendingDocumentCount: number;
}

/* ------------------------------------------------------------------ */
/* UI helpers                                                          */
/* ------------------------------------------------------------------ */

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'warning' | 'info';
}

export interface TableColumn<T> {
  key: string;
  header: string;
  /** Always rendered regardless of the column-visibility menu. */
  locked?: boolean;
  defaultVisible?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string;
  sortable?: boolean;
  /**
   * Sort token for this column. `DataTable` reports it back through
   * `DataTableSort.onSort`; the employer list maps it onto a concrete
   * direction-aware `SortKey`.
   */
  sortKey?: string;
  /** Accessor enabling client-side sorting on generic tables. */
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
  /** Mobile card layout uses this to decide emphasis. */
  mobileLabel?: string;
}

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export type Density = 'comfortable' | 'compact';

export type ThemeMode = 'light' | 'dark';

export type ViewMode = 'table' | 'card';

export interface AppSettings {
  density: Density;
  /** `levelup` is the house blue sampled from the logo; the rest are alternatives. */
  accent: 'levelup' | 'indigo' | 'blue' | 'teal' | 'violet' | 'graphite';
  theme: ThemeMode;
  viewMode: ViewMode;
  rowsPerPage: number;
  landingPage: string;
  /** Controls whether salaries are shown in PHP, local currency, or both. */
  currencyDisplay: 'php' | 'local' | 'both';
  showArchived: boolean;
  /** Pre-applied when the filtering workspace is opened for the first time. */
  defaultCountry: string;
  defaultEmployerStatus: string;
  notificationPrefs: Record<NotificationCategory, boolean>;
}

/** Maximum number of employers that can sit side by side in the comparison. */
export const MAX_COMPARISON = 4;

/**
 * The payload the employer form submits. It intentionally spans several
 * entities because a staff member registers an employer *and* their first job
 * order, fee schedule and benefits package in one pass. `saveEmployer` in the
 * store expands this into the individual collections.
 */
export interface EmployerDraft {
  /* Company */
  companyName: string;
  legalName: string;
  country: string;
  city: string;
  address: string;
  industry: string;
  companySize: string;
  website: string;
  description: string;
  registrationNumber: string;

  /* Contact */
  contactPerson: string;
  contactRole: string;
  email: string;
  phone: string;

  /* Employment */
  position: string;
  jobCategory: string;
  salaryMinLocal: number;
  salaryMaxLocal: number;
  currency: string;
  contractDurationMonths: number;
  workingHours: WorkingHours;
  overtime: OvertimeAvailability;
  employmentType: EmploymentType;
  workersNeeded: number;

  /* Financial */
  fees: Record<FeeType, number>;

  /* Benefits */
  benefits: Benefits;

  /* Status */
  status: EmployerStatus;
  verification: VerificationStatus;
}
