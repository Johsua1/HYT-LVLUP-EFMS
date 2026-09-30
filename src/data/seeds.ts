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
 * ⚠️ EVERY EMPLOYER IN THIS FILE IS FICTIONAL. Company names, registration
 * numbers, contacts, addresses and fee structures were invented for this
 * prototype and do not refer to any real organisation. Salary bands and fee
 * ranges are modelled on publicly known market ranges so the filtering logic
 * can be exercised with believable numbers.
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

/* ------------------------------------------------------------------ */
/* Japan                                                               */
/* ------------------------------------------------------------------ */

const sakura: EmployerSeed = {
  id: 'emp-001',
  companyName: 'Sakura Manufacturing Group',
  legalName: 'Sakura Manufacturing Group K.K.',
  logoInitials: 'SM',
  logoHue: 342,
  registrationNumber: 'JP-OSA-2011-004821',
  country: 'Japan',
  countryCode: 'JP',
  city: 'Osaka',
  address: '3-14 Nishihama, Suminoe-ku, Osaka 559-0034',
  industry: 'Manufacturing',
  companySize: '1,000+ employees',
  website: 'www.sakura-mfg.example.jp',
  contactPerson: 'Kenji Nakamura',
  contactRole: 'International Recruitment Manager',
  email: 'k.nakamura@sakura-mfg.example.jp',
  phone: '+81 6-6555-0142',
  yearsOperating: 15,
  status: 'Active',
  verification: 'Verified',
  verificationStage: 4,
  description:
    'Precision components manufacturer supplying the automotive sector. Runs a structured Technical Intern Training Programme with in-house Japanese language instruction and dormitory facilities.',
  createdOffsetDays: -612,
  updatedOffsetDays: -3,
  updatedBy: 'Johsua Rivera',
  currency: 'JPY',
  jobs: [
    {
      position: 'Factory Worker',
      jobCategory: 'Production & Assembly',
      workersNeeded: 45,
      workersDeployed: 31,
      salaryMinLocal: 180000,
      salaryMaxLocal: 220000,
      workingHours: '8 hours/day',
      overtime: 'Available',
      contractDurationMonths: 36,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Allowance', true, true, '14 days', 'Employer Paid'),
      requirements: ['JLPT N4 or above', 'Age 20–35', 'Physically fit', 'No tattoo visible'],
      status: 'Open',
      postedOffsetDays: -96,
    },
    {
      position: 'Assembly Line Operator',
      jobCategory: 'Production & Assembly',
      workersNeeded: 20,
      workersDeployed: 12,
      salaryMinLocal: 175000,
      salaryMaxLocal: 205000,
      workingHours: 'Shift-based',
      overtime: 'Available',
      contractDurationMonths: 36,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Allowance', true, true, '14 days', 'Employer Paid'),
      requirements: ['JLPT N4 or above', 'Shift work tolerance'],
      status: 'Open',
      postedOffsetDays: -47,
    },
    {
      position: 'Mechanical Technician',
      jobCategory: 'Engineering & Technical',
      workersNeeded: 8,
      workersDeployed: 8,
      salaryMinLocal: 240000,
      salaryMaxLocal: 290000,
      workingHours: '8 hours/day',
      overtime: 'Limited',
      contractDurationMonths: 60,
      employmentType: 'Full-time',
      benefits: BEN('Allowance', 'Provided', 'Provided', true, true, '20 days', 'Employer Paid'),
      requirements: ['BS Mechanical Engineering', 'JLPT N3', '3 years experience'],
      status: 'Filled',
      postedOffsetDays: -210,
    },
  ],
  contract: {
    contractNumber: 'CTR-JP-2024-0118',
    startOffsetDays: -430,
    endOffsetDays: 288,
    durationMonths: 36,
    workingConditions:
      'Standard 8-hour shift, 5 days per week. Overtime paid at 125% of base rate. Dormitory provided within 20 minutes of the plant.',
    renewalStatus: 'Not Started',
    status: 'Active',
    signedOffsetDays: -445,
    notes: 'Batch 4 deployment completed. Remaining headcount scheduled for next intake cycle.',
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
    { name: 'Employment Contract 2024 Batch', type: 'Contract', status: 'Verified', uploadedOffsetDays: -440, expiresOffsetDays: 288, fileSizeKb: 812 },
    { name: 'Certificate of Incorporation', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -600, expiresOffsetDays: null, fileSizeKb: 1240 },
    { name: 'Job Order JO-2026-014', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -96, expiresOffsetDays: 174, fileSizeKb: 356 },
    { name: 'Workmen Compensation Policy', type: 'Insurance', status: 'Verified', uploadedOffsetDays: -388, expiresOffsetDays: 42, fileSizeKb: 940 },
    { name: 'Dormitory Inspection Report', type: 'Employer Document', status: 'Verified', uploadedOffsetDays: -300, expiresOffsetDays: 65, fileSizeKb: 2210 },
    { name: 'Certificate of Employment — Representative', type: 'Employer Document', status: 'Pending Review', uploadedOffsetDays: -6, expiresOffsetDays: null, fileSizeKb: 410 },
  ],
  notes: [
    {
      author: 'Johsua Rivera',
      body: 'Employer confirmed a 2.5% base salary adjustment effective next intake. Updated salary band in the job order.',
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

const tokyoIndustrial: EmployerSeed = {
  id: 'emp-002',
  companyName: 'Tokyo Industrial Solutions',
  legalName: 'Tokyo Industrial Solutions Co., Ltd.',
  logoInitials: 'TI',
  logoHue: 212,
  registrationNumber: 'JP-TKY-2016-119034',
  country: 'Japan',
  countryCode: 'JP',
  city: 'Nagoya',
  address: '7-2 Meieki Minami, Nakamura-ku, Nagoya 450-0003',
  industry: 'Manufacturing',
  companySize: '501–1,000 employees',
  website: 'www.tokyo-industrial.example.jp',
  contactPerson: 'Aiko Tanaka',
  contactRole: 'HR Operations Lead',
  email: 'a.tanaka@tokyo-industrial.example.jp',
  phone: '+81 52-451-7788',
  yearsOperating: 9,
  status: 'Active',
  verification: 'Verified',
  verificationStage: 4,
  description:
    'Industrial tooling and metal fabrication supplier. Operates two plants in the Aichi prefecture and hires skilled welders and machine operators through accredited sending organisations.',
  createdOffsetDays: -410,
  updatedOffsetDays: -11,
  updatedBy: 'Maria Santos',
  currency: 'JPY',
  jobs: [
    {
      position: 'Welder',
      jobCategory: 'Welding & Fabrication',
      workersNeeded: 30,
      workersDeployed: 18,
      salaryMinLocal: 195000,
      salaryMaxLocal: 245000,
      workingHours: '8 hours/day',
      overtime: 'Available',
      contractDurationMonths: 36,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Not Provided', true, true, '10 days', 'Employer Paid'),
      requirements: ['SMAW / GTAW certification', 'JLPT N5 minimum', '2 years fabrication experience'],
      status: 'Open',
      postedOffsetDays: -68,
    },
    {
      position: 'Factory Worker',
      jobCategory: 'Production & Assembly',
      workersNeeded: 25,
      workersDeployed: 25,
      salaryMinLocal: 170000,
      salaryMaxLocal: 200000,
      workingHours: 'Shift-based',
      overtime: 'Available',
      contractDurationMonths: 36,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Not Provided', true, true, '10 days', 'Employer Paid'),
      requirements: ['JLPT N5 minimum', 'Physically fit'],
      status: 'Filled',
      postedOffsetDays: -180,
    },
  ],
  contract: {
    contractNumber: 'CTR-JP-2024-0207',
    startOffsetDays: -365,
    endOffsetDays: 22,
    durationMonths: 12,
    workingConditions:
      'Two-shift rotation with 45-minute paid break. Protective equipment supplied. Overtime capped at 40 hours per month per labour agreement.',
    renewalStatus: 'Renewal Pending',
    status: 'Expiring Soon',
    signedOffsetDays: -380,
    notes: 'Renewal package submitted by the employer. Pending counter-signature from the labour office.',
  },
  feeAmounts: {
    'Processing Fee': 38000,
    'Placement Fee': 52000,
    'Visa Fee': 8500,
    'Medical Fee': 6500,
    'Documentation Fee': 3800,
    Insurance: 11000,
    'Other Fees': 2500,
  },
  feeStatus: { 'Processing Fee': 'Paid', 'Placement Fee': 'Paid', 'Visa Fee': 'Paid', Insurance: 'Included' },
  feeBorneBy: { Insurance: 'Employer' },
  completedRequirements: [
    'company-registration',
    'job-order',
    'employment-contract',
    'salary-information',
    'visa-information',
    'business-documents',
    'employer-identification',
  ],
  reviewRequirements: ['insurance-documents'],
  documents: [
    { name: 'Employment Contract 2025', type: 'Contract', status: 'Verified', uploadedOffsetDays: -380, expiresOffsetDays: 22, fileSizeKb: 690 },
    { name: 'Business Registration Extract', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -405, expiresOffsetDays: null, fileSizeKb: 1010 },
    { name: 'Job Order JO-2026-021', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -68, expiresOffsetDays: 112, fileSizeKb: 298 },
    { name: 'Insurance Policy Renewal', type: 'Insurance', status: 'Pending Review', uploadedOffsetDays: -9, expiresOffsetDays: 365, fileSizeKb: 780 },
    { name: 'Plant Safety Audit', type: 'Employer Document', status: 'Expired', uploadedOffsetDays: -420, expiresOffsetDays: -20, fileSizeKb: 1650, notes: 'Superseded by the new audit — replacement requested.' },
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
/* South Korea                                                         */
/* ------------------------------------------------------------------ */

const seoulWorkforce: EmployerSeed = {
  id: 'emp-003',
  companyName: 'Seoul Workforce Corporation',
  legalName: 'Seoul Workforce Corporation Ltd.',
  logoInitials: 'SW',
  logoHue: 258,
  registrationNumber: 'KR-BUS-2014-771209',
  country: 'South Korea',
  countryCode: 'KR',
  city: 'Busan',
  address: '48 Chungjang-daero, Dong-gu, Busan 48751',
  industry: 'Marine & Shipbuilding',
  companySize: '1,000+ employees',
  website: 'www.seoul-workforce.example.kr',
  contactPerson: 'Min-jun Park',
  contactRole: 'Foreign Workforce Coordinator',
  email: 'mj.park@seoul-workforce.example.kr',
  phone: '+82 51-462-3300',
  yearsOperating: 12,
  status: 'Active',
  verification: 'Verified',
  verificationStage: 4,
  description:
    'Shipbuilding and heavy industry manpower partner operating under the Employment Permit System. Supplies certified shipfitters, welders and marine pipefitters to yards in the Busan and Ulsan corridor.',
  createdOffsetDays: -530,
  updatedOffsetDays: -6,
  updatedBy: 'Johsua Rivera',
  currency: 'KRW',
  jobs: [
    {
      position: 'Shipfitter',
      jobCategory: 'Shipbuilding',
      workersNeeded: 60,
      workersDeployed: 44,
      salaryMinLocal: 2100000,
      salaryMaxLocal: 2650000,
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
      salaryMinLocal: 2250000,
      salaryMaxLocal: 2800000,
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
    contractNumber: 'CTR-KR-2025-0031',
    startOffsetDays: -210,
    endOffsetDays: 118,
    durationMonths: 36,
    workingConditions:
      'Eight-hour day shift with paid overtime. Dormitory and three meals provided on site. Severance pay accrues under the Labour Standards Act.',
    renewalStatus: 'Not Started',
    status: 'Active',
    signedOffsetDays: -224,
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
    { name: 'Employment Contract EPS Batch 7', type: 'Contract', status: 'Verified', uploadedOffsetDays: -224, expiresOffsetDays: 118, fileSizeKb: 730 },
    { name: 'Corporate Registry Certificate', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -520, expiresOffsetDays: null, fileSizeKb: 1120 },
    { name: 'Job Order JO-2026-007', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -120, expiresOffsetDays: 245, fileSizeKb: 402 },
    { name: 'E-9 Visa Guidance Sheet', type: 'Visa Document', status: 'Verified', uploadedOffsetDays: -110, expiresOffsetDays: null, fileSizeKb: 288 },
    { name: 'Group Accident Insurance', type: 'Insurance', status: 'Verified', uploadedOffsetDays: -200, expiresOffsetDays: 165, fileSizeKb: 860 },
  ],
  notes: [
    {
      author: 'Johsua Rivera',
      body: 'Employer is a reliable repeat client — three consecutive batches with zero placement disputes. Good candidate for the preferred-employer shortlist.',
      offsetDays: -6,
      pinned: true,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* United Arab Emirates                                                */
/* ------------------------------------------------------------------ */

const emiratesHospitality: EmployerSeed = {
  id: 'emp-004',
  companyName: 'Emirates Hospitality Group',
  legalName: 'Emirates Hospitality Group LLC',
  logoInitials: 'EH',
  logoHue: 32,
  registrationNumber: 'AE-DXB-2013-556210',
  country: 'United Arab Emirates',
  countryCode: 'AE',
  city: 'Dubai',
  address: 'Sheikh Zayed Road, Business Bay, Dubai 12845',
  industry: 'Hospitality',
  companySize: '1,000+ employees',
  website: 'www.emirates-hospitality.example.ae',
  contactPerson: 'Rashid Al Mansoori',
  contactRole: 'Group Talent Acquisition Director',
  email: 'r.almansoori@emirates-hospitality.example.ae',
  phone: '+971 4-338-9900',
  yearsOperating: 13,
  status: 'Active',
  verification: 'Verified',
  verificationStage: 4,
  description:
    'Hotel and resort operator managing eleven properties across the Emirates. Recruits front-office, housekeeping and food & beverage staff under standard UAE employment contracts.',
  createdOffsetDays: -470,
  updatedOffsetDays: -2,
  updatedBy: 'Angelo Cruz',
  currency: 'AED',
  jobs: [
    {
      position: 'Hotel Staff',
      jobCategory: 'Hotel & Restaurant Service',
      workersNeeded: 55,
      workersDeployed: 38,
      salaryMinLocal: 1500,
      salaryMaxLocal: 2100,
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
      salaryMaxLocal: 1500,
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
    contractNumber: 'CTR-AE-2025-0064',
    startOffsetDays: -180,
    endOffsetDays: 545,
    durationMonths: 24,
    workingConditions:
      'Nine-hour shift inclusive of a one-hour break. Shared accommodation, transport and duty meals provided. Gratuity payable on completion of service.',
    renewalStatus: 'Not Started',
    status: 'Active',
    signedOffsetDays: -192,
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
    { name: 'Standard Employment Contract', type: 'Contract', status: 'Verified', uploadedOffsetDays: -192, expiresOffsetDays: 545, fileSizeKb: 655 },
    { name: 'Trade Licence', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -460, expiresOffsetDays: 96, fileSizeKb: 890 },
    { name: 'Job Order JO-2026-018', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -85, expiresOffsetDays: 280, fileSizeKb: 344 },
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

const gulfConstruction: EmployerSeed = {
  id: 'emp-005',
  companyName: 'Gulf Construction Services',
  legalName: 'Gulf Construction Services W.L.L.',
  logoInitials: 'GC',
  logoHue: 14,
  registrationNumber: 'AE-AUH-2018-330176',
  country: 'United Arab Emirates',
  countryCode: 'AE',
  city: 'Abu Dhabi',
  address: 'Plot 22, Mussafah Industrial Area, Abu Dhabi 44012',
  industry: 'Construction',
  companySize: '501–1,000 employees',
  website: 'www.gulf-construction.example.ae',
  contactPerson: 'Faisal Al Zaabi',
  contactRole: 'Projects Manpower Manager',
  email: 'f.alzaabi@gulf-construction.example.ae',
  phone: '+971 2-551-4400',
  yearsOperating: 8,
  status: 'Active',
  verification: 'Requires Revision',
  verificationStage: 2,
  description:
    'Infrastructure and building contractor delivering civil works across the western region. Recruits steel fixers, scaffolders and heavy equipment operators on project-based contracts.',
  createdOffsetDays: -290,
  updatedOffsetDays: -1,
  updatedBy: 'Johsua Rivera',
  currency: 'AED',
  jobs: [
    {
      position: 'Steel Fixer',
      jobCategory: 'Construction Trades',
      workersNeeded: 70,
      workersDeployed: 41,
      salaryMinLocal: 1350,
      salaryMaxLocal: 1800,
      workingHours: '10 hours/day',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Project-based',
      benefits: BEN('Provided', 'Provided', 'Allowance', true, true, '21 days', 'Employer Paid'),
      requirements: ['Rebar installation experience', 'Age 25–45', 'Medical fitness certificate'],
      status: 'Open',
      postedOffsetDays: -74,
    },
    {
      position: 'Scaffolder',
      jobCategory: 'Construction Trades',
      workersNeeded: 35,
      workersDeployed: 20,
      salaryMinLocal: 1400,
      salaryMaxLocal: 1850,
      workingHours: '10 hours/day',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Project-based',
      benefits: BEN('Provided', 'Provided', 'Allowance', true, true, '21 days', 'Employer Paid'),
      requirements: ['Scaffolding certification', 'Working at height clearance'],
      status: 'Open',
      postedOffsetDays: -60,
    },
    {
      position: 'Heavy Equipment Operator',
      jobCategory: 'Construction Trades',
      workersNeeded: 12,
      workersDeployed: 6,
      salaryMinLocal: 2200,
      salaryMaxLocal: 2900,
      workingHours: '10 hours/day',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Project-based',
      benefits: BEN('Provided', 'Provided', 'Allowance', true, true, '21 days', 'Employer Paid'),
      requirements: ['Valid heavy equipment licence', '5 years operator experience'],
      status: 'On Hold',
      postedOffsetDays: -38,
    },
  ],
  contract: {
    contractNumber: 'CTR-AE-2025-0092',
    startOffsetDays: -150,
    endOffsetDays: -12,
    durationMonths: 12,
    workingConditions:
      'Ten-hour site shift, six days per week with overtime beyond eight hours. Site accommodation and transport provided. Heat-stress protocol observed June–September.',
    renewalStatus: 'Renewal Pending',
    status: 'Expired',
    signedOffsetDays: -164,
    notes: 'Contract lapsed. Operations continued under an extension letter while the renewal is processed.',
  },
  feeAmounts: {
    'Processing Fee': 28000,
    'Placement Fee': 36000,
    'Visa Fee': 5800,
    'Medical Fee': 5000,
    'Documentation Fee': 3000,
    Insurance: 8200,
    'Other Fees': 4200,
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
    { name: 'Employment Contract 2025', type: 'Contract', status: 'Expired', uploadedOffsetDays: -164, expiresOffsetDays: -12, fileSizeKb: 620 },
    { name: 'Commercial Registration', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -280, expiresOffsetDays: 78, fileSizeKb: 980 },
    { name: 'Job Order JO-2026-025', type: 'Job Order', status: 'Pending Review', uploadedOffsetDays: -74, expiresOffsetDays: 290, fileSizeKb: 312 },
    { name: 'Workmen Compensation Cover Note', type: 'Insurance', status: 'Rejected', uploadedOffsetDays: -22, expiresOffsetDays: 340, fileSizeKb: 540, notes: 'Coverage amount below the required minimum. Employer to resubmit.' },
    { name: 'Authorised Signatory Letter', type: 'Employer Document', status: 'Pending Review', uploadedOffsetDays: -8, expiresOffsetDays: null, fileSizeKb: 260 },
  ],
  notes: [
    {
      author: 'Johsua Rivera',
      body: 'Verification set to Requires Revision: insurance certificate coverage is under the required threshold and the contract has lapsed. Employer notified on the 28th.',
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
/* Singapore                                                           */
/* ------------------------------------------------------------------ */

const singaporeEngineering: EmployerSeed = {
  id: 'emp-006',
  companyName: 'Singapore Engineering Solutions',
  legalName: 'Singapore Engineering Solutions Pte. Ltd.',
  logoInitials: 'SE',
  logoHue: 190,
  registrationNumber: 'SG-2019-33812K',
  country: 'Singapore',
  countryCode: 'SG',
  city: 'Singapore',
  address: '18 Tuas Avenue 8, Singapore 639239',
  industry: 'Engineering',
  companySize: '201–500 employees',
  website: 'www.sg-engineering.example.sg',
  contactPerson: 'Wei Ling Chua',
  contactRole: 'Human Resources Manager',
  email: 'wl.chua@sg-engineering.example.sg',
  phone: '+65 6861-2200',
  yearsOperating: 7,
  status: 'Active',
  verification: 'Verified',
  verificationStage: 4,
  description:
    'Precision engineering and automation integrator serving the semiconductor and pharmaceutical sectors. Hires under the Work Permit scheme with structured skills upgrading.',
  createdOffsetDays: -330,
  updatedOffsetDays: -8,
  updatedBy: 'Maria Santos',
  currency: 'SGD',
  jobs: [
    {
      position: 'Mechanical Technician',
      jobCategory: 'Engineering & Technical',
      workersNeeded: 18,
      workersDeployed: 11,
      salaryMinLocal: 1150,
      salaryMaxLocal: 1450,
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
      position: 'Assembly Line Operator',
      jobCategory: 'Production & Assembly',
      workersNeeded: 22,
      workersDeployed: 9,
      salaryMinLocal: 1050,
      salaryMaxLocal: 1300,
      workingHours: 'Shift-based',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Contractual',
      benefits: BEN('Allowance', 'Allowance', 'Not Provided', true, true, '14 days', 'Employer Paid'),
      requirements: ['Cleanroom experience preferred', 'Shift rotation'],
      status: 'Open',
      postedOffsetDays: -30,
    },
  ],
  contract: {
    contractNumber: 'CTR-SG-2025-0044',
    startOffsetDays: -240,
    endOffsetDays: 96,
    durationMonths: 24,
    workingConditions:
      'Eight-hour shift with a 45-minute break. Housing allowance of S$300 per month. Overtime paid at 1.5× the hourly basic rate.',
    renewalStatus: 'Not Started',
    status: 'Active',
    signedOffsetDays: -252,
    notes: 'Cleanroom expansion planned for the next financial year — anticipate higher headcount requests.',
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
    { name: 'Employment Contract 2025', type: 'Contract', status: 'Verified', uploadedOffsetDays: -252, expiresOffsetDays: 96, fileSizeKb: 588 },
    { name: 'ACRA Business Profile', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -325, expiresOffsetDays: null, fileSizeKb: 760 },
    { name: 'Job Order JO-2026-030', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -52, expiresOffsetDays: 310, fileSizeKb: 286 },
    { name: 'Work Permit In-Principle Approval', type: 'Visa Document', status: 'Verified', uploadedOffsetDays: -48, expiresOffsetDays: 140, fileSizeKb: 330 },
    { name: 'Medical Insurance Policy', type: 'Insurance', status: 'Verified', uploadedOffsetDays: -230, expiresOffsetDays: 132, fileSizeKb: 812 },
  ],
  notes: [
    {
      author: 'Maria Santos',
      body: 'Placement fee invoice for the current batch is still outstanding — finance flagged it as 30 days past due.',
      offsetDays: -8,
      pinned: false,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Australia                                                           */
/* ------------------------------------------------------------------ */

const pacificHealthcare: EmployerSeed = {
  id: 'emp-007',
  companyName: 'Pacific Healthcare Group',
  legalName: 'Pacific Healthcare Group Pty Ltd',
  logoInitials: 'PH',
  logoHue: 158,
  registrationNumber: 'AU-VIC-2015-662108',
  country: 'Australia',
  countryCode: 'AU',
  city: 'Melbourne',
  address: 'Level 9, 480 St Kilda Road, Melbourne VIC 3004',
  industry: 'Healthcare',
  companySize: '1,000+ employees',
  website: 'www.pacific-healthcare.example.au',
  contactPerson: 'Rebecca Hollis',
  contactRole: 'Workforce Partnerships Manager',
  email: 'r.hollis@pacific-healthcare.example.au',
  phone: '+61 3-9021-4400',
  yearsOperating: 11,
  status: 'Active',
  verification: 'Verified',
  verificationStage: 4,
  description:
    'Aged-care and community health provider operating residential facilities across Victoria. Sponsors overseas nurses and care workers under the skilled migration programme.',
  createdOffsetDays: -395,
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
      salaryMaxLocal: 4800,
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
      salaryMaxLocal: 3700,
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
    contractNumber: 'CTR-AU-2025-0077',
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
    { name: 'ASIC Company Extract', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -390, expiresOffsetDays: null, fileSizeKb: 860 },
    { name: 'Job Order JO-2026-011', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -110, expiresOffsetDays: 210, fileSizeKb: 356 },
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
/* Sweden                                                              */
/* ------------------------------------------------------------------ */

const nordicManufacturing: EmployerSeed = {
  id: 'emp-008',
  companyName: 'Nordic Manufacturing AB',
  legalName: 'Nordic Manufacturing Aktiebolag',
  logoInitials: 'NM',
  logoHue: 224,
  registrationNumber: 'SE-GOT-2012-556789',
  country: 'Sweden',
  countryCode: 'SE',
  city: 'Gothenburg',
  address: 'Industrivägen 24, 418 78 Göteborg',
  industry: 'Manufacturing',
  companySize: '501–1,000 employees',
  website: 'www.nordic-mfg.example.se',
  contactPerson: 'Erik Lindqvist',
  contactRole: 'Head of Talent Acquisition',
  email: 'e.lindqvist@nordic-mfg.example.se',
  phone: '+46 31-708-2200',
  yearsOperating: 14,
  status: 'Active',
  verification: 'Under Review',
  verificationStage: 3,
  description:
    'Heavy vehicle component manufacturer with a collective agreement covering all production staff. Recruits certified welders and CNC operators through the EU work permit route.',
  createdOffsetDays: -200,
  updatedOffsetDays: -4,
  updatedBy: 'Maria Santos',
  currency: 'SEK',
  jobs: [
    {
      position: 'Welder',
      jobCategory: 'Welding & Fabrication',
      workersNeeded: 22,
      workersDeployed: 8,
      salaryMinLocal: 26500,
      salaryMaxLocal: 31000,
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
      salaryMinLocal: 24500,
      salaryMaxLocal: 28500,
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
    contractNumber: 'CTR-SE-2026-0009',
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
    { name: 'Bolagsverket Registration Certificate', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -195, expiresOffsetDays: null, fileSizeKb: 900 },
    { name: 'Job Order JO-2026-033', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -42, expiresOffsetDays: 320, fileSizeKb: 274 },
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
/* Canada                                                              */
/* ------------------------------------------------------------------ */

const canadianLogistics: EmployerSeed = {
  id: 'emp-009',
  companyName: 'Canadian Logistics Corporation',
  legalName: 'Canadian Logistics Corporation Inc.',
  logoInitials: 'CL',
  logoHue: 356,
  registrationNumber: 'CA-BC-2017-991204',
  country: 'Canada',
  countryCode: 'CA',
  city: 'Vancouver',
  address: '8800 River Road, Delta, BC V4G 1B5',
  industry: 'Logistics & Warehousing',
  companySize: '201–500 employees',
  website: 'www.canadian-logistics.example.ca',
  contactPerson: 'Daniel Okafor',
  contactRole: 'Recruitment Operations Lead',
  email: 'd.okafor@canadian-logistics.example.ca',
  phone: '+1 604-522-8800',
  yearsOperating: 10,
  status: 'Pending',
  verification: 'Under Review',
  verificationStage: 2,
  description:
    'Third-party logistics provider operating distribution centres in British Columbia and Alberta. Recruits warehouse pickers and forklift operators under the Temporary Foreign Worker Programme.',
  createdOffsetDays: -75,
  updatedOffsetDays: -1,
  updatedBy: 'Johsua Rivera',
  currency: 'CAD',
  jobs: [
    {
      position: 'Warehouse Picker',
      jobCategory: 'Warehouse Operations',
      workersNeeded: 40,
      workersDeployed: 0,
      salaryMinLocal: 3050,
      salaryMaxLocal: 3600,
      workingHours: '8 hours/day',
      overtime: 'Available',
      contractDurationMonths: 24,
      employmentType: 'Full-time',
      benefits: BEN('Not Provided', 'Not Provided', 'Not Provided', true, true, '10 days', 'Worker Paid'),
      requirements: ['LMIA-approved position', 'English CLB 5', 'Physically fit'],
      status: 'Open',
      postedOffsetDays: -40,
    },
    {
      position: 'Heavy Equipment Operator',
      jobCategory: 'Warehouse Operations',
      workersNeeded: 10,
      workersDeployed: 0,
      salaryMinLocal: 3800,
      salaryMaxLocal: 4500,
      workingHours: '8 hours/day',
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
    contractNumber: 'CTR-CA-2026-0003',
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
    { name: 'Federal Incorporation Certificate', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -72, expiresOffsetDays: null, fileSizeKb: 820 },
    { name: 'LMIA Application Receipt', type: 'Visa Document', status: 'Pending Review', uploadedOffsetDays: -26, expiresOffsetDays: null, fileSizeKb: 310 },
    { name: 'Job Order JO-2026-036', type: 'Job Order', status: 'Pending Review', uploadedOffsetDays: -40, expiresOffsetDays: 325, fileSizeKb: 268 },
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
/* Germany                                                             */
/* ------------------------------------------------------------------ */

const europeanFood: EmployerSeed = {
  id: 'emp-010',
  companyName: 'European Food Services GmbH',
  legalName: 'European Food Services Gesellschaft mit beschränkter Haftung',
  logoInitials: 'EF',
  logoHue: 96,
  registrationNumber: 'DE-HAM-2016-447190',
  country: 'Germany',
  countryCode: 'DE',
  city: 'Hamburg',
  address: 'Industriestraße 118, 21107 Hamburg',
  industry: 'Food Processing',
  companySize: '201–500 employees',
  website: 'www.european-food.example.de',
  contactPerson: 'Sabine Krüger',
  contactRole: 'Personalleiterin',
  email: 's.krueger@european-food.example.de',
  phone: '+49 40-7788-2100',
  yearsOperating: 9,
  status: 'Active',
  verification: 'Verified',
  verificationStage: 4,
  description:
    'Industrial food processing and packaging company supplying European retail chains. Hires food processing workers and machine operators under the EU Blue Card and work permit routes.',
  createdOffsetDays: -280,
  updatedOffsetDays: -14,
  updatedBy: 'Angelo Cruz',
  currency: 'EUR',
  jobs: [
    {
      position: 'Food Processing Worker',
      jobCategory: 'Food Processing',
      workersNeeded: 35,
      workersDeployed: 21,
      salaryMinLocal: 2100,
      salaryMaxLocal: 2550,
      workingHours: '8 hours/day',
      overtime: 'Limited',
      contractDurationMonths: 24,
      employmentType: 'Full-time',
      benefits: BEN('Allowance', 'Provided', 'Allowance', true, true, '20 days', 'Employer Paid'),
      requirements: ['German A2 or English B1', 'Food hygiene certificate', 'Age 21–45'],
      status: 'Open',
      postedOffsetDays: -58,
    },
    {
      position: 'Assembly Line Operator',
      jobCategory: 'Production & Assembly',
      workersNeeded: 18,
      workersDeployed: 12,
      salaryMinLocal: 2050,
      salaryMaxLocal: 2450,
      workingHours: 'Shift-based',
      overtime: 'Limited',
      contractDurationMonths: 24,
      employmentType: 'Full-time',
      benefits: BEN('Allowance', 'Provided', 'Allowance', true, true, '20 days', 'Employer Paid'),
      requirements: ['German A2', 'Technical aptitude'],
      status: 'Open',
      postedOffsetDays: -35,
    },
  ],
  contract: {
    contractNumber: 'CTR-DE-2025-0058',
    startOffsetDays: -220,
    endOffsetDays: 510,
    durationMonths: 24,
    workingConditions:
      'Thirty-eight-hour week under the food industry collective agreement. Shift and night supplements. Subsidised canteen and transport pass.',
    renewalStatus: 'Not Started',
    status: 'Active',
    signedOffsetDays: -236,
    notes: 'Stable employer. All fee lines confirmed compliant with the recruitment cost rules.',
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
  feeStatus: { 'Processing Fee': 'Paid', 'Placement Fee': 'Paid', 'Visa Fee': 'Paid', Insurance: 'Included' },
  feeBorneBy: { Insurance: 'Employer', 'Placement Fee': 'Employer' },
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
    { name: 'Employment Contract 2025', type: 'Contract', status: 'Verified', uploadedOffsetDays: -236, expiresOffsetDays: 510, fileSizeKb: 700 },
    { name: 'Handelsregister Extract', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -275, expiresOffsetDays: null, fileSizeKb: 940 },
    { name: 'Job Order JO-2026-019', type: 'Job Order', status: 'Verified', uploadedOffsetDays: -58, expiresOffsetDays: 260, fileSizeKb: 322 },
    { name: 'Betriebshaftpflicht Insurance', type: 'Insurance', status: 'Verified', uploadedOffsetDays: -212, expiresOffsetDays: 156, fileSizeKb: 780 },
    { name: 'Food Safety Certification', type: 'Employer Document', status: 'Verified', uploadedOffsetDays: -180, expiresOffsetDays: 205, fileSizeKb: 1320 },
  ],
  notes: [
    {
      author: 'Angelo Cruz',
      body: 'Employer requested a shortlist of 15 candidates for the March intake. Requirements are complete, so filtering can proceed immediately.',
      offsetDays: -14,
      pinned: false,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Qatar                                                               */
/* ------------------------------------------------------------------ */

const dohaFacilities: EmployerSeed = {
  id: 'emp-011',
  companyName: 'Doha Facilities Management',
  legalName: 'Doha Facilities Management Services W.L.L.',
  logoInitials: 'DF',
  logoHue: 280,
  registrationNumber: 'QA-DOH-2020-118743',
  country: 'Qatar',
  countryCode: 'QA',
  city: 'Doha',
  address: 'Al Sadd Street, Zone 38, Doha 21104',
  industry: 'Facilities & Cleaning',
  companySize: '51–200 employees',
  website: 'www.doha-facilities.example.qa',
  contactPerson: 'Khalid Al Thani',
  contactRole: 'Operations Manager',
  email: 'k.althani@doha-facilities.example.qa',
  phone: '+974 4432-7700',
  yearsOperating: 4,
  status: 'Pending',
  verification: 'Pending',
  verificationStage: 0,
  description:
    'Integrated facilities management provider delivering cleaning, landscaping and maintenance services to commercial towers in Doha. Newly registered and undergoing initial accreditation.',
  createdOffsetDays: -24,
  updatedOffsetDays: -1,
  updatedBy: 'Maria Santos',
  currency: 'QAR',
  jobs: [
    {
      position: 'Cleaner',
      jobCategory: 'Cleaning & Housekeeping',
      workersNeeded: 50,
      workersDeployed: 0,
      salaryMinLocal: 1500,
      salaryMaxLocal: 1800,
      workingHours: '10 hours/day',
      overtime: 'Limited',
      contractDurationMonths: 24,
      employmentType: 'Contractual',
      benefits: BEN('Provided', 'Provided', 'Provided', true, false, '21 days', 'Employer Paid'),
      requirements: ['Basic English', 'Age 21–40', 'Physically fit'],
      status: 'On Hold',
      postedOffsetDays: -18,
    },
  ],
  contract: {
    contractNumber: 'CTR-QA-2026-0001',
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
    { name: 'Job Order JO-2026-040', type: 'Job Order', status: 'Pending Review', uploadedOffsetDays: -18, expiresOffsetDays: 350, fileSizeKb: 240 },
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
/* New Zealand                                                         */
/* ------------------------------------------------------------------ */

const aucklandAgri: EmployerSeed = {
  id: 'emp-012',
  companyName: 'Auckland AgriWorks Ltd',
  legalName: 'Auckland AgriWorks Limited',
  logoInitials: 'AA',
  logoHue: 76,
  registrationNumber: 'NZ-AKL-2014-220986',
  country: 'New Zealand',
  countryCode: 'NZ',
  city: 'Hamilton',
  address: '145 Te Rapa Road, Hamilton 3200',
  industry: 'Agriculture',
  companySize: '51–200 employees',
  website: 'www.auckland-agriworks.example.nz',
  contactPerson: 'Hemi Walker',
  contactRole: 'Seasonal Labour Manager',
  email: 'h.walker@auckland-agriworks.example.nz',
  phone: '+64 7-849-3300',
  yearsOperating: 12,
  status: 'Inactive',
  verification: 'On Hold',
  verificationStage: 2,
  description:
    'Dairy and horticulture operation supplying seasonal labour across the Waikato region. Employer accreditation placed on hold pending an immigration compliance review.',
  createdOffsetDays: -520,
  updatedOffsetDays: -26,
  updatedBy: 'Johsua Rivera',
  currency: 'NZD',
  jobs: [
    {
      position: 'Agricultural Worker',
      jobCategory: 'Agriculture & Farming',
      workersNeeded: 45,
      workersDeployed: 45,
      salaryMinLocal: 4300,
      salaryMaxLocal: 5200,
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
    contractNumber: 'CTR-NZ-2025-0086',
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
    { name: 'Employment Contract 2025 Seasonal', type: 'Contract', status: 'Expired', uploadedOffsetDays: -425, expiresOffsetDays: -45, fileSizeKb: 560 },
    { name: 'NZ Companies Office Extract', type: 'Business Registration', status: 'Verified', uploadedOffsetDays: -515, expiresOffsetDays: null, fileSizeKb: 870 },
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
  sakura,
  tokyoIndustrial,
  seoulWorkforce,
  emiratesHospitality,
  gulfConstruction,
  singaporeEngineering,
  pacificHealthcare,
  nordicManufacturing,
  canadianLogistics,
  europeanFood,
  dohaFacilities,
  aucklandAgri,
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
