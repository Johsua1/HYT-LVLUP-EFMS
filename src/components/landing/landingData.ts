import {
  BarChart3,
  CalendarClock,
  Columns3,
  FileSignature,
  Globe2,
  ListChecks,
  ReceiptText,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

/**
 * Landing-page sample content.
 *
 * IMPORTANT: every employer below is an ILLUSTRATIVE SAMPLE RECORD, not a
 * listing. Records are deliberately named by industry ("Manufacturing
 * Employer") rather than by company so nothing on this page can be mistaken
 * for a real, verified employer. The UI labels the dataset as sample data.
 */

export type Accommodation = 'Provided' | 'Allowance' | 'Not Provided';
export type SampleStatus = 'Active' | 'Pending';
export type SampleVerification = 'Verified' | 'Under Review';

export interface SampleEmployer {
  id: string;
  title: string;
  country: string;
  code: string;
  city: string;
  industry: string;
  position: string;
  salaryMin: number;
  salaryMax: number;
  /** Estimated processing fee in PHP. */
  fee: number;
  durationMonths: number;
  accommodation: Accommodation;
  status: SampleStatus;
  verification: SampleVerification;
  hue: number;
}

export const SAMPLE_EMPLOYERS: SampleEmployer[] = [
  {
    id: 'jp-mfg',
    title: 'Manufacturing Employer',
    country: 'Japan',
    code: 'JP',
    city: 'Aichi',
    industry: 'Manufacturing',
    position: 'Factory Worker',
    salaryMin: 68400,
    salaryMax: 83600,
    fee: 18000,
    durationMonths: 36,
    accommodation: 'Provided',
    status: 'Active',
    verification: 'Verified',
    hue: 218,
  },
  {
    id: 'kr-marine',
    title: 'Shipbuilding Employer',
    country: 'South Korea',
    code: 'KR',
    city: 'Busan',
    industry: 'Marine & Shipbuilding',
    position: 'Welder',
    salaryMin: 96600,
    salaryMax: 130200,
    fee: 22000,
    durationMonths: 24,
    accommodation: 'Provided',
    status: 'Active',
    verification: 'Verified',
    hue: 198,
  },
  {
    id: 'ae-hosp',
    title: 'Hospitality Employer',
    country: 'United Arab Emirates',
    code: 'AE',
    city: 'Dubai',
    industry: 'Hospitality',
    position: 'Hotel Staff',
    salaryMin: 24960,
    salaryMax: 34320,
    fee: 12000,
    durationMonths: 24,
    accommodation: 'Provided',
    status: 'Active',
    verification: 'Under Review',
    hue: 32,
  },
  {
    id: 'au-health',
    title: 'Healthcare Employer',
    country: 'Australia',
    code: 'AU',
    city: 'Sydney',
    industry: 'Healthcare',
    position: 'Registered Nurse',
    salaryMin: 147420,
    salaryMax: 185220,
    fee: 35000,
    durationMonths: 36,
    accommodation: 'Allowance',
    status: 'Active',
    verification: 'Verified',
    hue: 156,
  },
  {
    id: 'sg-eng',
    title: 'Engineering Employer',
    country: 'Singapore',
    code: 'SG',
    city: 'Jurong',
    industry: 'Engineering',
    position: 'Mechanical Technician',
    salaryMin: 59500,
    salaryMax: 76500,
    fee: 20000,
    durationMonths: 24,
    accommodation: 'Provided',
    status: 'Active',
    verification: 'Verified',
    hue: 4,
  },
  {
    id: 'de-mfg',
    title: 'Manufacturing Employer',
    country: 'Germany',
    code: 'DE',
    city: 'Wolfsburg',
    industry: 'Manufacturing',
    position: 'Assembly Line Operator',
    salaryMin: 135300,
    salaryMax: 166050,
    fee: 28000,
    durationMonths: 24,
    accommodation: 'Provided',
    status: 'Active',
    verification: 'Under Review',
    hue: 44,
  },
  {
    id: 'ca-food',
    title: 'Food Processing Employer',
    country: 'Canada',
    code: 'CA',
    city: 'Toronto',
    industry: 'Food Processing',
    position: 'Food Processing Worker',
    salaryMin: 130510,
    salaryMax: 155770,
    fee: 30000,
    durationMonths: 24,
    accommodation: 'Not Provided',
    status: 'Active',
    verification: 'Verified',
    hue: 350,
  },
  {
    id: 'qa-hosp',
    title: 'Hospitality Employer',
    country: 'Qatar',
    code: 'QA',
    city: 'Doha',
    industry: 'Hospitality',
    position: 'Hotel Staff',
    salaryMin: 25120,
    salaryMax: 31400,
    fee: 11000,
    durationMonths: 24,
    accommodation: 'Provided',
    status: 'Pending',
    verification: 'Under Review',
    hue: 282,
  },
  {
    id: 'nz-agri',
    title: 'Agriculture Employer',
    country: 'New Zealand',
    code: 'NZ',
    city: 'Waikato',
    industry: 'Agriculture',
    position: 'Agricultural Worker',
    salaryMin: 152240,
    salaryMax: 183380,
    fee: 26000,
    durationMonths: 36,
    accommodation: 'Provided',
    status: 'Active',
    verification: 'Verified',
    hue: 168,
  },
  {
    id: 'se-mfg',
    title: 'Manufacturing Employer',
    country: 'Sweden',
    code: 'SE',
    city: 'Gothenburg',
    industry: 'Manufacturing',
    position: 'Welder',
    salaryMin: 151200,
    salaryMax: 178200,
    fee: 24000,
    durationMonths: 24,
    accommodation: 'Provided',
    status: 'Active',
    verification: 'Verified',
    hue: 208,
  },
];

export const FILTER_COUNTRIES = [
  'Japan',
  'South Korea',
  'United Arab Emirates',
  'Singapore',
  'Australia',
  'Germany',
  'Canada',
  'Qatar',
  'New Zealand',
  'Sweden',
];

export const FILTER_INDUSTRIES = [
  'Manufacturing',
  'Marine & Shipbuilding',
  'Hospitality',
  'Healthcare',
  'Engineering',
  'Food Processing',
  'Agriculture',
];

export const FILTER_POSITIONS = [
  'Factory Worker',
  'Assembly Line Operator',
  'Welder',
  'Hotel Staff',
  'Registered Nurse',
  'Mechanical Technician',
  'Food Processing Worker',
  'Agricultural Worker',
];

export const FILTER_DURATIONS = [24, 36];

/* ------------------------------------------------------------------ */
/* Statistics                                                          */
/* ------------------------------------------------------------------ */

export interface LandingStat {
  value: number;
  suffix: string;
  label: string;
  detail: string;
}

export const LANDING_STATS: LandingStat[] = [
  { value: 10, suffix: '+', label: 'Sample employers', detail: 'Across the demo dataset' },
  { value: 7, suffix: '', label: 'Countries represented', detail: 'In the featured directory' },
  { value: 12, suffix: '', label: 'Industry categories', detail: 'From manufacturing to healthcare' },
  { value: 7, suffix: '', label: 'Fee categories tracked', detail: 'Every cost line itemised' },
];

/* ------------------------------------------------------------------ */
/* Capabilities                                                        */
/* ------------------------------------------------------------------ */

export type FeatureSpan = 'wide' | 'tall' | 'standard';

export interface LandingFeature {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  span: FeatureSpan;
  visual?: 'filter' | 'directory' | 'compare' | 'fees' | 'contract' | 'requirements' | 'verification' | 'reports';
  glow: string;
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    key: 'filtering',
    title: 'Smart Employer Filtering',
    description:
      'Search and filter employers by country, industry, position, salary, fees, benefits and contract duration — all in one query.',
    icon: SlidersHorizontal,
    span: 'wide',
    visual: 'filter',
    glow: 'rgb(11 101 216 / 0.2)',
  },
  {
    key: 'directory',
    title: 'International Employer Directory',
    description: 'Explore employers from different countries through one organised employer database.',
    icon: Globe2,
    span: 'standard',
    visual: 'directory',
    glow: 'rgb(10 127 74 / 0.16)',
  },
  {
    key: 'comparison',
    title: 'Employer Comparison',
    description: 'Compare employers side by side on salary, fees, benefits, contract terms and requirements.',
    icon: Columns3,
    span: 'standard',
    visual: 'compare',
    glow: 'rgb(11 101 216 / 0.16)',
  },
  {
    key: 'fees',
    title: 'Fees Transparency',
    description: 'Review processing, placement, visa, medical and documentation fees in one breakdown.',
    icon: ReceiptText,
    span: 'standard',
    visual: 'fees',
    glow: 'rgb(10 127 74 / 0.16)',
  },
  {
    key: 'contracts',
    title: 'Contract Monitoring',
    description: 'Track contract duration, expiration dates and status so nothing lapses unnoticed.',
    icon: FileSignature,
    span: 'standard',
    visual: 'contract',
    glow: 'rgb(11 101 216 / 0.16)',
  },
  {
    key: 'requirements',
    title: 'Requirements Tracking',
    description: 'Monitor employer documents and requirements with checklists and completion indicators.',
    icon: ListChecks,
    span: 'standard',
    visual: 'requirements',
    glow: 'rgb(11 101 216 / 0.16)',
  },
  {
    key: 'verification',
    title: 'Employer Verification',
    description: 'See which employers are verified and which requirements are still pending.',
    icon: ShieldCheck,
    span: 'standard',
    visual: 'verification',
    glow: 'rgb(10 127 74 / 0.18)',
  },
  {
    key: 'reports',
    title: 'Reports and Analytics',
    description:
      'Understand employer distribution, industry mix, salary ranges, fees and contract status through visual reports.',
    icon: BarChart3,
    span: 'wide',
    visual: 'reports',
    glow: 'rgb(11 101 216 / 0.18)',
  },
];

/* ------------------------------------------------------------------ */
/* Process                                                             */
/* ------------------------------------------------------------------ */

export interface LandingStep {
  index: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const LANDING_STEPS: LandingStep[] = [
  {
    index: '01',
    title: 'Discover',
    description: 'Browse international employers and the job opportunities attached to each record.',
    icon: Search,
  },
  {
    index: '02',
    title: 'Filter',
    description: 'Narrow the directory by country, industry, salary, fees, benefits and contract length.',
    icon: SlidersHorizontal,
  },
  {
    index: '03',
    title: 'Compare',
    description: 'Evaluate employers side by side to see exactly where the differences sit.',
    icon: Scale,
  },
  {
    index: '04',
    title: 'Review',
    description: 'Examine contracts, fees, requirements and verification before making an assessment.',
    icon: ShieldCheck,
  },
];

/* ------------------------------------------------------------------ */
/* Countries                                                           */
/* ------------------------------------------------------------------ */

export interface LandingCountry {
  name: string;
  code: string;
  industries: string[];
  positions: string[];
  note: string;
}

export const LANDING_COUNTRIES: LandingCountry[] = [
  {
    name: 'Japan',
    code: 'JP',
    industries: ['Manufacturing', 'Food Processing'],
    positions: ['Factory Worker', 'Assembly Line Operator'],
    note: 'Long-tenure manufacturing contracts',
  },
  {
    name: 'South Korea',
    code: 'KR',
    industries: ['Marine & Shipbuilding', 'Manufacturing'],
    positions: ['Welder', 'Shipfitter'],
    note: 'Shipyard and fabrication roles',
  },
  {
    name: 'Singapore',
    code: 'SG',
    industries: ['Engineering', 'Logistics'],
    positions: ['Mechanical Technician', 'Warehouse Picker'],
    note: 'Technical and warehouse work',
  },
  {
    name: 'United Arab Emirates',
    code: 'AE',
    industries: ['Hospitality', 'Construction'],
    positions: ['Hotel Staff', 'Steel Fixer'],
    note: 'Service and site-based roles',
  },
  {
    name: 'Australia',
    code: 'AU',
    industries: ['Healthcare', 'Agriculture'],
    positions: ['Registered Nurse', 'Caregiver'],
    note: 'Health and seasonal work',
  },
  {
    name: 'Canada',
    code: 'CA',
    industries: ['Food Processing', 'Agriculture'],
    positions: ['Food Processing Worker', 'Warehouse Picker'],
    note: 'Processing and logistics roles',
  },
  {
    name: 'Germany',
    code: 'DE',
    industries: ['Manufacturing', 'Engineering'],
    positions: ['Assembly Line Operator', 'Heavy Equipment Operator'],
    note: 'Industrial and technical trades',
  },
];

export const OTHER_COUNTRIES = ['Qatar', 'Sweden', 'New Zealand'];

/* ------------------------------------------------------------------ */
/* Benefits                                                            */
/* ------------------------------------------------------------------ */

export interface LandingBenefit {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const LANDING_BENEFITS: LandingBenefit[] = [
  {
    title: 'Centralized employer information',
    description: 'One structured record per employer instead of scattered files and threads.',
    icon: Globe2,
  },
  {
    title: 'Faster employer discovery',
    description: 'Filter the directory in seconds rather than rebuilding a spreadsheet.',
    icon: Search,
  },
  {
    title: 'Organized fee information',
    description: 'Every processing, placement and government cost itemised and comparable.',
    icon: Wallet,
  },
  {
    title: 'Easier employer comparison',
    description: 'Evaluate destinations and offers side by side on the same criteria.',
    icon: Columns3,
  },
  {
    title: 'Contract monitoring',
    description: 'Duration, expiry and renewal status stay visible against each employer.',
    icon: CalendarClock,
  },
  {
    title: 'Requirements tracking',
    description: 'Know what is complete, what is pending and what still needs follow-up.',
    icon: ListChecks,
  },
  {
    title: 'Better information visibility',
    description: 'A shared workspace so the whole team works from the same record.',
    icon: ShieldCheck,
  },
];

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export function php(value: number): string {
  return `₱${value.toLocaleString('en-US')}`;
}

export function phpCompact(value: number): string {
  if (value >= 1000) return `₱${Math.round(value / 1000)}k`;
  return `₱${value}`;
}

export function salaryRange(min: number, max: number): string {
  return `${phpCompact(min)}–${phpCompact(max)}`;
}

export function durationLabel(months: number): string {
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${months} months`;
}
