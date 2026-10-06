import type {
  ContractStatus,
  DocumentRecord,
  Employer,
  EmployerRecord,
  FeeItem,
  FeeType,
  JobOrder,
  Note,
  RequirementItem,
  RequirementStatus,
  VerificationEvent,
} from '@/types';
import { FEE_TYPES, VERIFICATION_STAGES } from './constants';
import { addMonths, average, daysFromToday, sum } from './utils';

export interface DatasetShape {
  employers: Employer[];
  jobs: JobOrder[];
  contracts: import('@/types').Contract[];
  fees: FeeItem[];
  requirements: RequirementItem[];
  documents: DocumentRecord[];
  notes: Note[];
  verificationEvents: VerificationEvent[];
}

/* ------------------------------------------------------------------ */
/* Derived helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Contract status is derived rather than trusted from storage so that a
 * contract automatically becomes "Expiring Soon" / "Expired" as time passes,
 * without needing a nightly job.
 */
export function deriveContractStatus(
  rawStatus: ContractStatus,
  endDate: string | null,
): ContractStatus {
  if (!endDate) return rawStatus;
  if (rawStatus === 'Draft' || rawStatus === 'Under Review' || rawStatus === 'Renewed') return rawStatus;
  const remaining = daysFromToday(endDate);
  if (remaining < 0) return 'Expired';
  if (remaining <= 30) return 'Expiring Soon';
  return 'Active';
}

/**
 * The next manual step in a contract's lifecycle, or `null` when the contract
 * is already past the approval stage (its status is then driven by the end
 * date). Only Draft → Under Review → Active are explicit transitions; the
 * remaining states are derived.
 */
export function nextContractStatus(rawStatus: ContractStatus): ContractStatus | null {
  if (rawStatus === 'Draft') return 'Under Review';
  if (rawStatus === 'Under Review') return 'Active';
  return null;
}

/** Human label for the button that performs `nextContractStatus`. */
export const CONTRACT_STEP_LABEL: Partial<Record<ContractStatus, string>> = {
  Draft: 'Submit for review',
  'Under Review': 'Approve & activate',
};

/**
 * The dates for a renewed contract term.
 *
 * The new term starts when the old one ends — or today, if the contract already
 * lapsed — so coverage stays continuous rather than leaving a gap, and runs for
 * the contract's original `durationMonths`. Pure (with an injectable `now`) so
 * the date maths can be tested without touching the clock.
 */
export function renewalTerm(
  endDate: string | null,
  durationMonths: number,
  now: Date = new Date(),
): { startDate: string; endDate: string } {
  const startsAt = endDate && new Date(endDate).getTime() > now.getTime() ? endDate : now.toISOString();
  return { startDate: startsAt, endDate: addMonths(startsAt, durationMonths) };
}

/**
 * How many verification stages are fully complete.
 *
 * `verificationStage` is the index of the stage *currently being worked on*
 * (0 = nothing done yet), so a `Verified` employer — which the store records at
 * index 4 — has all five stages done. Feeding that back into the timeline is
 * what lets "Employer Approved" render as complete and the bar reach 100%;
 * without it the last stage lingers as "in progress" and progress caps at 80%.
 */
export function verificationStagesCompleted(
  employer: Pick<Employer, 'verification' | 'verificationStage'>,
): number {
  return employer.verification === 'Verified' ? VERIFICATION_STAGES.length : employer.verificationStage;
}

/**
 * Collapses the requirement checklist into the four buckets the filter panel
 * exposes, so the UI never has to reason about individual checklist items.
 */
export function deriveRequirementBucket(requirements: RequirementItem[]): RequirementStatus {
  if (!requirements.length) return 'Incomplete';
  const mandatory = requirements.filter((r) => r.mandatory);
  const mandatoryDone = mandatory.every((r) => r.completed);
  const allDone = requirements.every((r) => r.completed);

  if (allDone) return 'Complete';
  if (requirements.some((r) => r.status === 'Under Review')) return 'Under Review';
  if (!mandatoryDone) return 'Missing Documents';
  return 'Incomplete';
}

export function requirementCompletionPercent(requirements: RequirementItem[]): number {
  if (!requirements.length) return 0;
  return Math.round((requirements.filter((r) => r.completed).length / requirements.length) * 100);
}

/** Cost to the worker: employer-borne and non-applicable lines are excluded. */
export function computeTotalEstimatedCost(fees: FeeItem[]): number {
  return sum(
    fees
      .filter((fee) => fee.borneBy !== 'Employer' && fee.paymentStatus !== 'Not Applicable')
      .map((fee) => fee.amount),
  );
}

export function feeTotalsOf(fees: FeeItem[]): Record<FeeType, number> {
  const totals = FEE_TYPES.reduce(
    (acc, type) => ({ ...acc, [type]: 0 }),
    {} as Record<FeeType, number>,
  );
  fees.forEach((fee) => {
    totals[fee.type] = (totals[fee.type] ?? 0) + fee.amount;
  });
  return totals;
}

/**
 * The job order the employer profile and edit form present as "the" job.
 *
 * Open orders win, then the one needing the most workers. Both the read path
 * (`buildEmployerRecords`) and the write path (`saveEmployer`) must use this
 * same rule, otherwise an edit lands on one job order while the form keeps
 * displaying another.
 */
export function pickPrimaryJob(jobs: JobOrder[]): JobOrder | null {
  if (!jobs.length) return null;
  const open = jobs.filter((job) => job.status === 'Open');
  const pool = open.length ? open : jobs;
  return [...pool].sort((a, b) => b.workersNeeded - a.workersNeeded)[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Record builder                                                      */
/* ------------------------------------------------------------------ */

export function buildEmployerRecords(data: DatasetShape): EmployerRecord[] {
  const jobsByEmployer = groupBy(data.jobs, (j) => j.employerId);
  const feesByEmployer = groupBy(data.fees, (f) => f.employerId);
  const reqsByEmployer = groupBy(data.requirements, (r) => r.employerId);
  const docsByEmployer = groupBy(data.documents, (d) => d.employerId);
  const notesByEmployer = groupBy(data.notes, (n) => n.employerId);
  const eventsByEmployer = groupBy(data.verificationEvents, (v) => v.employerId);
  const contractByEmployer = new Map(data.contracts.map((c) => [c.employerId, c]));

  return data.employers.map((employer) => {
    const jobs = jobsByEmployer.get(employer.id) ?? [];
    const fees = feesByEmployer.get(employer.id) ?? [];
    const requirements = reqsByEmployer.get(employer.id) ?? [];
    const documents = docsByEmployer.get(employer.id) ?? [];
    const notes = notesByEmployer.get(employer.id) ?? [];
    const verificationEvents = eventsByEmployer.get(employer.id) ?? [];
    const contract = contractByEmployer.get(employer.id) ?? null;

    const primaryJob = pickPrimaryJob(jobs);
    const openJobs = jobs.filter((job) => job.status === 'Open');

    const positionsAvailable = sum(
      openJobs.map((job) => Math.max(0, job.workersNeeded - job.workersDeployed)),
    );

    const salaryMinPhp = jobs.length ? Math.min(...jobs.map((j) => j.salaryMinPhp)) : 0;
    const salaryMaxPhp = jobs.length ? Math.max(...jobs.map((j) => j.salaryMaxPhp)) : 0;

    const daysToExpiry = contract ? daysFromToday(contract.endDate) : null;

    return {
      employer,
      jobs,
      contract,
      fees,
      requirements,
      documents,
      notes,
      verificationEvents,

      positionsAvailable,
      openJobOrders: openJobs.length,
      salaryMinPhp,
      salaryMaxPhp,
      primaryJob,
      benefits: primaryJob?.benefits ?? null,
      feeTotals: feeTotalsOf(fees),
      totalEstimatedCost: computeTotalEstimatedCost(fees),
      requirementCompletion: requirementCompletionPercent(requirements),
      mandatoryOutstanding: requirements.filter((r) => r.mandatory && !r.completed).length,
      daysToContractExpiry: daysToExpiry,
      expiredDocumentCount: documents.filter((d) => d.status === 'Expired').length,
      pendingDocumentCount: documents.filter((d) => d.status === 'Pending Review').length,
    };
  });
}

export function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  items.forEach((item) => {
    const key = keyFn(item);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  });
  return map;
}

export function findRecord(records: EmployerRecord[], id: string): EmployerRecord | undefined {
  return records.find((record) => record.employer.id === id);
}

/** Effective contract status used consistently by filters, tables and charts. */
export function effectiveContractStatus(record: EmployerRecord): ContractStatus | 'None' {
  if (!record.contract) return 'None';
  return deriveContractStatus(record.contract.status, record.contract.endDate);
}

/* ------------------------------------------------------------------ */
/* Dashboard & report metrics                                          */
/* ------------------------------------------------------------------ */

export interface DashboardMetrics {
  totalEmployers: number;
  activeEmployers: number;
  pendingVerification: number;
  verifiedEmployers: number;
  expiringContracts: number;
  expiredContracts: number;
  averageProcessingFee: number;
  averageTotalCost: number;
  countriesCovered: number;
  totalPositionsAvailable: number;
  requirementCompletionAvg: number;
  activeContractValuePhp: number;
  employersByCountry: { name: string; value: number }[];
  employersByIndustry: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  contractStatusDistribution: { name: string; value: number }[];
  verificationDistribution: { name: string; value: number }[];
  feeDistribution: { name: string; value: number }[];
  requirementDistribution: { name: string; value: number }[];
  salaryByCountry: { name: string; min: number; max: number; average: number }[];
}

export function computeDashboardMetrics(records: EmployerRecord[]): DashboardMetrics {
  const active = records.filter((r) => r.employer.status === 'Active');
  const pendingVerification = records.filter((r) =>
    ['Pending', 'Under Review'].includes(r.employer.verification),
  );
  const verified = records.filter((r) => r.employer.verification === 'Verified');

  const contractStatuses = records.map(effectiveContractStatus);
  const expiring = contractStatuses.filter((s) => s === 'Expiring Soon').length;
  const expired = contractStatuses.filter((s) => s === 'Expired').length;

  const processingFees = records
    .map((r) => r.feeTotals['Processing Fee'])
    .filter((value) => value > 0);

  const countBy = (keyFn: (r: EmployerRecord) => string) => {
    const map = new Map<string, number>();
    records.forEach((r) => map.set(keyFn(r), (map.get(keyFn(r)) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const countryMap = new Map<string, number[]>();
  records.forEach((r) => {
    if (!r.salaryMaxPhp) return;
    const list = countryMap.get(r.employer.country) ?? [];
    list.push(r.salaryMaxPhp);
    countryMap.set(r.employer.country, list);
  });

  return {
    totalEmployers: records.length,
    activeEmployers: active.length,
    pendingVerification: pendingVerification.length,
    verifiedEmployers: verified.length,
    expiringContracts: expiring,
    expiredContracts: expired,
    averageProcessingFee: Math.round(average(processingFees)),
    averageTotalCost: Math.round(average(records.map((r) => r.totalEstimatedCost))),
    countriesCovered: new Set(records.map((r) => r.employer.country)).size,
    totalPositionsAvailable: sum(records.map((r) => r.positionsAvailable)),
    requirementCompletionAvg: Math.round(average(records.map((r) => r.requirementCompletion))),
    activeContractValuePhp: sum(active.map((r) => r.salaryMaxPhp * 12)),
    employersByCountry: countBy((r) => r.employer.country),
    employersByIndustry: countBy((r) => r.employer.industry),
    statusDistribution: countBy((r) => r.employer.status),
    contractStatusDistribution: countBy((r) => String(effectiveContractStatus(r))),
    verificationDistribution: countBy((r) => r.employer.verification),
    feeDistribution: FEE_TYPES.map((type) => ({
      name: type,
      value: Math.round(average(records.map((r) => r.feeTotals[type]).filter((v) => v > 0))),
    })).filter((item) => item.value > 0),
    requirementDistribution: countBy((r) => deriveRequirementBucket(r.requirements)),
    salaryByCountry: Array.from(countryMap.entries())
      .map(([name, values]) => ({
        name,
        min: Math.min(...values),
        max: Math.max(...values),
        average: Math.round(average(values)),
      }))
      .sort((a, b) => b.average - a.average),
  };
}

/* ------------------------------------------------------------------ */
/* Filter option discovery                                             */
/* ------------------------------------------------------------------ */

/** Builds filter dropdown options from the data actually present. */
export function deriveFilterOptions(records: EmployerRecord[]) {
  const uniqSorted = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort();

  return {
    countries: uniqSorted(records.map((r) => r.employer.country)),
    cities: uniqSorted(records.map((r) => r.employer.city)),
    industries: uniqSorted(records.map((r) => r.employer.industry)),
    jobCategories: uniqSorted(records.flatMap((r) => r.jobs.map((j) => j.jobCategory))),
    positions: uniqSorted(records.flatMap((r) => r.jobs.map((j) => j.position))),
    annualLeave: uniqSorted(records.flatMap((r) => r.jobs.map((j) => j.benefits.annualLeave))).filter(
      (value) => value !== '0 days',
    ),
  };
}

/** The option sets the filter panel renders, derived from live data. */
export type FilterOptions = ReturnType<typeof deriveFilterOptions>;
