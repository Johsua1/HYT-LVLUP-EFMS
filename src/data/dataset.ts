import type {
  ActivityLogEntry,
  Contract,
  DocumentRecord,
  Employer,
  FeeItem,
  FilterPreset,
  JobOrder,
  Note,
  NotificationItem,
  RequirementItem,
  ShortlistEntry,
  VerificationEvent,
} from '@/types';
import {
  CURRENCIES,
  EMPTY_FILTERS,
  FEE_TYPES,
  REQUIREMENT_TEMPLATE,
  VERIFICATION_STAGES,
} from '@/lib/constants';
import { isoOffset } from '@/lib/utils';
import { EMPLOYER_SEEDS, FEE_DUE_OFFSETS, FEE_NOTES, type EmployerSeed } from './seeds';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const toPhp = (amountLocal: number, currency: string): number =>
  Math.round(amountLocal * (CURRENCIES[currency]?.rateToPhp ?? 1));

const DOC_UPLOADERS = ['Johsua Rivera', 'Maria Santos', 'Angelo Cruz'];

/* ------------------------------------------------------------------ */
/* Entity builders                                                     */
/* ------------------------------------------------------------------ */

function buildEmployer(seed: EmployerSeed): Employer {
  return {
    id: seed.id,
    companyName: seed.companyName,
    legalName: seed.legalName,
    logoInitials: seed.logoInitials,
    logoHue: seed.logoHue,
    registrationNumber: seed.registrationNumber,
    country: seed.country,
    countryCode: seed.countryCode,
    city: seed.city,
    address: seed.address,
    industry: seed.industry,
    companySize: seed.companySize,
    website: seed.website,
    contactPerson: seed.contactPerson,
    contactRole: seed.contactRole,
    email: seed.email,
    phone: seed.phone,
    yearsOperating: seed.yearsOperating,
    status: seed.status,
    verification: seed.verification,
    verificationStage: seed.verificationStage,
    verificationUpdatedAt: isoOffset(seed.updatedOffsetDays - 2, 3),
    description: seed.description,
    createdAt: isoOffset(seed.createdOffsetDays),
    updatedAt: isoOffset(seed.updatedOffsetDays, 4),
    updatedBy: seed.updatedBy,
  };
}

function buildJobs(seed: EmployerSeed): JobOrder[] {
  return seed.jobs.map((job, index) => ({
    id: `${seed.id}-job-${index + 1}`,
    employerId: seed.id,
    reference: `JO-${new Date(isoOffset(job.postedOffsetDays)).getFullYear()}-${seed.id.slice(-3)}${index + 1}`,
    position: job.position,
    jobCategory: job.jobCategory,
    workersNeeded: job.workersNeeded,
    workersDeployed: job.workersDeployed,
    salaryMinLocal: job.salaryMinLocal,
    salaryMaxLocal: job.salaryMaxLocal,
    currency: seed.currency,
    salaryMinPhp: toPhp(job.salaryMinLocal, seed.currency),
    salaryMaxPhp: toPhp(job.salaryMaxLocal, seed.currency),
    workingHours: job.workingHours,
    overtime: job.overtime,
    contractDurationMonths: job.contractDurationMonths,
    employmentType: job.employmentType,
    benefits: job.benefits,
    requirements: job.requirements,
    status: job.status,
    postedAt: isoOffset(job.postedOffsetDays),
  }));
}

function buildContract(seed: EmployerSeed, primaryJob: JobOrder): Contract {
  const c = seed.contract;
  return {
    id: `${seed.id}-contract`,
    employerId: seed.id,
    contractNumber: c.contractNumber,
    jobOrderId: primaryJob.id,
    startDate: isoOffset(c.startOffsetDays),
    endDate: isoOffset(c.endOffsetDays),
    durationMonths: c.durationMonths,
    salaryMinLocal: primaryJob.salaryMinLocal,
    salaryMaxLocal: primaryJob.salaryMaxLocal,
    currency: seed.currency,
    workingConditions: c.workingConditions,
    renewalStatus: c.renewalStatus,
    status: c.status,
    signedAt: c.signedOffsetDays === null ? null : isoOffset(c.signedOffsetDays),
    notes: c.notes,
  };
}

function buildFees(seed: EmployerSeed): FeeItem[] {
  return FEE_TYPES.map((type) => ({
    id: `${seed.id}-fee-${type.toLowerCase().replace(/[^a-z]+/g, '-')}`,
    employerId: seed.id,
    type,
    amount: seed.feeAmounts[type],
    currency: 'PHP',
    borneBy: seed.feeBorneBy[type] ?? 'Worker',
    paymentStatus: seed.feeStatus[type] ?? 'Pending',
    dueDate: isoOffset(FEE_DUE_OFFSETS[type]),
    notes: FEE_NOTES[type],
  }));
}

function buildRequirements(seed: EmployerSeed): RequirementItem[] {
  const reviewed = new Set(seed.reviewRequirements);
  const completed = new Set(seed.completedRequirements);

  return REQUIREMENT_TEMPLATE.map((template) => {
    const isComplete = completed.has(template.key);
    const isReview = reviewed.has(template.key);

    let status: RequirementItem['status'];
    if (isReview) status = 'Under Review';
    else if (isComplete) status = 'Complete';
    else if (template.mandatory) status = 'Missing Documents';
    else status = 'Incomplete';

    return {
      id: `${seed.id}-req-${template.key}`,
      employerId: seed.id,
      key: template.key,
      label: template.label,
      description: template.description,
      completed: isComplete,
      status,
      mandatory: template.mandatory,
      updatedAt: isoOffset(seed.updatedOffsetDays - (isComplete ? 12 : 1), 2),
    };
  });
}

function buildDocuments(seed: EmployerSeed): DocumentRecord[] {
  return seed.documents.map((doc, index) => ({
    id: `${seed.id}-doc-${index + 1}`,
    employerId: seed.id,
    name: doc.name,
    type: doc.type,
    fileName: `${doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.pdf`,
    fileSizeKb: doc.fileSizeKb,
    storagePath: null,
    uploadedAt: isoOffset(doc.uploadedOffsetDays, index),
    uploadedBy: DOC_UPLOADERS[index % DOC_UPLOADERS.length],
    expiresAt: doc.expiresOffsetDays === null ? null : isoOffset(doc.expiresOffsetDays),
    status: doc.status,
    notes: doc.notes ?? '',
  }));
}

function buildNotes(seed: EmployerSeed): Note[] {
  return seed.notes.map((note, index) => ({
    id: `${seed.id}-note-${index + 1}`,
    employerId: seed.id,
    author: note.author,
    body: note.body,
    createdAt: isoOffset(note.offsetDays, index * 2),
    pinned: note.pinned,
  }));
}

function buildVerificationEvents(seed: EmployerSeed): VerificationEvent[] {
  const currentStage = seed.verificationStage;
  const failed =
    seed.verification === 'Rejected' || seed.verification === 'Requires Revision' || seed.verification === 'On Hold';

  return VERIFICATION_STAGES.map((stage, index) => {
    let outcome: VerificationEvent['outcome'];
    if (index < currentStage) outcome = 'completed';
    else if (index === currentStage) outcome = failed ? 'failed' : 'current';
    else outcome = 'pending';

    const offset = seed.updatedOffsetDays - (currentStage - index) * 9;
    return {
      id: `${seed.id}-ver-${stage.key}`,
      employerId: seed.id,
      stage: stage.label,
      actor: index < currentStage ? 'Maria Santos' : 'Johsua Rivera',
      timestamp: isoOffset(index <= currentStage ? offset : seed.updatedOffsetDays + (index - currentStage) * 7),
      outcome,
      comment:
        outcome === 'completed'
          ? `${stage.description} Completed without findings.`
          : outcome === 'current'
            ? `${stage.description} Currently in progress.`
            : outcome === 'failed'
              ? `${stage.description} Returned to the employer for revision.`
              : `${stage.description} Not yet started.`,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Cross-entity generators                                             */
/* ------------------------------------------------------------------ */

function buildNotifications(
  employers: Employer[],
  contracts: Contract[],
  documents: DocumentRecord[],
  requirements: RequirementItem[],
): NotificationItem[] {
  const items: NotificationItem[] = [];
  const today = new Date('2026-09-30T09:00:00Z').getTime();
  const days = (iso: string) => Math.ceil((new Date(iso).getTime() - today) / 86_400_000);

  contracts.forEach((contract) => {
    const remaining = days(contract.endDate);
    const employer = employers.find((e) => e.id === contract.employerId);
    if (!employer) return;

    if (remaining < 0) {
      items.push({
        id: `ntf-contract-expired-${contract.id}`,
        category: 'Contract',
        title: 'Employer contract expired',
        message: `${employer.companyName} — contract ${contract.contractNumber} expired ${Math.abs(remaining)} days ago.`,
        employerId: employer.id,
        createdAt: isoOffset(remaining, 8),
        read: false,
        severity: 'critical',
      });
    } else if (remaining <= 30) {
      items.push({
        id: `ntf-contract-expiring-${contract.id}`,
        category: 'Contract',
        title: `Contract expires in ${remaining} days`,
        message: `${employer.companyName} — ${contract.contractNumber} lapses on the ${new Date(contract.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.`,
        employerId: employer.id,
        createdAt: isoOffset(-2, 5),
        read: remaining > 15,
        severity: 'warning',
      });
    }
  });

  documents.forEach((doc) => {
    const employer = employers.find((e) => e.id === doc.employerId);
    if (!employer) return;
    const uploadedDays = days(doc.uploadedAt);

    if (doc.status === 'Pending Review' && uploadedDays > -21) {
      items.push({
        id: `ntf-doc-pending-${doc.id}`,
        category: 'Document',
        title: 'Employer document requires verification',
        message: `${employer.companyName} — "${doc.name}" is awaiting review.`,
        employerId: employer.id,
        createdAt: isoOffset(uploadedDays, 2),
        read: false,
        severity: 'info',
      });
    }
    if (doc.status === 'Rejected') {
      items.push({
        id: `ntf-doc-rejected-${doc.id}`,
        category: 'Document',
        title: 'Document rejected',
        message: `${employer.companyName} — "${doc.name}" was rejected and needs resubmission.`,
        employerId: employer.id,
        createdAt: isoOffset(uploadedDays + 1, 6),
        read: false,
        severity: 'warning',
      });
    }
    if (doc.status === 'Expired') {
      items.push({
        id: `ntf-doc-expired-${doc.id}`,
        category: 'Document',
        title: 'Document expired',
        message: `${employer.companyName} — "${doc.name}" has passed its validity date.`,
        employerId: employer.id,
        createdAt: isoOffset(uploadedDays + 2, 3),
        read: true,
        severity: 'warning',
      });
    }
  });

  const byEmployer = new Map<string, RequirementItem[]>();
  requirements.forEach((req) => {
    const list = byEmployer.get(req.employerId) ?? [];
    list.push(req);
    byEmployer.set(req.employerId, list);
  });

  byEmployer.forEach((list, employerId) => {
    const missingMandatory = list.filter((r) => r.mandatory && !r.completed);
    const employer = employers.find((e) => e.id === employerId);
    if (!employer || !missingMandatory.length) return;
    items.push({
      id: `ntf-req-${employerId}`,
      category: 'Requirement',
      title: 'Missing requirement detected',
      message: `${employer.companyName} — ${missingMandatory.length} mandatory requirement${missingMandatory.length === 1 ? '' : 's'} outstanding.`,
      employerId,
      createdAt: isoOffset(-4, 7),
      read: missingMandatory.length < 3,
      severity: 'warning',
    });
  });

  employers
    .filter((e) => days(e.createdAt) > -45)
    .forEach((employer) => {
      items.push({
        id: `ntf-new-${employer.id}`,
        category: 'Employer',
        title: 'New employer added',
        message: `${employer.companyName} (${employer.country}) was added to the employer database.`,
        employerId: employer.id,
        createdAt: isoOffset(days(employer.createdAt), 1),
        read: false,
        severity: 'info',
      });
    });

  employers
    .filter((e) => e.verification === 'Under Review')
    .forEach((employer) => {
      items.push({
        id: `ntf-ver-${employer.id}`,
        category: 'Verification',
        title: 'Employer verification in progress',
        message: `${employer.companyName} has entered stage ${employer.verificationStage + 1} of the verification workflow.`,
        employerId: employer.id,
        createdAt: isoOffset(-6, 2),
        read: true,
        severity: 'info',
      });
    });

  items.push({
    id: 'ntf-fee-1',
    category: 'Fee',
    title: 'Fee information updated',
    message: 'Processing fee schedule revised for Sakura Manufacturing Group following the salary adjustment.',
    employerId: 'emp-001',
    createdAt: isoOffset(-3, 5),
    read: false,
    severity: 'info',
  });
  items.push({
    id: 'ntf-fee-2',
    category: 'Fee',
    title: 'Placement fee overdue',
    message: 'Singapore Engineering Solutions — placement fee invoice is 30 days past due.',
    employerId: 'emp-006',
    createdAt: isoOffset(-8, 3),
    read: true,
    severity: 'warning',
  });
  items.push({
    id: 'ntf-sys-1',
    category: 'System',
    title: 'Monthly portfolio report is ready',
    message: 'The September employer portfolio summary has been generated and is available in Reports.',
    employerId: null,
    createdAt: isoOffset(-1, 2),
    read: false,
    severity: 'success',
  });

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function buildActivity(
  employers: Employer[],
  requirements: RequirementItem[],
  documents: DocumentRecord[],
  shortlist: ShortlistEntry[],
): ActivityLogEntry[] {
  const entries: ActivityLogEntry[] = [];

  const users: Record<string, string> = {
    'Johsua Rivera': 'JR',
    'Maria Santos': 'MS',
    'Angelo Cruz': 'AC',
  };

  employers.forEach((employer) => {
    entries.push({
      id: `act-created-${employer.id}`,
      user: 'Maria Santos',
      userInitials: users['Maria Santos'],
      action: 'added a new employer',
      actionType: 'created',
      employerId: employer.id,
      employerName: employer.companyName,
      timestamp: employer.createdAt,
      detail: `${employer.companyName} (${employer.country}) registered in the employer database.`,
    });

    entries.push({
      id: `act-updated-${employer.id}`,
      user: employer.updatedBy,
      userInitials: users[employer.updatedBy] ?? 'SY',
      action: 'updated employer information',
      actionType: 'updated',
      employerId: employer.id,
      employerName: employer.companyName,
      timestamp: employer.updatedAt,
      detail: 'Company profile, fee structure and requirement checklist reviewed.',
    });

    if (employer.verification === 'Verified') {
      entries.push({
        id: `act-verified-${employer.id}`,
        user: 'Maria Santos',
        userInitials: users['Maria Santos'],
        action: 'verified employer documents',
        actionType: 'verified',
        employerId: employer.id,
        employerName: employer.companyName,
        timestamp: employer.verificationUpdatedAt,
        detail: 'Verification workflow completed through to employer approval.',
      });
    }

    if (employer.verification === 'Rejected' || employer.verification === 'Requires Revision') {
      entries.push({
        id: `act-rejected-${employer.id}`,
        user: 'Johsua Rivera',
        userInitials: users['Johsua Rivera'],
        action: 'returned employer for revision',
        actionType: 'rejected',
        employerId: employer.id,
        employerName: employer.companyName,
        timestamp: employer.verificationUpdatedAt,
        detail: 'Verification findings issued to the employer for correction.',
      });
    }
  });

  requirements
    .filter((req) => !req.completed && req.mandatory)
    .slice(0, 12)
    .forEach((req, index) => {
      const employer = employers.find((e) => e.id === req.employerId);
      if (!employer) return;
      entries.push({
        id: `act-req-${req.id}`,
        user: index % 2 === 0 ? 'Johsua Rivera' : 'Angelo Cruz',
        userInitials: index % 2 === 0 ? users['Johsua Rivera'] : users['Angelo Cruz'],
        action: 'flagged a missing requirement',
        actionType: 'status-changed',
        employerId: employer.id,
        employerName: employer.companyName,
        timestamp: isoOffset(-5 - index, 3),
        detail: `"${req.label}" marked as ${req.status}.`,
      });
    });

  documents
    .filter((doc) => doc.status !== 'Verified')
    .slice(0, 10)
    .forEach((doc, index) => {
      const employer = employers.find((e) => e.id === doc.employerId);
      if (!employer) return;
      entries.push({
        id: `act-doc-${doc.id}`,
        user: doc.uploadedBy,
        userInitials: users[doc.uploadedBy] ?? 'SY',
        action: doc.status === 'Pending Review' ? 'uploaded a document' : `marked a document as ${doc.status.toLowerCase()}`,
        actionType: doc.status === 'Pending Review' ? 'uploaded' : 'status-changed',
        employerId: employer.id,
        employerName: employer.companyName,
        timestamp: doc.uploadedAt,
        detail: `${doc.name} (${doc.type}).`,
      });
    });

  shortlist.forEach((entry) => {
    const employer = employers.find((e) => e.id === entry.employerId);
    if (!employer) return;
    entries.push({
      id: `act-shortlist-${entry.employerId}`,
      user: entry.addedBy,
      userInitials: users[entry.addedBy] ?? 'SY',
      action: 'added employer to shortlist',
      actionType: 'shortlisted',
      employerId: employer.id,
      employerName: employer.companyName,
      timestamp: entry.addedAt,
      detail: entry.note || 'Employer added to the evaluation shortlist.',
    });
  });

  entries.push({
    id: 'act-export-1',
    user: 'Angelo Cruz',
    userInitials: users['Angelo Cruz'],
    action: 'exported the employer portfolio report',
    actionType: 'exported',
    employerId: null,
    employerName: 'All employers',
    timestamp: isoOffset(-2, 6),
    detail: 'CSV export covering 12 employers across 10 destination countries.',
  });

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/* ------------------------------------------------------------------ */
/* Filter presets                                                      */
/* ------------------------------------------------------------------ */

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'preset-high-salary',
    name: 'High Salary Employers',
    description: 'Monthly salary of ₱50,000 and above',
    system: true,
    createdAt: isoOffset(-120),
    lastUsedAt: isoOffset(-2, 3),
    useCount: 34,
    filters: { ...EMPTY_FILTERS, salaryMin: 50000, sortBy: 'salary-desc' },
  },
  {
    id: 'preset-low-cost',
    name: 'Low Cost Employers',
    description: 'Processing fee below ₱50,000',
    system: true,
    createdAt: isoOffset(-120),
    lastUsedAt: isoOffset(-5, 2),
    useCount: 21,
    filters: { ...EMPTY_FILTERS, processingFeeMax: 50000, sortBy: 'fee-asc' },
  },
  {
    id: 'preset-japan',
    name: 'Japan Opportunities',
    description: 'All employers based in Japan',
    system: true,
    createdAt: isoOffset(-118),
    lastUsedAt: isoOffset(-1, 4),
    useCount: 47,
    filters: { ...EMPTY_FILTERS, country: ['Japan'] },
  },
  {
    id: 'preset-complete',
    name: 'Complete Employers',
    description: 'Requirement checklist at 100%',
    system: true,
    createdAt: isoOffset(-96),
    lastUsedAt: isoOffset(-9, 1),
    useCount: 12,
    filters: { ...EMPTY_FILTERS, requirementStatus: ['Complete'] },
  },
  {
    id: 'preset-expiring',
    name: 'Expiring Contracts',
    description: 'Contract expiring within the next 30 days',
    system: true,
    createdAt: isoOffset(-90),
    lastUsedAt: isoOffset(-3, 7),
    useCount: 28,
    filters: { ...EMPTY_FILTERS, contractStatus: ['Expiring Soon'], sortBy: 'contract-expiry-asc' },
  },
  {
    id: 'preset-free-accommodation',
    name: 'Free Accommodation',
    description: 'Employers providing accommodation at no cost',
    system: true,
    createdAt: isoOffset(-84),
    lastUsedAt: isoOffset(-7, 5),
    useCount: 19,
    filters: { ...EMPTY_FILTERS, accommodation: ['Provided'] },
  },
  {
    id: 'preset-verified-fast',
    name: 'Verified & Deployment Ready',
    description: 'Verified employers with a fully complete checklist',
    system: false,
    createdAt: isoOffset(-40),
    lastUsedAt: isoOffset(-4, 6),
    useCount: 8,
    filters: {
      ...EMPTY_FILTERS,
      verification: ['Verified'],
      requirementStatus: ['Complete'],
      employerStatus: ['Active'],
    },
  },
];

export const SHORTLIST_SEED: ShortlistEntry[] = [
  {
    employerId: 'emp-001',
    note: 'Preferred for the next batch — strong dormitory setup and consistent overtime hours.',
    addedAt: isoOffset(-12, 4),
    addedBy: 'Johsua Rivera',
  },
  {
    employerId: 'emp-007',
    note: 'Highest salary band in the portfolio. Nursing candidates should be prioritised here.',
    addedAt: isoOffset(-9, 2),
    addedBy: 'Angelo Cruz',
  },
  {
    employerId: 'emp-003',
    note: 'Repeat client with zero placement disputes across three batches.',
    addedAt: isoOffset(-6, 8),
    addedBy: 'Maria Santos',
  },
];

/* ------------------------------------------------------------------ */
/* Assembled dataset                                                   */
/* ------------------------------------------------------------------ */

function assemble() {
  const employers = EMPLOYER_SEEDS.map(buildEmployer);
  const jobs = EMPLOYER_SEEDS.flatMap(buildJobs);
  const contracts = EMPLOYER_SEEDS.map((seed, index) => buildContract(seed, jobs.filter((j) => j.employerId === seed.id)[0] ?? jobs[index]));
  const fees = EMPLOYER_SEEDS.flatMap(buildFees);
  const requirements = EMPLOYER_SEEDS.flatMap(buildRequirements);
  const documents = EMPLOYER_SEEDS.flatMap(buildDocuments);
  const notes = EMPLOYER_SEEDS.flatMap(buildNotes);
  const verificationEvents = EMPLOYER_SEEDS.flatMap(buildVerificationEvents);

  return {
    employers,
    jobs,
    contracts,
    fees,
    requirements,
    documents,
    notes,
    verificationEvents,
    shortlist: SHORTLIST_SEED,
    presets: FILTER_PRESETS,
    notifications: buildNotifications(employers, contracts, documents, requirements),
    activity: buildActivity(employers, requirements, documents, SHORTLIST_SEED),
  };
}

export const DATASET = assemble();

export const CURRENT_USER = {
  name: 'Johsua Rivera',
  initials: 'JR',
  role: 'Senior Placement Officer',
  email: 'j.rivera@efms.example.ph',
};

export const TEAM_MEMBERS = [
  { name: 'Johsua Rivera', initials: 'JR', role: 'Senior Placement Officer' },
  { name: 'Maria Santos', initials: 'MS', role: 'Compliance & Verification Lead' },
  { name: 'Angelo Cruz', initials: 'AC', role: 'Employer Relations Officer' },
  { name: 'Ella Mendoza', initials: 'EM', role: 'Documentation Specialist' },
];
