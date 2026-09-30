import type { EmployerDraft, EmployerRecord, FeeType } from '@/types';
import { FEE_TYPES } from './constants';

/* ------------------------------------------------------------------ */
/* Construction                                                        */
/* ------------------------------------------------------------------ */

export function emptyFeeSchedule(): Record<FeeType, number> {
  return FEE_TYPES.reduce((acc, type) => ({ ...acc, [type]: 0 }), {} as Record<FeeType, number>);
}

export function createEmptyDraft(defaults?: {
  country?: string;
  status?: string;
}): EmployerDraft {
  return {
    companyName: '',
    legalName: '',
    country: defaults?.country || 'Japan',
    city: '',
    address: '',
    industry: 'Manufacturing',
    companySize: '51–200 employees',
    website: '',
    description: '',
    registrationNumber: '',

    contactPerson: '',
    contactRole: '',
    email: '',
    phone: '',

    position: 'Factory Worker',
    jobCategory: 'Production & Assembly',
    salaryMinLocal: 0,
    salaryMaxLocal: 0,
    currency: 'JPY',
    contractDurationMonths: 36,
    workingHours: '8 hours/day',
    overtime: 'Available',
    employmentType: 'Full-time',
    workersNeeded: 10,

    fees: {
      'Processing Fee': 0,
      'Placement Fee': 0,
      'Visa Fee': 0,
      'Medical Fee': 0,
      'Documentation Fee': 0,
      Insurance: 0,
      'Other Fees': 0,
    },

    benefits: {
      accommodation: 'Not Provided',
      transportation: 'Not Provided',
      foodAllowance: 'Not Provided',
      healthInsurance: false,
      overtimePay: false,
      annualLeave: '0 days',
      airfare: 'Worker Paid',
    },

    status: (defaults?.status as EmployerDraft['status']) || 'Pending',
    verification: 'Pending',
  };
}

/** Projects an existing employer back into the form shape for editing. */
export function draftFromRecord(record: EmployerRecord): EmployerDraft {
  const { employer, primaryJob, fees } = record;
  const feeMap = emptyFeeSchedule();
  fees.forEach((fee) => {
    feeMap[fee.type] = fee.amount;
  });

  return {
    companyName: employer.companyName,
    legalName: employer.legalName,
    country: employer.country,
    city: employer.city,
    address: employer.address,
    industry: employer.industry,
    companySize: employer.companySize,
    website: employer.website,
    description: employer.description,
    registrationNumber: employer.registrationNumber,

    contactPerson: employer.contactPerson,
    contactRole: employer.contactRole,
    email: employer.email,
    phone: employer.phone,

    position: primaryJob?.position ?? '',
    jobCategory: primaryJob?.jobCategory ?? '',
    salaryMinLocal: primaryJob?.salaryMinLocal ?? 0,
    salaryMaxLocal: primaryJob?.salaryMaxLocal ?? 0,
    currency: primaryJob?.currency ?? 'PHP',
    contractDurationMonths: primaryJob?.contractDurationMonths ?? 36,
    workingHours: primaryJob?.workingHours ?? '8 hours/day',
    overtime: primaryJob?.overtime ?? 'Available',
    employmentType: primaryJob?.employmentType ?? 'Full-time',
    workersNeeded: primaryJob?.workersNeeded ?? 0,

    fees: feeMap,
    benefits: primaryJob?.benefits ?? createEmptyDraft().benefits,

    status: employer.status,
    verification: employer.verification,
  };
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export type DraftErrors = Partial<Record<keyof EmployerDraft | 'salaryRange', string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_PATTERN = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([\w\-.,@?^=%&:/~+#]*)?$/;

/**
 * Field-level validation for the registration form. Messages are written as
 * instructions ("Enter the monthly salary in the employer's currency") rather
 * than restating the field name, so the error list is actionable on its own.
 */
export function validateEmployerDraft(draft: EmployerDraft): DraftErrors {
  const errors: DraftErrors = {};

  if (!draft.companyName.trim()) errors.companyName = 'Company name is required.';
  else if (draft.companyName.trim().length < 3) errors.companyName = 'Use at least 3 characters.';

  if (!draft.country.trim()) errors.country = 'Select a destination country.';
  if (!draft.city.trim()) errors.city = 'City is required.';
  if (!draft.industry.trim()) errors.industry = 'Select an industry.';

  if (!draft.contactPerson.trim()) errors.contactPerson = 'Name a contact person at the employer.';
  if (!draft.email.trim()) errors.email = 'Email is required for verification correspondence.';
  else if (!EMAIL_PATTERN.test(draft.email.trim())) errors.email = 'Enter a valid email address.';

  if (draft.phone.trim() && draft.phone.trim().length < 6) errors.phone = 'Enter a reachable phone number.';
  if (draft.website.trim() && !URL_PATTERN.test(draft.website.trim())) {
    errors.website = 'Enter a valid website address.';
  }

  if (!draft.position.trim()) errors.position = 'Specify the position being offered.';
  if (!draft.jobCategory.trim()) errors.jobCategory = 'Select a job category.';

  if (draft.salaryMinLocal <= 0) errors.salaryMinLocal = 'Enter the minimum monthly salary.';
  if (draft.salaryMaxLocal <= 0) errors.salaryMaxLocal = 'Enter the maximum monthly salary.';
  if (draft.salaryMinLocal > 0 && draft.salaryMaxLocal > 0 && draft.salaryMinLocal > draft.salaryMaxLocal) {
    errors.salaryRange = 'The minimum salary cannot exceed the maximum.';
  }

  if (draft.contractDurationMonths <= 0) errors.contractDurationMonths = 'Select a contract duration.';
  if (draft.workersNeeded < 1) errors.workersNeeded = 'Request at least one worker.';

  if (draft.description.trim().length > 0 && draft.description.trim().length < 20) {
    errors.description = 'Add a little more detail (at least 20 characters).';
  }

  return errors;
}

export function hasErrors(errors: DraftErrors): boolean {
  return Object.keys(errors).length > 0;
}
