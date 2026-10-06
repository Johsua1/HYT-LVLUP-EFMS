import type {
  AirfareArrangement,
  Benefits,
  ContractStatus,
  EmployerStatus,
  FeeType,
  JobStatus,
  OvertimeAvailability,
  PaymentStatus,
  ProvisionLevel,
  RenewalStatus,
  VerificationStatus,
  WorkingHours,
} from '@/types';

/**
 * Hand-authored seed data.
 *
 * ⚠️ The employer NAMES in this file are real, publicly-known organisations and
 * the identity facts shown for them (legal name, headquarters city and address,
 * industry, website and founding year) are taken from public sources.
 *
 * Everything else is ILLUSTRATIVE SAMPLE DATA and must not be read as a factual
 * claim about any of these companies:
 *   • registration numbers, contact people, emails and phone numbers are
 *     deliberately obvious placeholders (`To be supplied`, `example.com`, …);
 *   • job orders, headcounts, salary bands, contracts, fee structures,
 *     documents and notes were invented so the filtering, verification and fee
 *     workflows can be exercised with believable numbers.
 *
 * Replace the placeholders with your agency's real, verified records before
 * using this data for actual placement decisions.
 */

export interface SeedJob {
  position: string;
  jobCategory: string;
  workersNeeded: number;
  workersDeployed: number;
  salaryMinLocal: number;
  salaryMaxLocal: number;
  workingHours: WorkingHours;
  overtime: OvertimeAvailability;
  contractDurationMonths: number;
  employmentType: 'Full-time' | 'Contractual' | 'Project-based';
  benefits: Benefits;
  requirements: string[];
  status: JobStatus;
  postedOffsetDays: number;
}

export interface SeedContract {
  contractNumber: string;
  startOffsetDays: number;
  endOffsetDays: number;
  durationMonths: number;
  workingConditions: string;
  renewalStatus: RenewalStatus;
  status: ContractStatus;
  signedOffsetDays: number | null;
  notes: string;
}

export interface SeedDocument {
  name: string;
  type: string;
  status: 'Verified' | 'Pending Review' | 'Rejected' | 'Expired';
  uploadedOffsetDays: number;
  expiresOffsetDays: number | null;
  fileSizeKb: number;
  notes?: string;
}

export interface SeedNote {
  author: string;
  body: string;
  offsetDays: number;
  pinned: boolean;
}

export interface EmployerSeed {
  id: string;
  companyName: string;
  legalName: string;
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
  verificationStage: number;
  description: string;
  createdOffsetDays: number;
  updatedOffsetDays: number;
  updatedBy: string;
  currency: string;
  jobs: SeedJob[];
  contract: SeedContract;
  feeAmounts: Record<FeeType, number>;
  feeStatus: Partial<Record<FeeType, PaymentStatus>>;
  feeBorneBy: Partial<Record<FeeType, 'Worker' | 'Employer' | 'Shared'>>;
  completedRequirements: string[];
  reviewRequirements: string[];
  documents: SeedDocument[];
  notes: SeedNote[];
}

const BEN = (
  accommodation: ProvisionLevel,
  transportation: ProvisionLevel,
  foodAllowance: ProvisionLevel,
  healthInsurance: boolean,
  overtimePay: boolean,
  annualLeave: string,
  airfare: AirfareArrangement,
): Benefits => ({
  accommodation,
  transportation,
  foodAllowance,
  healthInsurance,
  overtimePay,
  annualLeave,
  airfare,
});

/** Shared placeholder values for the fields we do not (and must not) invent. */
const PLACEHOLDER = {
  registrationNumber: 'To be supplied',
  contactPerson: 'To be confirmed',
  contactRole: 'Recruitment contact',
  email: 'to.be.confirmed@example.com',
  phone: '+00 000 000 0000',
};

/* ------------------------------------------------------------------ */
/* Japan — Toyota Motor Corporation                                    */
/* ------------------------------------------------------------------ */

const toyota: EmployerSeed = {
  id: 'emp-101',
  companyName: 'Toyota Motor Corporation',
  legalName: 'Toyota Motor Corporation',
  logoInitials: 'TM',
  logoHue: 355,
  ...PLACEHOLDER,
  country: 'Japan',
  countryCode: 'JP',
  city: 'Toyota City',
  address: '1 Toyota-cho, Toyota City, Aichi 471-8571',
  industry: 'Manufacturing',
  companySize: '1,000+ employees',
  website: 'global.toyota',
  yearsOperating: 89,
  status: 'Active',
  verification: 'Verified',
  verificationStage: 4,
  description:
    'Japanese multinational automotive manufacturer headquartered in Toyota City, Aichi. One of the largest vehicle producers in the world, with assembly and components operations across Japan.',
  createdOffsetDays: -640,
  updatedOffsetDays: -3,
  updatedBy: 'Johsua Rivera',
  currency: 'JPY',
  jobs: [
    {
      position: 'Factory Worker',
      jobCategory: 'Production & Assembly',
      workersNeeded: 40,
      workersDeployed: 26,
      salaryMinLocal: 180000,
      salaryMaxLocal: 220000,
      workingHours: '8 hours/day',
      overtime: 'Available',
      contractDurationMonths: 36,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Allowance', true, true, '14 days', 'Employer Paid'),
      requirements: ['JLPT N4 or above', 'Age 20–35', 'Physically fit'],
      status: 'Open',
      postedOffsetDays: -90,
    },
    {
      position: 'Assembly Line Operator',
      jobCategory: 'Production & Assembly',
      workersNeeded: 25,
      workersDeployed: 15,
      salaryMinLocal: 175000,
      salaryMaxLocal: 210000,
      workingHours: 'Shift-based',
      overtime: 'Available',
      contractDurationMonths: 36,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Allowance', true, true, '14 days', 'Employer Paid'),
      requirements: ['JLPT N4 or above', 'Shift work tolerance'],
      status: 'Open',
      postedOffsetDays: -52,
    },
    {
      position: 'Mechanical Technician',
      jobCategory: 'Engineering & Technical',
      workersNeeded: 10,
      workersDeployed: 10,
      salaryMinLocal: 250000,
      salaryMaxLocal: 310000,
      workingHours: '8 hours/day',
      overtime: 'Limited',
      contractDurationMonths: 60,
      employmentType: 'Full-time',
      benefits: BEN('Allowance', 'Provided', 'Provided', true, true, '20 days', 'Employer Paid'),
      requirements: ['BS Mechanical Engineering', 'JLPT N3', '3 years experience'],
      status: 'Filled',
      postedOffsetDays: -230,
    },
  ],
  contract: {
    contractNumber: 'CTR-JP-2026-0101',
    startOffsetDays: -455,
    endOffsetDays: 275,
    durationMonths: 36,
    workingConditions:
      'Standard 8-hour shift, 5 days per week. Overtime paid at 125% of base rate. Dormitory provided within 30 minutes of the plant.',
    renewalStatus: 'Not Started',
    status: 'Active',
    signedOffsetDays: -470,
    notes: 'Batch 3 deployment completed. Remaining headcount scheduled for the next intake cycle.',
  },
  feeAmounts: {
    'Processing Fee': 42000,
    'Placement Fee': 58000,
    'Visa Fee': 8500,
    'Medical Fee': 6500,
    'Documentation Fee': 4200,
    Insurance: 12000,
    'Other Fees': 3800,
  },
  feeStatus: { 'Processing Fee': 'Paid', 'Placement Fee': 'Pending', Insurance: 'Included' },
  feeBorneBy: { Insurance: 'Employer' },
  completedRequirements: [
    'company-registration',
    'job-order',
    'employment-contract',
    'salary-information',
    'visa-information',
    'business-documents',
    'insurance-documents',
    'employer-identification',
    'accommodation-certificate',
    'manpower-request',
  ],
  reviewRequirements: [],
  documents: [
    { name: 'Employment Contract 2026 Batch', type: 'Contract', status: 'Verified', uploadedOffsetDays: -465, expiresOffsetDays: 275, fileSizeKb: 812 },
    { name: 'Certificate of Incorporation', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -630, expiresOffsetDays: null, fileSizeKb: 1240 },
    { name: 'Job Order JO-2026-101', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -90, expiresOffsetDays: 180, fileSizeKb: 356 },
    { name: 'Workmen Compensation Policy', type: 'Insurance', status: 'Verified', uploadedOffsetDays: -400, expiresOffsetDays: 48, fileSizeKb: 940 },
    { name: 'Dormitory Inspection Report', type: 'Employer Document', status: 'Verified', uploadedOffsetDays: -320, expiresOffsetDays: 70, fileSizeKb: 2210 },
    { name: 'Certificate of Employment — Representative', type: 'Employer Document', status: 'Pending Review', uploadedOffsetDays: -6, expiresOffsetDays: null, fileSizeKb: 410 },
  ],
  notes: [
    {
      author: 'Johsua Rivera',
      body: 'Employer confirmed a base salary adjustment for the next intake. Updated the salary band on the open job order.',
      offsetDays: -3,
      pinned: true,
    },
    {
      author: 'Maria Santos',
      body: 'Dormitory inspection report expires in about two months — request the renewed copy from the employer coordinator.',
      offsetDays: -18,
      pinned: false,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* South Korea — Samsung Heavy Industries                              */
/* ------------------------------------------------------------------ */

const samsungHeavy: EmployerSeed = {
  id: 'emp-102',
  companyName: 'Samsung Heavy Industries',
  legalName: 'Samsung Heavy Industries Co., Ltd.',
  logoInitials: 'SH',
  logoHue: 205,
  ...PLACEHOLDER,
  country: 'South Korea',
  countryCode: 'KR',
  city: 'Geoje',
  address: 'Geoje Shipyard, Geoje-si, Gyeongsangnam-do',
  industry: 'Marine & Shipbuilding',
  companySize: '1,000+ employees',
  website: 'www.samsungshi.com',
  yearsOperating: 52,
  status: 'Active',
  verification: 'Verified',
  verificationStage: 4,
  description:
    'South Korean shipbuilder headquartered in Seongnam with its principal yard on Geoje Island. Builds LNG carriers, drillships and offshore platforms.',
  createdOffsetDays: -560,
  updatedOffsetDays: -6,
  updatedBy: 'Johsua Rivera',
  currency: 'KRW',
  jobs: [
    {
      position: 'Shipfitter',
      jobCategory: 'Shipbuilding',
      workersNeeded: 60,
      workersDeployed: 44,
      salaryMinLocal: 2300000,
      salaryMaxLocal: 2900000,
      workingHours: '8 hours/day',
      overtime: 'Available',
      contractDurationMonths: 36,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Provided', true, true, '15 days', 'Employer Paid'),
      requirements: ['EPS-TOPIK passer', 'Shipyard experience preferred', 'Age 18–39'],
      status: 'Open',
      postedOffsetDays: -120,
    },
    {
      position: 'Welder',
      jobCategory: 'Welding & Fabrication',
      workersNeeded: 40,
      workersDeployed: 22,
      salaryMinLocal: 2500000,
      salaryMaxLocal: 3100000,
      workingHours: '8 hours/day',
      overtime: 'Available',
      contractDurationMonths: 36,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Provided', true, true, '15 days', 'Employer Paid'),
      requirements: ['EPS-TOPIK passer', '6G welding certification'],
      status: 'Open',
      postedOffsetDays: -55,
    },
  ],
  contract: {
    contractNumber: 'CTR-KR-2026-0102',
    startOffsetDays: -220,
    endOffsetDays: 128,
    durationMonths: 36,
    workingConditions:
      'Eight-hour day shift with paid overtime. Dormitory and three meals provided on site. Severance pay accrues under the Labour Standards Act.',
    renewalStatus: 'Not Started',
    status: 'Active',
    signedOffsetDays: -234,
    notes: 'Deployment on schedule. Employer requested an additional 20 shipfitters for the next quarter.',
  },
  feeAmounts: {
    'Processing Fee': 35000,
    'Placement Fee': 48000,
    'Visa Fee': 7200,
    'Medical Fee': 6000,
    'Documentation Fee': 3500,
    Insurance: 9800,
    'Other Fees': 2100,
  },
  feeStatus: { 'Processing Fee': 'Paid', 'Placement Fee': 'Included', 'Visa Fee': 'Paid' },
  feeBorneBy: { 'Placement Fee': 'Employer', Insurance: 'Employer' },
  completedRequirements: [
    'company-registration',
    'job-order',
    'employment-contract',
    'salary-information',
    'visa-information',
    'business-documents',
    'insurance-documents',
    'employer-identification',
    'accommodation-certificate',
  ],
  reviewRequirements: [],
  documents: [
    { name: 'Employment Contract EPS Batch 5', type: 'Contract', status: 'Verified', uploadedOffsetDays: -234, expiresOffsetDays: 128, fileSizeKb: 730 },
    { name: 'Corporate Registry Certificate', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -550, expiresOffsetDays: null, fileSizeKb: 1120 },
    { name: 'Job Order JO-2026-102', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -120, expiresOffsetDays: 245, fileSizeKb: 402 },
    { name: 'E-9 Visa Guidance Sheet', type: 'Visa Document', status: 'Verified', uploadedOffsetDays: -110, expiresOffsetDays: null, fileSizeKb: 288 },
    { name: 'Group Accident Insurance', type: 'Insurance', status: 'Verified', uploadedOffsetDays: -200, expiresOffsetDays: 165, fileSizeKb: 860 },
  ],
  notes: [
    {
      author: 'Johsua Rivera',
      body: 'Reliable repeat client — three consecutive batches with zero placement disputes. Good candidate for the preferred-employer shortlist.',
      offsetDays: -6,
      pinned: true,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* United Arab Emirates — The Emirates Group                           */
/* ------------------------------------------------------------------ */

const emiratesGroup: EmployerSeed = {
  id: 'emp-103',
  companyName: 'The Emirates Group',
  legalName: 'The Emirates Group',
  logoInitials: 'EG',
  logoHue: 5,
  ...PLACEHOLDER,
  country: 'United Arab Emirates',
  countryCode: 'AE',
  city: 'Dubai',
  address: 'Emirates Group Headquarters, PO Box 686, Dubai',
  industry: 'Hospitality',
  companySize: '1,000+ employees',
  website: 'www.emirates.com',
  yearsOperating: 41,
  status: 'Active',
  verification: 'Verified',
  verificationStage: 4,
  description:
    'Aviation and travel group headquartered in Dubai, comprising Emirates airline and dnata. Employs a large multinational workforce across airport, catering and hospitality operations.',
  createdOffsetDays: -500,
  updatedOffsetDays: -2,
  updatedBy: 'Angelo Cruz',
  currency: 'AED',
  jobs: [
    {
      position: 'Hotel Staff',
      jobCategory: 'Hotel & Restaurant Service',
      workersNeeded: 55,
      workersDeployed: 38,
      salaryMinLocal: 1600,
      salaryMaxLocal: 2200,
      workingHours: '9 hours/day',
      overtime: 'Limited',
      contractDurationMonths: 24,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Provided', true, true, '21 days', 'Employer Paid'),
      requirements: ['Good English communication', 'Hospitality experience preferred', 'Age 21–35'],
      status: 'Open',
      postedOffsetDays: -85,
    },
    {
      position: 'Cleaner',
      jobCategory: 'Cleaning & Housekeeping',
      workersNeeded: 30,
      workersDeployed: 30,
      salaryMinLocal: 1200,
      salaryMaxLocal: 1600,
      workingHours: '9 hours/day',
      overtime: 'Limited',
      contractDurationMonths: 24,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Provided', true, true, '21 days', 'Employer Paid'),
      requirements: ['Basic English', 'Physically fit'],
      status: 'Filled',
      postedOffsetDays: -150,
    },
  ],
  contract: {
    contractNumber: 'CTR-AE-2026-0103',
    startOffsetDays: -185,
    endOffsetDays: 545,
    durationMonths: 24,
    workingConditions:
      'Nine-hour shift inclusive of a one-hour break. Shared accommodation, transport and duty meals provided. Gratuity payable on completion of service.',
    renewalStatus: 'Not Started',
    status: 'Active',
    signedOffsetDays: -198,
    notes: 'Steady pipeline. Employer absorbs visa and insurance cost for all deployed workers.',
  },
  feeAmounts: {
    'Processing Fee': 25000,
    'Placement Fee': 32000,
    'Visa Fee': 5500,
    'Medical Fee': 4800,
    'Documentation Fee': 2800,
    Insurance: 7500,
    'Other Fees': 1500,
  },
  feeStatus: { 'Processing Fee': 'Paid', 'Placement Fee': 'Paid', Insurance: 'Waived', 'Visa Fee': 'Included' },
  feeBorneBy: { 'Visa Fee': 'Employer', Insurance: 'Employer' },
  completedRequirements: [
    'company-registration',
    'job-order',
    'employment-contract',
    'salary-information',
    'visa-information',
    'business-documents',
    'insurance-documents',
    'employer-identification',
    'accommodation-certificate',
    'manpower-request',
  ],
  reviewRequirements: [],
  documents: [
    { name: 'Standard Employment Contract', type: 'Contract', status: 'Verified', uploadedOffsetDays: -198, expiresOffsetDays: 545, fileSizeKb: 655 },
    { name: 'Trade Licence', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -490, expiresOffsetDays: 96, fileSizeKb: 890 },
    { name: 'Job Order JO-2026-103', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -85, expiresOffsetDays: 280, fileSizeKb: 344 },
    { name: 'Accommodation Lease Agreement', type: 'Employer Document', status: 'Verified', uploadedOffsetDays: -170, expiresOffsetDays: 190, fileSizeKb: 1420 },
    { name: 'Medical Insurance Schedule', type: 'Insurance', status: 'Verified', uploadedOffsetDays: -178, expiresOffsetDays: 185, fileSizeKb: 700 },
    { name: 'Passport Specimen Template', type: 'Visa Document', status: 'Pending Review', uploadedOffsetDays: -4, expiresOffsetDays: null, fileSizeKb: 190 },
  ],
  notes: [
    {
      author: 'Angelo Cruz',
      body: 'Employer confirmed the trade licence renewal is in progress with the Dubai Economy department. Follow up before it lapses in roughly three months.',
      offsetDays: -2,
      pinned: true,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Singapore — Keppel Ltd                                              */
/* ------------------------------------------------------------------ */

const keppel: EmployerSeed = {
  id: 'emp-104',
  companyName: 'Keppel Ltd',
  legalName: 'Keppel Ltd.',
  logoInitials: 'KP',
  logoHue: 190,
  ...PLACEHOLDER,
  country: 'Singapore',
  countryCode: 'SG',
  city: 'Singapore',
  address: '1 Harbourfront Avenue, #18-01 Keppel Bay Tower, Singapore 098632',
  industry: 'Engineering',
  companySize: '1,000+ employees',
  website: 'www.keppel.com',
  yearsOperating: 58,
  status: 'Active',
  verification: 'Verified',
  verificationStage: 4,
  description:
    'Singapore-headquartered asset manager and operator with deep engineering roots in marine, offshore and infrastructure projects across more than 20 countries.',
  createdOffsetDays: -430,
  updatedOffsetDays: -11,
  updatedBy: 'Maria Santos',
  currency: 'SGD',
  jobs: [
    {
      position: 'Mechanical Technician',
      jobCategory: 'Engineering & Technical',
      workersNeeded: 24,
      workersDeployed: 15,
      salaryMinLocal: 1400,
      salaryMaxLocal: 1800,
      workingHours: '8 hours/day',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Contractual',
      benefits: BEN('Allowance', 'Allowance', 'Not Provided', true, true, '14 days', 'Employer Paid'),
      requirements: ['Nitec / Diploma in Mechanical Engineering', '2 years experience', 'Basic English'],
      status: 'Open',
      postedOffsetDays: -52,
    },
    {
      position: 'Welder',
      jobCategory: 'Welding & Fabrication',
      workersNeeded: 18,
      workersDeployed: 9,
      salaryMinLocal: 1300,
      salaryMaxLocal: 1700,
      workingHours: 'Shift-based',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Contractual',
      benefits: BEN('Allowance', 'Allowance', 'Not Provided', true, true, '14 days', 'Employer Paid'),
      requirements: ['3G / 4G welding certification', 'Shift rotation'],
      status: 'Open',
      postedOffsetDays: -30,
    },
  ],
  contract: {
    contractNumber: 'CTR-SG-2026-0104',
    startOffsetDays: -345,
    endOffsetDays: 22,
    durationMonths: 12,
    workingConditions:
      'Eight-hour shift with a 45-minute break. Housing allowance of S$300 per month. Overtime paid at 1.5× the hourly basic rate.',
    renewalStatus: 'Renewal Pending',
    status: 'Expiring Soon',
    signedOffsetDays: -358,
    notes: 'Renewal package submitted by the employer. Pending counter-signature from the project office.',
  },
  feeAmounts: {
    'Processing Fee': 32000,
    'Placement Fee': 40000,
    'Visa Fee': 6200,
    'Medical Fee': 5200,
    'Documentation Fee': 3200,
    Insurance: 8600,
    'Other Fees': 1800,
  },
  feeStatus: { 'Processing Fee': 'Paid', 'Placement Fee': 'Pending', 'Visa Fee': 'Paid', 'Medical Fee': 'Paid' },
  feeBorneBy: { Insurance: 'Shared' },
  completedRequirements: [
    'company-registration',
    'job-order',
    'employment-contract',
    'salary-information',
    'visa-information',
    'business-documents',
    'insurance-documents',
    'manpower-request',
  ],
  reviewRequirements: ['employer-identification'],
  documents: [
    { name: 'Employment Contract 2026', type: 'Contract', status: 'Verified', uploadedOffsetDays: -358, expiresOffsetDays: 22, fileSizeKb: 588 },
    { name: 'ACRA Business Profile', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -425, expiresOffsetDays: null, fileSizeKb: 760 },
    { name: 'Job Order JO-2026-104', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -52, expiresOffsetDays: 310, fileSizeKb: 286 },
    { name: 'Work Permit In-Principle Approval', type: 'Visa Document', status: 'Verified', uploadedOffsetDays: -48, expiresOffsetDays: 140, fileSizeKb: 330 },
    { name: 'Medical Insurance Policy', type: 'Insurance', status: 'Verified', uploadedOffsetDays: -230, expiresOffsetDays: 132, fileSizeKb: 812 },
  ],
  notes: [
    {
      author: 'Maria Santos',
      body: 'Contract lapses in under a month. Renewal draft is with the employer; escalate if no counter-signature within 10 days.',
      offsetDays: -11,
      pinned: true,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Australia — Ramsay Health Care                                      */
/* ------------------------------------------------------------------ */

const ramsay: EmployerSeed = {
  id: 'emp-105',
  companyName: 'Ramsay Health Care',
  legalName: 'Ramsay Health Care Limited',
  logoInitials: 'RH',
  logoHue: 340,
  ...PLACEHOLDER,
  country: 'Australia',
  countryCode: 'AU',
  city: 'Sydney',
  address: 'Level 7, Tower B, 7 Westbourne Street, St Leonards NSW 2065',
  industry: 'Healthcare',
  companySize: '1,000+ employees',
  website: 'www.ramsayhealth.com',
  yearsOperating: 62,
  status: 'Active',
  verification: 'Verified',
  verificationStage: 4,
  description:
    'One of the largest private hospital operators in the world, founded in Australia and headquartered in Sydney. Runs hospitals and day-surgery facilities across multiple countries.',
  createdOffsetDays: -410,
  updatedOffsetDays: -5,
  updatedBy: 'Angelo Cruz',
  currency: 'AUD',
  jobs: [
    {
      position: 'Registered Nurse',
      jobCategory: 'Nursing & Caregiving',
      workersNeeded: 25,
      workersDeployed: 14,
      salaryMinLocal: 3900,
      salaryMaxLocal: 4900,
      workingHours: '8 hours/day',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Full-time',
      benefits: BEN('Not Provided', 'Not Provided', 'Not Provided', true, true, '20 days', 'Shared'),
      requirements: ['AHPRA registration eligibility', 'IELTS 7.0 overall', 'Bachelor of Nursing'],
      status: 'Open',
      postedOffsetDays: -110,
    },
    {
      position: 'Caregiver',
      jobCategory: 'Nursing & Caregiving',
      workersNeeded: 30,
      workersDeployed: 18,
      salaryMinLocal: 3100,
      salaryMaxLocal: 3800,
      workingHours: 'Shift-based',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Full-time',
      benefits: BEN('Not Provided', 'Not Provided', 'Allowance', true, true, '20 days', 'Shared'),
      requirements: ['Certificate III in Individual Support', 'Police clearance', 'First aid certificate'],
      status: 'Open',
      postedOffsetDays: -66,
    },
  ],
  contract: {
    contractNumber: 'CTR-AU-2026-0105',
    startOffsetDays: -300,
    endOffsetDays: 425,
    durationMonths: 24,
    workingConditions:
      'Rotating roster including weekend penalties. Superannuation at the statutory rate. Salary packaging available for eligible staff.',
    renewalStatus: 'Not Started',
    status: 'Active',
    signedOffsetDays: -318,
    notes: 'High-value destination. Employer covers visa sponsorship; airfare is cost-shared with the worker.',
  },
  feeAmounts: {
    'Processing Fee': 45000,
    'Placement Fee': 62000,
    'Visa Fee': 12000,
    'Medical Fee': 8500,
    'Documentation Fee': 5200,
    Insurance: 14000,
    'Other Fees': 3600,
  },
  feeStatus: { 'Processing Fee': 'Paid', 'Placement Fee': 'Paid', 'Visa Fee': 'Included', Insurance: 'Included' },
  feeBorneBy: { 'Visa Fee': 'Employer', Insurance: 'Employer' },
  completedRequirements: [
    'company-registration',
    'job-order',
    'employment-contract',
    'salary-information',
    'visa-information',
    'business-documents',
    'insurance-documents',
    'employer-identification',
    'manpower-request',
  ],
  reviewRequirements: [],
  documents: [
    { name: 'Employment Contract — Nursing Cohort', type: 'Contract', status: 'Verified', uploadedOffsetDays: -318, expiresOffsetDays: 425, fileSizeKb: 744 },
    { name: 'ASIC Company Extract', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -400, expiresOffsetDays: null, fileSizeKb: 860 },
    { name: 'Job Order JO-2026-105', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -110, expiresOffsetDays: 210, fileSizeKb: 356 },
    { name: 'Sponsorship Approval Letter', type: 'Visa Document', status: 'Verified', uploadedOffsetDays: -104, expiresOffsetDays: 88, fileSizeKb: 420 },
    { name: 'Professional Indemnity Insurance', type: 'Insurance', status: 'Verified', uploadedOffsetDays: -290, expiresOffsetDays: 74, fileSizeKb: 690 },
  ],
  notes: [
    {
      author: 'Angelo Cruz',
      body: 'Highest salary band in the current portfolio. Requirements are fully complete — strong candidate for shortlisting by the client.',
      offsetDays: -5,
      pinned: true,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Sweden — Volvo Group                                                */
/* ------------------------------------------------------------------ */

const volvo: EmployerSeed = {
  id: 'emp-106',
  companyName: 'Volvo Group',
  legalName: 'AB Volvo',
  logoInitials: 'VG',
  logoHue: 225,
  ...PLACEHOLDER,
  country: 'Sweden',
  countryCode: 'SE',
  city: 'Gothenburg',
  address: 'Gropegårdsgatan, 405 08 Gothenburg',
  industry: 'Manufacturing',
  companySize: '1,000+ employees',
  website: 'www.volvogroup.com',
  yearsOperating: 99,
  status: 'Active',
  verification: 'Under Review',
  verificationStage: 3,
  description:
    'Swedish multinational manufacturer of trucks, buses, construction equipment and marine and industrial engines, headquartered in Gothenburg.',
  createdOffsetDays: -210,
  updatedOffsetDays: -4,
  updatedBy: 'Maria Santos',
  currency: 'SEK',
  jobs: [
    {
      position: 'Welder',
      jobCategory: 'Welding & Fabrication',
      workersNeeded: 22,
      workersDeployed: 8,
      salaryMinLocal: 28000,
      salaryMaxLocal: 33000,
      workingHours: '8 hours/day',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Full-time',
      benefits: BEN('Allowance', 'Provided', 'Not Provided', true, true, '25 days', 'Employer Paid'),
      requirements: ['EU-recognised welding certification', 'English proficiency', '3 years experience'],
      status: 'Open',
      postedOffsetDays: -42,
    },
    {
      position: 'Assembly Line Operator',
      jobCategory: 'Production & Assembly',
      workersNeeded: 15,
      workersDeployed: 4,
      salaryMinLocal: 27000,
      salaryMaxLocal: 32000,
      workingHours: 'Shift-based',
      overtime: 'Limited',
      contractDurationMonths: 24,
      employmentType: 'Full-time',
      benefits: BEN('Allowance', 'Provided', 'Not Provided', true, true, '25 days', 'Employer Paid'),
      requirements: ['Technical secondary education', 'English proficiency'],
      status: 'Open',
      postedOffsetDays: -21,
    },
  ],
  contract: {
    contractNumber: 'CTR-SE-2026-0106',
    startOffsetDays: -60,
    endOffsetDays: 670,
    durationMonths: 24,
    workingConditions:
      'Collective agreement applies. 40-hour week, shift supplements, five weeks of paid annual leave. Relocation support for the first three months.',
    renewalStatus: 'Not Started',
    status: 'Under Review',
    signedOffsetDays: null,
    notes: 'Awaiting counter-signature. Fee structure under compliance review before the contract is activated.',
  },
  feeAmounts: {
    'Processing Fee': 39000,
    'Placement Fee': 51000,
    'Visa Fee': 9500,
    'Medical Fee': 7000,
    'Documentation Fee': 4400,
    Insurance: 11500,
    'Other Fees': 2800,
  },
  feeStatus: { 'Processing Fee': 'Pending', 'Placement Fee': 'Pending', Insurance: 'Not Applicable' },
  feeBorneBy: { Insurance: 'Employer' },
  completedRequirements: [
    'company-registration',
    'job-order',
    'employment-contract',
    'salary-information',
    'visa-information',
    'business-documents',
  ],
  reviewRequirements: ['insurance-documents'],
  documents: [
    { name: 'Draft Employment Contract', type: 'Contract', status: 'Pending Review', uploadedOffsetDays: -60, expiresOffsetDays: null, fileSizeKb: 610 },
    { name: 'Bolagsverket Registration Certificate', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -200, expiresOffsetDays: null, fileSizeKb: 900 },
    { name: 'Job Order JO-2026-106', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -42, expiresOffsetDays: 320, fileSizeKb: 274 },
    { name: 'Collective Agreement Extract', type: 'Employer Document', status: 'Pending Review', uploadedOffsetDays: -14, expiresOffsetDays: 700, fileSizeKb: 1180 },
    { name: 'Occupational Health Insurance', type: 'Insurance', status: 'Pending Review', uploadedOffsetDays: -11, expiresOffsetDays: 355, fileSizeKb: 640 },
  ],
  notes: [
    {
      author: 'Maria Santos',
      body: 'Verification moved to the fees stage. Compliance wants the collective agreement clause on overtime translated before approval.',
      offsetDays: -4,
      pinned: true,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Canada — Maple Leaf Foods                                           */
/* ------------------------------------------------------------------ */

const mapleLeaf: EmployerSeed = {
  id: 'emp-107',
  companyName: 'Maple Leaf Foods',
  legalName: 'Maple Leaf Foods Inc.',
  logoInitials: 'ML',
  logoHue: 28,
  ...PLACEHOLDER,
  country: 'Canada',
  countryCode: 'CA',
  city: 'Mississauga',
  address: '6897 Financial Drive, Mississauga, ON L5N 0A8',
  industry: 'Food Processing',
  companySize: '1,000+ employees',
  website: 'www.mapleleaffoods.com',
  yearsOperating: 35,
  status: 'Pending',
  verification: 'Under Review',
  verificationStage: 2,
  description:
    'Canadian food company and one of the country’s largest protein processors, headquartered in Mississauga, Ontario, with production facilities across the country.',
  createdOffsetDays: -80,
  updatedOffsetDays: -1,
  updatedBy: 'Johsua Rivera',
  currency: 'CAD',
  jobs: [
    {
      position: 'Food Processing Worker',
      jobCategory: 'Food Processing',
      workersNeeded: 40,
      workersDeployed: 0,
      salaryMinLocal: 3100,
      salaryMaxLocal: 3700,
      workingHours: '8 hours/day',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Full-time',
      benefits: BEN('Not Provided', 'Not Provided', 'Not Provided', true, true, '10 days', 'Worker Paid'),
      requirements: ['LMIA-approved position', 'English CLB 5', 'Food hygiene certificate'],
      status: 'Open',
      postedOffsetDays: -40,
    },
    {
      position: 'Warehouse Picker',
      jobCategory: 'Warehouse Operations',
      workersNeeded: 15,
      workersDeployed: 0,
      salaryMinLocal: 3000,
      salaryMaxLocal: 3500,
      workingHours: 'Shift-based',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Full-time',
      benefits: BEN('Not Provided', 'Not Provided', 'Not Provided', true, true, '10 days', 'Worker Paid'),
      requirements: ['Forklift / reach truck licence', '2 years warehouse experience'],
      status: 'Open',
      postedOffsetDays: -28,
    },
  ],
  contract: {
    contractNumber: 'CTR-CA-2026-0107',
    startOffsetDays: -30,
    endOffsetDays: 700,
    durationMonths: 24,
    workingConditions:
      'Forty-hour week with overtime after 44 hours. Extended health benefits after three months of continuous employment.',
    renewalStatus: 'Not Started',
    status: 'Under Review',
    signedOffsetDays: null,
    notes: 'New employer. LMIA documentation is still with the immigration consultant.',
  },
  feeAmounts: {
    'Processing Fee': 41000,
    'Placement Fee': 55000,
    'Visa Fee': 10500,
    'Medical Fee': 7800,
    'Documentation Fee': 4600,
    Insurance: 12500,
    'Other Fees': 3200,
  },
  feeStatus: { 'Processing Fee': 'Pending', 'Placement Fee': 'Pending', 'Visa Fee': 'Not Applicable' },
  feeBorneBy: {},
  completedRequirements: ['company-registration', 'job-order', 'employment-contract', 'salary-information'],
  reviewRequirements: ['business-documents', 'visa-information'],
  documents: [
    { name: 'Draft Employment Contract', type: 'Contract', status: 'Pending Review', uploadedOffsetDays: -30, expiresOffsetDays: null, fileSizeKb: 480 },
    { name: 'Federal Incorporation Certificate', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -76, expiresOffsetDays: null, fileSizeKb: 820 },
    { name: 'LMIA Application Receipt', type: 'Visa Document', status: 'Pending Review', uploadedOffsetDays: -26, expiresOffsetDays: null, fileSizeKb: 310 },
    { name: 'Job Order JO-2026-107', type: 'Job Order', status: 'Pending Review', uploadedOffsetDays: -40, expiresOffsetDays: 325, fileSizeKb: 268 },
    { name: 'Provincial Business Licence', type: 'Business Registration', status: 'Rejected', uploadedOffsetDays: -20, expiresOffsetDays: 300, fileSizeKb: 640, notes: 'Scan is illegible — a clear copy was requested.' },
  ],
  notes: [
    {
      author: 'Johsua Rivera',
      body: 'Newly onboarded employer, currently at the documents review stage. Do not shortlist for deployment until the LMIA is confirmed.',
      offsetDays: -1,
      pinned: true,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Germany — Volkswagen Group                                          */
/* ------------------------------------------------------------------ */

const volkswagen: EmployerSeed = {
  id: 'emp-108',
  companyName: 'Volkswagen Group',
  legalName: 'Volkswagen Aktiengesellschaft',
  logoInitials: 'VW',
  logoHue: 250,
  ...PLACEHOLDER,
  country: 'Germany',
  countryCode: 'DE',
  city: 'Wolfsburg',
  address: 'Berliner Ring 2, 38440 Wolfsburg',
  industry: 'Manufacturing',
  companySize: '1,000+ employees',
  website: 'www.volkswagen-group.com',
  yearsOperating: 89,
  status: 'Active',
  verification: 'Requires Revision',
  verificationStage: 2,
  description:
    'German multinational automotive manufacturer headquartered in Wolfsburg. One of the world’s largest vehicle groups, with production plants across Europe and beyond.',
  createdOffsetDays: -300,
  updatedOffsetDays: -1,
  updatedBy: 'Johsua Rivera',
  currency: 'EUR',
  jobs: [
    {
      position: 'Factory Worker',
      jobCategory: 'Production & Assembly',
      workersNeeded: 70,
      workersDeployed: 41,
      salaryMinLocal: 2200,
      salaryMaxLocal: 2700,
      workingHours: '8 hours/day',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Contractual',
      benefits: BEN('Allowance', 'Provided', 'Allowance', true, true, '20 days', 'Employer Paid'),
      requirements: ['German A2 or English B1', 'Technical aptitude', 'Age 21–45'],
      status: 'Open',
      postedOffsetDays: -74,
    },
    {
      position: 'Assembly Line Operator',
      jobCategory: 'Production & Assembly',
      workersNeeded: 35,
      workersDeployed: 20,
      salaryMinLocal: 2100,
      salaryMaxLocal: 2600,
      workingHours: 'Shift-based',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Contractual',
      benefits: BEN('Allowance', 'Provided', 'Allowance', true, true, '20 days', 'Employer Paid'),
      requirements: ['German A2', 'Shift rotation'],
      status: 'Open',
      postedOffsetDays: -60,
    },
    {
      position: 'Heavy Equipment Operator',
      jobCategory: 'Production & Assembly',
      workersNeeded: 12,
      workersDeployed: 6,
      salaryMinLocal: 3000,
      salaryMaxLocal: 3600,
      workingHours: '10 hours/day',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Contractual',
      benefits: BEN('Allowance', 'Provided', 'Allowance', true, true, '20 days', 'Employer Paid'),
      requirements: ['Valid heavy equipment licence', '5 years operator experience'],
      status: 'On Hold',
      postedOffsetDays: -38,
    },
  ],
  contract: {
    contractNumber: 'CTR-DE-2026-0108',
    startOffsetDays: -160,
    endOffsetDays: -12,
    durationMonths: 12,
    workingConditions:
      'Thirty-eight-hour week under the metal industry collective agreement. Shift and night supplements. Site canteen and transport support.',
    renewalStatus: 'Renewal Pending',
    status: 'Expired',
    signedOffsetDays: -174,
    notes: 'Contract lapsed. Operations continued under an extension letter while the renewal is processed.',
  },
  feeAmounts: {
    'Processing Fee': 36000,
    'Placement Fee': 47000,
    'Visa Fee': 8200,
    'Medical Fee': 6200,
    'Documentation Fee': 3900,
    Insurance: 10200,
    'Other Fees': 2200,
  },
  feeStatus: { 'Processing Fee': 'Paid', 'Placement Fee': 'Pending', 'Visa Fee': 'Pending', Insurance: 'Pending' },
  feeBorneBy: { Insurance: 'Employer' },
  completedRequirements: [
    'company-registration',
    'job-order',
    'employment-contract',
    'salary-information',
    'visa-information',
    'business-documents',
  ],
  reviewRequirements: ['insurance-documents', 'employer-identification'],
  documents: [
    { name: 'Employment Contract 2026', type: 'Contract', status: 'Expired', uploadedOffsetDays: -174, expiresOffsetDays: -12, fileSizeKb: 620 },
    { name: 'Handelsregister Extract', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -290, expiresOffsetDays: 78, fileSizeKb: 980 },
    { name: 'Job Order JO-2026-108', type: 'Job Order', status: 'Pending Review', uploadedOffsetDays: -74, expiresOffsetDays: 290, fileSizeKb: 312 },
    { name: 'Workmen Compensation Cover Note', type: 'Insurance', status: 'Rejected', uploadedOffsetDays: -22, expiresOffsetDays: 340, fileSizeKb: 540, notes: 'Coverage amount below the required minimum. Employer to resubmit.' },
    { name: 'Authorised Signatory Letter', type: 'Employer Document', status: 'Pending Review', uploadedOffsetDays: -8, expiresOffsetDays: null, fileSizeKb: 260 },
  ],
  notes: [
    {
      author: 'Johsua Rivera',
      body: 'Verification set to Requires Revision: insurance certificate coverage is under the required threshold and the contract has lapsed. Employer notified.',
      offsetDays: -1,
      pinned: true,
    },
    {
      author: 'Angelo Cruz',
      body: 'Site still operating on an extension letter. Do not deploy additional workers until the renewal is signed.',
      offsetDays: -5,
      pinned: true,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Qatar — Qatar Airways                                               */
/* ------------------------------------------------------------------ */

const qatarAirways: EmployerSeed = {
  id: 'emp-109',
  companyName: 'Qatar Airways',
  legalName: 'Qatar Airways Group Q.C.S.C.',
  logoInitials: 'QA',
  logoHue: 350,
  ...PLACEHOLDER,
  country: 'Qatar',
  countryCode: 'QA',
  city: 'Doha',
  address: 'Qatar Airways Tower 1, Airport Road, Doha',
  industry: 'Hospitality',
  companySize: '1,000+ employees',
  website: 'www.qatarairways.com',
  yearsOperating: 33,
  status: 'Pending',
  verification: 'Pending',
  verificationStage: 0,
  description:
    'State-owned flag carrier of Qatar, headquartered in Doha. Operates an extensive international network and a large ground, catering and cabin-services workforce.',
  createdOffsetDays: -26,
  updatedOffsetDays: -1,
  updatedBy: 'Maria Santos',
  currency: 'QAR',
  jobs: [
    {
      position: 'Hotel Staff',
      jobCategory: 'Hotel & Restaurant Service',
      workersNeeded: 50,
      workersDeployed: 0,
      salaryMinLocal: 1600,
      salaryMaxLocal: 2000,
      workingHours: '10 hours/day',
      overtime: 'Limited',
      contractDurationMonths: 24,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Provided', true, false, '21 days', 'Employer Paid'),
      requirements: ['Basic English', 'Age 21–40', 'Physically fit'],
      status: 'On Hold',
      postedOffsetDays: -18,
    },
    {
      position: 'Cleaner',
      jobCategory: 'Cleaning & Housekeeping',
      workersNeeded: 30,
      workersDeployed: 0,
      salaryMinLocal: 1300,
      salaryMaxLocal: 1700,
      workingHours: '10 hours/day',
      overtime: 'Limited',
      contractDurationMonths: 24,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Provided', true, false, '21 days', 'Employer Paid'),
      requirements: ['Basic English', 'Age 21–40'],
      status: 'On Hold',
      postedOffsetDays: -15,
    },
  ],
  contract: {
    contractNumber: 'CTR-QA-2026-0109',
    startOffsetDays: -10,
    endOffsetDays: 720,
    durationMonths: 24,
    workingConditions:
      'Ten-hour shift with accommodation, transport and meals provided in kind. Overtime limited to the statutory cap.',
    renewalStatus: 'Not Started',
    status: 'Draft',
    signedOffsetDays: null,
    notes: 'Draft only — contract cannot be activated until verification is complete.',
  },
  feeAmounts: {
    'Processing Fee': 22000,
    'Placement Fee': 28000,
    'Visa Fee': 4800,
    'Medical Fee': 4200,
    'Documentation Fee': 2400,
    Insurance: 6800,
    'Other Fees': 1200,
  },
  feeStatus: {
    'Processing Fee': 'Pending',
    'Placement Fee': 'Pending',
    'Visa Fee': 'Pending',
    'Medical Fee': 'Pending',
    'Documentation Fee': 'Pending',
    Insurance: 'Pending',
    'Other Fees': 'Pending',
  },
  feeBorneBy: { 'Visa Fee': 'Employer' },
  completedRequirements: ['company-registration', 'job-order', 'manpower-request'],
  reviewRequirements: [],
  documents: [
    { name: 'Commercial Registration', type: 'Business Registration', status: 'Pending Review', uploadedOffsetDays: -22, expiresOffsetDays: 340, fileSizeKb: 760 },
    { name: 'Draft Employment Contract', type: 'Contract', status: 'Pending Review', uploadedOffsetDays: -10, expiresOffsetDays: null, fileSizeKb: 420 },
    { name: 'Job Order JO-2026-109', type: 'Job Order', status: 'Pending Review', uploadedOffsetDays: -18, expiresOffsetDays: 350, fileSizeKb: 240 },
  ],
  notes: [
    {
      author: 'Maria Santos',
      body: 'New applicant employer at stage 1. Missing employment contract, salary structure, visa guidance and insurance documents. Follow up with the employer contact.',
      offsetDays: -1,
      pinned: true,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* New Zealand — Fonterra                                              */
/* ------------------------------------------------------------------ */

const fonterra: EmployerSeed = {
  id: 'emp-110',
  companyName: 'Fonterra',
  legalName: 'Fonterra Co-operative Group Limited',
  logoInitials: 'FN',
  logoHue: 140,
  ...PLACEHOLDER,
  country: 'New Zealand',
  countryCode: 'NZ',
  city: 'Auckland',
  address: '109 Fanshawe Street, Auckland 1010',
  industry: 'Agriculture',
  companySize: '1,000+ employees',
  website: 'www.fonterra.com',
  yearsOperating: 25,
  status: 'Inactive',
  verification: 'On Hold',
  verificationStage: 2,
  description:
    'New Zealand dairy co-operative headquartered in Auckland, owned by thousands of farming families and one of the world’s largest dairy exporters.',
  createdOffsetDays: -530,
  updatedOffsetDays: -26,
  updatedBy: 'Johsua Rivera',
  currency: 'NZD',
  jobs: [
    {
      position: 'Agricultural Worker',
      jobCategory: 'Agriculture & Farming',
      workersNeeded: 45,
      workersDeployed: 45,
      salaryMinLocal: 4400,
      salaryMaxLocal: 5300,
      workingHours: '8 hours/day',
      overtime: 'Available',
      contractDurationMonths: 12,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Not Provided', true, true, '10 days', 'Shared'),
      requirements: ['RSE scheme eligibility', 'Physically fit', 'Basic English'],
      status: 'On Hold',
      postedOffsetDays: -140,
    },
  ],
  contract: {
    contractNumber: 'CTR-NZ-2026-0110',
    startOffsetDays: -410,
    endOffsetDays: -45,
    durationMonths: 12,
    workingConditions:
      'Seasonal roster of at least 30 hours per week, with peak-season overtime. On-farm accommodation provided at a subsidised rate.',
    renewalStatus: 'Not Renewable',
    status: 'Expired',
    signedOffsetDays: -425,
    notes: 'Contract expired and employer accreditation is on hold. No further deployment authorised.',
  },
  feeAmounts: {
    'Processing Fee': 30000,
    'Placement Fee': 38000,
    'Visa Fee': 6800,
    'Medical Fee': 5500,
    'Documentation Fee': 3400,
    Insurance: 9200,
    'Other Fees': 2600,
  },
  feeStatus: {
    'Processing Fee': 'Paid',
    'Placement Fee': 'Paid',
    'Visa Fee': 'Paid',
    'Medical Fee': 'Paid',
    'Documentation Fee': 'Paid',
    Insurance: 'Paid',
    'Other Fees': 'Waived',
  },
  feeBorneBy: {},
  completedRequirements: [
    'company-registration',
    'job-order',
    'employment-contract',
    'salary-information',
    'business-documents',
  ],
  reviewRequirements: ['visa-information', 'insurance-documents'],
  documents: [
    { name: 'Employment Contract 2026 Seasonal', type: 'Contract', status: 'Expired', uploadedOffsetDays: -425, expiresOffsetDays: -45, fileSizeKb: 560 },
    { name: 'NZ Companies Office Extract', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -525, expiresOffsetDays: null, fileSizeKb: 870 },
    { name: 'Employer Accreditation Certificate', type: 'Employer Document', status: 'Expired', uploadedOffsetDays: -500, expiresOffsetDays: -30, fileSizeKb: 640, notes: 'Accreditation suspended pending the compliance review.' },
    { name: 'RSE Agreement Copy', type: 'Visa Document', status: 'Rejected', uploadedOffsetDays: -130, expiresOffsetDays: null, fileSizeKb: 380, notes: 'Submitted version predates the current scheme rules.' },
    { name: 'Seasonal Insurance Schedule', type: 'Insurance', status: 'Expired', uploadedOffsetDays: -400, expiresOffsetDays: -50, fileSizeKb: 520 },
  ],
  notes: [
    {
      author: 'Johsua Rivera',
      body: 'Employer accreditation is on hold following an immigration compliance review. Keep inactive and exclude from shortlists until the outcome is known.',
      offsetDays: -26,
      pinned: true,
    },
    {
      author: 'Angelo Cruz',
      body: 'Two deployed workers were repatriated at the end of the season. No outstanding claims against the agency.',
      offsetDays: -40,
      pinned: false,
    },
  ],
};

export const EMPLOYER_SEEDS: EmployerSeed[] = [
  toyota,
  samsungHeavy,
  emiratesGroup,
  keppel,
  ramsay,
  volvo,
  mapleLeaf,
  volkswagen,
  qatarAirways,
  fonterra,
];

/** Standard notes applied to each fee line so the ledger reads consistently. */
export const FEE_NOTES: Record<FeeType, string> = {
  'Processing Fee':
    'Document processing, coordination and liaison with the sending-country authority.',
  'Placement Fee':
    'Agency placement service covering sourcing, screening and pre-departure orientation.',
  'Visa Fee': 'Embassy or immigration authority charge for the work visa application.',
  'Medical Fee': 'Accredited clinic pre-employment medical examination and certificate.',
  'Documentation Fee':
    'Authentication, translation and courier of supporting documents.',
  Insurance: 'Group accident and health insurance for the duration of the deployment.',
  'Other Fees': 'Incidental costs such as training materials and airport transfer.',
};

/** Typical payment milestones relative to today, keyed by fee type. */
export const FEE_DUE_OFFSETS: Record<FeeType, number> = {
  'Processing Fee': -20,
  'Placement Fee': 25,
  'Visa Fee': 15,
  'Medical Fee': 10,
  'Documentation Fee': 30,
  Insurance: 20,
  'Other Fees': 35,
};
