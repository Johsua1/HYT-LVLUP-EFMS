import type { Benefits, FilterState, SelectOption } from '@/types';

/* ------------------------------------------------------------------ */
/* Reference data                                                      */
/* ------------------------------------------------------------------ */

export const COUNTRIES: SelectOption[] = [
  { value: 'Japan', label: 'Japan', hint: 'JP' },
  { value: 'South Korea', label: 'South Korea', hint: 'KR' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates', hint: 'AE' },
  { value: 'Singapore', label: 'Singapore', hint: 'SG' },
  { value: 'Australia', label: 'Australia', hint: 'AU' },
  { value: 'Sweden', label: 'Sweden', hint: 'SE' },
  { value: 'Canada', label: 'Canada', hint: 'CA' },
  { value: 'Germany', label: 'Germany', hint: 'DE' },
  { value: 'Qatar', label: 'Qatar', hint: 'QA' },
  { value: 'New Zealand', label: 'New Zealand', hint: 'NZ' },
];

export const COUNTRY_CODE: Record<string, string> = {
  Japan: 'JP',
  'South Korea': 'KR',
  'United Arab Emirates': 'AE',
  Singapore: 'SG',
  Australia: 'AU',
  Sweden: 'SE',
  Canada: 'CA',
  Germany: 'DE',
  Qatar: 'QA',
  'New Zealand': 'NZ',
};

/** Default payroll currency per destination, used to pre-fill the employer form. */
export const COUNTRY_CURRENCY: Record<string, string> = {
  Japan: 'JPY',
  'South Korea': 'KRW',
  'United Arab Emirates': 'AED',
  Singapore: 'SGD',
  Australia: 'AUD',
  Sweden: 'SEK',
  Canada: 'CAD',
  Germany: 'EUR',
  Qatar: 'QAR',
  'New Zealand': 'NZD',
};

/** Currency + a fixed reference rate to PHP used for cross-country comparison. */
export const CURRENCIES: Record<string, { symbol: string; rateToPhp: number; label: string }> = {
  PHP: { symbol: '₱', rateToPhp: 1, label: 'Philippine Peso' },
  JPY: { symbol: '¥', rateToPhp: 0.38, label: 'Japanese Yen' },
  KRW: { symbol: '₩', rateToPhp: 0.042, label: 'South Korean Won' },
  AED: { symbol: 'AED ', rateToPhp: 15.6, label: 'UAE Dirham' },
  SGD: { symbol: 'S$', rateToPhp: 42.5, label: 'Singapore Dollar' },
  AUD: { symbol: 'A$', rateToPhp: 37.8, label: 'Australian Dollar' },
  SEK: { symbol: 'kr ', rateToPhp: 5.4, label: 'Swedish Krona' },
  CAD: { symbol: 'C$', rateToPhp: 42.1, label: 'Canadian Dollar' },
  EUR: { symbol: '€', rateToPhp: 61.5, label: 'Euro' },
  QAR: { symbol: 'QAR ', rateToPhp: 15.7, label: 'Qatari Riyal' },
  NZD: { symbol: 'NZ$', rateToPhp: 34.6, label: 'New Zealand Dollar' },
};

export const INDUSTRIES = [
  'Manufacturing',
  'Construction',
  'Healthcare',
  'Hospitality',
  'Food Processing',
  'Logistics & Warehousing',
  'Agriculture',
  'Information Technology',
  'Engineering',
  'Retail',
  'Marine & Shipbuilding',
  'Facilities & Cleaning',
];

export const JOB_CATEGORIES = [
  'Production & Assembly',
  'Welding & Fabrication',
  'Construction Trades',
  'Nursing & Caregiving',
  'Hotel & Restaurant Service',
  'Food Processing',
  'Warehouse Operations',
  'Agriculture & Farming',
  'IT & Software',
  'Engineering & Technical',
  'Retail & Sales',
  'Shipbuilding',
  'Cleaning & Housekeeping',
  'Driver & Delivery',
];

export const POSITIONS = [
  'Factory Worker',
  'Assembly Line Operator',
  'Welder',
  'Steel Fixer',
  'Scaffolder',
  'Caregiver',
  'Registered Nurse',
  'Hotel Staff',
  'Food Processing Worker',
  'Warehouse Picker',
  'Agricultural Worker',
  'Software Engineer',
  'Mechanical Technician',
  'Shipfitter',
  'Cleaner',
  'Heavy Equipment Operator',
];

export const EMPLOYER_SIZES = [
  '11–50 employees',
  '51–200 employees',
  '201–500 employees',
  '501–1,000 employees',
  '1,000+ employees',
];

export const EMPLOYER_STATUSES = ['Active', 'Pending', 'Inactive', 'Suspended', 'Archived'] as const;
export const VERIFICATION_STATUSES = [
  'Verified',
  'Under Review',
  'Pending',
  'Requires Revision',
  'Rejected',
  'On Hold',
] as const;
export const CONTRACT_STATUSES = [
  'Draft',
  'Under Review',
  'Active',
  'Expiring Soon',
  'Expired',
  'Renewed',
] as const;
export const RENEWAL_STATUSES = [
  'Not Started',
  'Renewal Pending',
  'Renewed',
  'Not Renewable',
] as const;
export const JOB_STATUSES = ['Open', 'Filled', 'On Hold', 'Closed', 'Cancelled'] as const;
export const REQUIREMENT_STATUSES = [
  'Complete',
  'Incomplete',
  'Under Review',
  'Missing Documents',
] as const;
export const DOCUMENT_STATUSES = ['Verified', 'Pending Review', 'Rejected', 'Expired'] as const;
export const EMPLOYMENT_TYPES = ['Full-time', 'Contractual', 'Project-based'] as const;
export const WORKING_HOURS = [
  '8 hours/day',
  '9 hours/day',
  '10 hours/day',
  '12 hours/day',
  'Shift-based',
] as const;
export const OVERTIME_OPTIONS = ['Available', 'Limited', 'None'] as const;
export const PROVISION_LEVELS = ['Provided', 'Allowance', 'Not Provided'] as const;
export const AIRFARE_OPTIONS = ['Employer Paid', 'Shared', 'Worker Paid'] as const;
export const PAYMENT_STATUSES = ['Paid', 'Pending', 'Included', 'Waived', 'Not Applicable'] as const;
export const FEE_TYPES = [
  'Processing Fee',
  'Placement Fee',
  'Visa Fee',
  'Medical Fee',
  'Documentation Fee',
  'Insurance',
  'Other Fees',
] as const;
export const ANNUAL_LEAVE_OPTIONS = ['7 days', '10 days', '14 days', '15 days', '20 days', '21 days'];

export const CONTRACT_DURATION_OPTIONS = [
  { value: 6, label: '6 months' },
  { value: 12, label: '1 year' },
  { value: 24, label: '2 years' },
  { value: 36, label: '3 years' },
  { value: 60, label: '5 years' },
];

export const DOCUMENT_TYPES = [
  'Contract',
  'Business Registration',
  'Job Order',
  'Employer Document',
  'Visa Document',
  'Insurance',
  'Other',
];

/* ------------------------------------------------------------------ */
/* Requirement master list — the canonical checklist for every employer */
/* ------------------------------------------------------------------ */

export interface RequirementTemplate {
  key: string;
  label: string;
  description: string;
  mandatory: boolean;
}

export const REQUIREMENT_TEMPLATE: RequirementTemplate[] = [
  {
    key: 'company-registration',
    label: 'Company Registration',
    description: 'Certificate of incorporation or equivalent business registration from the host country.',
    mandatory: true,
  },
  {
    key: 'job-order',
    label: 'Job Order',
    description: 'Signed job order stating position, headcount, salary and deployment schedule.',
    mandatory: true,
  },
  {
    key: 'employment-contract',
    label: 'Employment Contract',
    description: 'Standard employment contract compliant with the destination country labour law.',
    mandatory: true,
  },
  {
    key: 'salary-information',
    label: 'Salary Information',
    description: 'Documented salary structure, deductions, overtime rate and payment schedule.',
    mandatory: true,
  },
  {
    key: 'visa-information',
    label: 'Visa Information',
    description: 'Visa category, processing timeline and embassy requirements.',
    mandatory: true,
  },
  {
    key: 'business-documents',
    label: 'Business Documents',
    description: 'Mayor’s permit, tax registration, and proof of business address.',
    mandatory: true,
  },
  {
    key: 'insurance-documents',
    label: 'Insurance Documents',
    description: 'Workmen’s compensation / health insurance policy covering deployed workers.',
    mandatory: true,
  },
  {
    key: 'employer-identification',
    label: 'Employer Identification',
    description: 'Authorised representative ID and letter of authority.',
    mandatory: false,
  },
  {
    key: 'accommodation-certificate',
    label: 'Accommodation Certificate',
    description: 'Proof of worker housing or accommodation allowance commitment.',
    mandatory: false,
  },
  {
    key: 'manpower-request',
    label: 'Manpower Request Letter',
    description: 'Formal request letter addressed to the agency with the employer letterhead.',
    mandatory: false,
  },
];

/* ------------------------------------------------------------------ */
/* Verification workflow                                               */
/* ------------------------------------------------------------------ */

export const VERIFICATION_STAGES = [
  { key: 'submitted', label: 'Employer Submitted', description: 'Employer profile and initial documents received.' },
  { key: 'documents', label: 'Documents Reviewed', description: 'Business, visa and insurance documents validated.' },
  { key: 'contract', label: 'Contract Reviewed', description: 'Employment contract checked against labour standards.' },
  { key: 'fees', label: 'Fees Verified', description: 'Fee structure reviewed and confirmed compliant.' },
  { key: 'approved', label: 'Employer Approved', description: 'Employer cleared for deployment and monitoring.' },
];

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

export const DEFAULT_BENEFITS: Benefits = {
  accommodation: 'Not Provided',
  transportation: 'Not Provided',
  foodAllowance: 'Not Provided',
  healthInsurance: false,
  overtimePay: false,
  annualLeave: '0 days',
  airfare: 'Worker Paid',
};

export const EMPTY_FILTERS: FilterState = {
  search: '',
  country: [],
  city: [],
  industry: [],
  jobCategory: [],
  position: [],
  employerStatus: [],
  verification: [],
  salaryMin: null,
  salaryMax: null,
  contractDuration: [],
  employmentType: [],
  workingHours: [],
  overtime: [],
  processingFeeMax: null,
  placementFeeMax: null,
  visaFeeMax: null,
  medicalFeeMax: null,
  documentationFeeMax: null,
  totalCostMax: null,
  accommodation: [],
  transportation: [],
  foodAllowance: [],
  healthInsurance: [],
  overtimePay: [],
  annualLeave: [],
  airfare: [],
  contractStatus: [],
  requirementStatus: [],
  sortBy: 'updated-desc',
};

export const SORT_OPTIONS: SelectOption[] = [
  { value: 'updated-desc', label: 'Recently updated' },
  { value: 'updated-asc', label: 'Least recently updated' },
  { value: 'name-asc', label: 'Company name (A–Z)' },
  { value: 'name-desc', label: 'Company name (Z–A)' },
  { value: 'salary-desc', label: 'Highest salary (PHP)' },
  { value: 'salary-asc', label: 'Lowest salary (PHP)' },
  { value: 'fee-asc', label: 'Lowest total cost' },
  { value: 'fee-desc', label: 'Highest total cost' },
  { value: 'requirements-desc', label: 'Most complete requirements' },
  { value: 'requirements-asc', label: 'Least complete requirements' },
  { value: 'country-asc', label: 'Country (A–Z)' },
  { value: 'contract-expiry-asc', label: 'Contract expiring soonest' },
];

export const NOTIFICATION_CATEGORIES = [
  'Contract',
  'Document',
  'Verification',
  'Fee',
  'Requirement',
  'Employer',
  'System',
] as const;

export const ACTIVE_FILTER_GROUPS = [
  { id: 'basic', label: 'Basic', description: 'Country, industry, position, status' },
  { id: 'employment', label: 'Employment', description: 'Salary, duration, hours, overtime' },
  { id: 'financial', label: 'Financial', description: 'Fees and total estimated cost' },
  { id: 'benefits', label: 'Benefits', description: 'Accommodation, insurance, airfare' },
  { id: 'contract', label: 'Contract', description: 'Lifecycle status' },
  { id: 'requirements', label: 'Requirements', description: 'Documentation completeness' },
] as const;
