import type { EmployerRecord, FilterState, SortKey } from '@/types';
import { EMPTY_FILTERS } from './constants';
import { daysFromToday, formatCurrency, formatDuration } from './utils';
import { deriveRequirementBucket, effectiveContractStatus } from './selectors';

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

function matchesSearch(record: EmployerRecord, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  const { employer, jobs } = record;
  const haystack = [
    employer.companyName,
    employer.legalName,
    employer.country,
    employer.city,
    employer.industry,
    employer.contactPerson,
    employer.registrationNumber,
    employer.email,
    ...jobs.map((job) => job.position),
    ...jobs.map((job) => job.jobCategory),
  ]
    .join(' ')
    .toLowerCase();
  return needle.split(/\s+/).every((token) => haystack.includes(token));
}

function anyJob(record: EmployerRecord, predicate: (job: EmployerRecord['jobs'][number]) => boolean): boolean {
  return record.jobs.some(predicate);
}

function anyBenefit(
  record: EmployerRecord,
  predicate: (benefits: NonNullable<EmployerRecord['benefits']>) => boolean,
): boolean {
  return record.jobs.some((job) => predicate(job.benefits));
}

/** Range filters use an overlap test: the employer's band must intersect the query. */
function overlapsRange(min: number | null, max: number | null, bandMin: number, bandMax: number): boolean {
  if (min !== null && bandMax < min) return false;
  if (max !== null && bandMin > max) return false;
  return true;
}

export function matchesFilters(record: EmployerRecord, filters: FilterState): boolean {
  const { employer } = record;

  if (!matchesSearch(record, filters.search)) return false;

  /* Basic */
  if (filters.country.length && !filters.country.includes(employer.country)) return false;
  if (filters.city.length && !filters.city.includes(employer.city)) return false;
  if (filters.industry.length && !filters.industry.includes(employer.industry)) return false;
  if (filters.employerStatus.length && !filters.employerStatus.includes(employer.status)) return false;
  if (filters.verification.length && !filters.verification.includes(employer.verification)) return false;
  if (
    filters.jobCategory.length &&
    !anyJob(record, (job) => filters.jobCategory.includes(job.jobCategory))
  )
    return false;
  if (filters.position.length && !anyJob(record, (job) => filters.position.includes(job.position)))
    return false;

  /* Employment */
  if (!overlapsRange(filters.salaryMin, filters.salaryMax, record.salaryMinPhp, record.salaryMaxPhp))
    return false;
  if (
    filters.contractDuration.length &&
    !anyJob(record, (job) => filters.contractDuration.includes(job.contractDurationMonths))
  )
    return false;
  if (
    filters.employmentType.length &&
    !anyJob(record, (job) => filters.employmentType.includes(job.employmentType))
  )
    return false;
  if (filters.workingHours.length && !anyJob(record, (job) => filters.workingHours.includes(job.workingHours)))
    return false;
  if (filters.overtime.length && !anyJob(record, (job) => filters.overtime.includes(job.overtime)))
    return false;

  /* Financial — upper bounds only, matching how staff phrase the question
     ("show me anything cheaper than X"). */
  const feeCeilings: [number | null, EmployerRecord['feeTotals'][keyof EmployerRecord['feeTotals']]][] = [
    [filters.processingFeeMax, record.feeTotals['Processing Fee']],
    [filters.placementFeeMax, record.feeTotals['Placement Fee']],
    [filters.visaFeeMax, record.feeTotals['Visa Fee']],
    [filters.medicalFeeMax, record.feeTotals['Medical Fee']],
    [filters.documentationFeeMax, record.feeTotals['Documentation Fee']],
  ];
  for (const [ceiling, actual] of feeCeilings) {
    if (ceiling !== null && actual > ceiling) return false;
  }
  if (filters.totalCostMax !== null && record.totalEstimatedCost > filters.totalCostMax) return false;

  /* Benefits */
  if (
    filters.accommodation.length &&
    !anyBenefit(record, (b) => filters.accommodation.includes(b.accommodation))
  )
    return false;
  if (
    filters.transportation.length &&
    !anyBenefit(record, (b) => filters.transportation.includes(b.transportation))
  )
    return false;
  if (
    filters.foodAllowance.length &&
    !anyBenefit(record, (b) => filters.foodAllowance.includes(b.foodAllowance))
  )
    return false;
  if (filters.healthInsurance.length) {
    const wanted = filters.healthInsurance.map((v) => v === 'Yes');
    if (!anyBenefit(record, (b) => wanted.includes(b.healthInsurance))) return false;
  }
  if (filters.overtimePay.length) {
    const wanted = filters.overtimePay.map((v) => v === 'Yes');
    if (!anyBenefit(record, (b) => wanted.includes(b.overtimePay))) return false;
  }
  if (filters.annualLeave.length && !anyBenefit(record, (b) => filters.annualLeave.includes(b.annualLeave)))
    return false;
  if (filters.airfare.length && !anyBenefit(record, (b) => filters.airfare.includes(b.airfare)))
    return false;

  /* Contract */
  if (filters.contractStatus.length) {
    const status = effectiveContractStatus(record);
    if (!filters.contractStatus.includes(status)) return false;
  }

  /* Requirements */
  if (filters.requirementStatus.length) {
    const bucket = deriveRequirementBucket(record.requirements);
    if (!filters.requirementStatus.includes(bucket)) return false;
  }

  return true;
}

/* ------------------------------------------------------------------ */
/* Sorting                                                             */
/* ------------------------------------------------------------------ */

const collator = new Intl.Collator('en', { sensitivity: 'base' });

export function sortRecords(records: EmployerRecord[], sortBy: SortKey): EmployerRecord[] {
  const sorted = [...records];

  const compare = (a: EmployerRecord, b: EmployerRecord): number => {
    switch (sortBy) {
      case 'name-asc':
        return collator.compare(a.employer.companyName, b.employer.companyName);
      case 'name-desc':
        return collator.compare(b.employer.companyName, a.employer.companyName);
      case 'country-asc':
        return (
          collator.compare(a.employer.country, b.employer.country) ||
          collator.compare(a.employer.companyName, b.employer.companyName)
        );
      case 'country-desc':
        return (
          collator.compare(b.employer.country, a.employer.country) ||
          collator.compare(a.employer.companyName, b.employer.companyName)
        );
      case 'salary-desc':
        return b.salaryMaxPhp - a.salaryMaxPhp;
      case 'salary-asc':
        return a.salaryMinPhp - b.salaryMinPhp;
      case 'fee-asc':
        return a.totalEstimatedCost - b.totalEstimatedCost;
      case 'fee-desc':
        return b.totalEstimatedCost - a.totalEstimatedCost;
      case 'requirements-desc':
        return b.requirementCompletion - a.requirementCompletion;
      case 'requirements-asc':
        return a.requirementCompletion - b.requirementCompletion;
      case 'contract-expiry-asc': {
        const av = a.daysToContractExpiry ?? Number.MAX_SAFE_INTEGER;
        const bv = b.daysToContractExpiry ?? Number.MAX_SAFE_INTEGER;
        return av - bv;
      }
      case 'contract-expiry-desc': {
        const av = a.daysToContractExpiry ?? Number.MIN_SAFE_INTEGER;
        const bv = b.daysToContractExpiry ?? Number.MIN_SAFE_INTEGER;
        return bv - av;
      }
      case 'updated-asc':
        return new Date(a.employer.updatedAt).getTime() - new Date(b.employer.updatedAt).getTime();
      case 'updated-desc':
      default:
        return new Date(b.employer.updatedAt).getTime() - new Date(a.employer.updatedAt).getTime();
    }
  };

  return sorted.sort(compare);
}

export function filterAndSort(records: EmployerRecord[], filters: FilterState): EmployerRecord[] {
  return sortRecords(
    records.filter((record) => matchesFilters(record, filters)),
    filters.sortBy,
  );
}

/* ------------------------------------------------------------------ */
/* Active filter chips                                                 */
/* ------------------------------------------------------------------ */

export type FilterGroup = 'basic' | 'employment' | 'financial' | 'benefits' | 'contract' | 'requirements';

export interface ActiveFilterChip {
  id: string;
  group: FilterGroup;
  label: string;
  value: string;
}

const FEE_LABELS: Record<string, string> = {
  processingFeeMax: 'Processing fee',
  placementFeeMax: 'Placement fee',
  visaFeeMax: 'Visa fee',
  medicalFeeMax: 'Medical fee',
  documentationFeeMax: 'Documentation fee',
  totalCostMax: 'Total estimated cost',
};

const ARRAY_LABELS: Record<string, { group: FilterGroup; label: string; format?: (v: string) => string }> = {
  country: { group: 'basic', label: 'Country' },
  city: { group: 'basic', label: 'City' },
  industry: { group: 'basic', label: 'Industry' },
  jobCategory: { group: 'basic', label: 'Job category' },
  position: { group: 'basic', label: 'Position' },
  employerStatus: { group: 'basic', label: 'Employer status' },
  verification: { group: 'basic', label: 'Verification' },
  employmentType: { group: 'employment', label: 'Employment type' },
  workingHours: { group: 'employment', label: 'Working hours' },
  overtime: { group: 'employment', label: 'Overtime' },
  contractDuration: { group: 'employment', label: 'Contract duration', format: (v) => formatDuration(Number(v)) },
  accommodation: { group: 'benefits', label: 'Accommodation' },
  transportation: { group: 'benefits', label: 'Transportation' },
  foodAllowance: { group: 'benefits', label: 'Food allowance' },
  healthInsurance: { group: 'benefits', label: 'Health insurance' },
  overtimePay: { group: 'benefits', label: 'Overtime pay' },
  annualLeave: { group: 'benefits', label: 'Annual leave' },
  airfare: { group: 'benefits', label: 'Airfare' },
  contractStatus: { group: 'contract', label: 'Contract status' },
  requirementStatus: { group: 'requirements', label: 'Requirements' },
};

export function buildFilterChips(filters: FilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.search.trim()) {
    chips.push({ id: 'search', group: 'basic', label: 'Search', value: filters.search.trim() });
  }

  (Object.keys(ARRAY_LABELS) as (keyof typeof ARRAY_LABELS)[]).forEach((key) => {
    const meta = ARRAY_LABELS[key];
    const values = filters[key as keyof FilterState];
    if (!Array.isArray(values)) return;
    values.forEach((value) => {
      const raw = String(value);
      chips.push({
        id: `${key}:${raw}`,
        group: meta.group,
        label: meta.label,
        value: meta.format ? meta.format(raw) : raw,
      });
    });
  });

  if (filters.salaryMin !== null) {
    chips.push({
      id: 'salaryMin',
      group: 'employment',
      label: 'Salary at least',
      value: formatCurrency(filters.salaryMin),
    });
  }
  if (filters.salaryMax !== null) {
    chips.push({
      id: 'salaryMax',
      group: 'employment',
      label: 'Salary up to',
      value: formatCurrency(filters.salaryMax),
    });
  }

  (Object.keys(FEE_LABELS) as string[]).forEach((key) => {
    const value = filters[key as keyof FilterState];
    if (typeof value === 'number' && value !== null) {
      chips.push({
        id: key,
        group: 'financial',
        label: FEE_LABELS[key],
        value: `≤ ${formatCurrency(value)}`,
      });
    }
  });

  return chips;
}

export function removeFilterChip(filters: FilterState, chipId: string): FilterState {
  const next: FilterState = { ...filters };

  if (chipId === 'search') return { ...next, search: '' };

  if (chipId === 'salaryMin') return { ...next, salaryMin: null };
  if (chipId === 'salaryMax') return { ...next, salaryMax: null };
  if (chipId in FEE_LABELS) return { ...next, [chipId]: null } as FilterState;

  const [key, rawValue] = chipId.split(':');
  if (!(key in ARRAY_LABELS) || rawValue === undefined) return next;

  const current = filters[key as keyof FilterState];
  if (!Array.isArray(current)) return next;

  const numeric = key === 'contractDuration';
  const filtered = (current as (string | number)[]).filter((value) =>
    numeric ? Number(value) !== Number(rawValue) : String(value) !== rawValue,
  );

  return { ...next, [key]: filtered } as FilterState;
}

export function countActiveFilters(filters: FilterState): number {
  return buildFilterChips(filters).length;
}

export function hasActiveFilters(filters: FilterState): boolean {
  return countActiveFilters(filters) > 0;
}

/** Chips grouped for the filter summary bar, preserving panel order. */
export function groupFilterChips(chips: ActiveFilterChip[]): { group: FilterGroup; chips: ActiveFilterChip[] }[] {
  const order: FilterGroup[] = ['basic', 'employment', 'financial', 'benefits', 'contract', 'requirements'];
  return order
    .map((group) => ({ group, chips: chips.filter((chip) => chip.group === group) }))
    .filter((entry) => entry.chips.length > 0);
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

/** Defensive parse — a stale localStorage payload must never break the app. */
export function normalizeFilters(input: unknown): FilterState {
  if (!input || typeof input !== 'object') return { ...EMPTY_FILTERS };
  const raw = input as Partial<FilterState>;
  const merged: FilterState = { ...EMPTY_FILTERS, ...raw };

  // Array fields must stay arrays of the right primitive type.
  const mutable = merged as unknown as Record<string, unknown>;
  (Object.keys(ARRAY_LABELS) as (keyof FilterState)[]).forEach((key) => {
    const value = merged[key];
    if (!Array.isArray(value)) {
      mutable[key as string] = [];
      return;
    }
    if (key === 'contractDuration') {
      mutable[key as string] = value.map(Number).filter((v) => !Number.isNaN(v));
    }
  });

  merged.search = typeof merged.search === 'string' ? merged.search : '';
  merged.sortBy = (merged.sortBy ?? 'updated-desc') as SortKey;
  return merged;
}

/* ------------------------------------------------------------------ */
/* Quick presets evaluated live                                        */
/* ------------------------------------------------------------------ */

/**
 * System presets are stored as plain filter states, but "Expiring Contracts"
 * and "Complete Employers" depend on derived values. This helper applies the
 * extra predicate those two presets need.
 */
export function applyPresetPredicate(
  records: EmployerRecord[],
  presetId: string,
): EmployerRecord[] {
  switch (presetId) {
    case 'preset-expiring':
      return records.filter((r) => {
        const days = r.daysToContractExpiry;
        return days !== null && days >= 0 && days <= 30;
      });
    case 'preset-complete':
      return records.filter((r) => r.requirementCompletion === 100);
    case 'preset-verified-fast':
      return records.filter(
        (r) => r.employer.verification === 'Verified' && r.requirementCompletion === 100,
      );
    default:
      return records;
  }
}

export { EMPTY_FILTERS };

/** Exposed for the Reports page, which needs the same expiry semantics. */
export function contractExpiryBucket(record: EmployerRecord): 'Active' | 'Expiring Soon' | 'Expired' | 'None' {
  const days = record.daysToContractExpiry;
  if (days === null) return 'None';
  if (days < 0) return 'Expired';
  if (days <= 30) return 'Expiring Soon';
  return 'Active';
}

export function daysUntil(iso: string | null): number | null {
  return iso ? daysFromToday(iso) : null;
}
