import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  ActivityActionType,
  ActivityLogEntry,
  AppSettings,
  Contract,
  Density,
  DocumentRecord,
  DocumentStatus,
  Employer,
  EmployerDraft,
  EmployerRecord,
  EmployerStatus,
  FeeItem,
  FilterPreset,
  FilterState,
  JobOrder,
  Note,
  NotificationItem,
  RequirementItem,
  ShortlistEntry,
  ToastMessage,
  VerificationEvent,
  VerificationStatus,
} from '@/types';
import { DATASET, CURRENT_USER } from '@/data/dataset';
import { COUNTRY_CODE, CURRENCIES, FEE_TYPES, REQUIREMENT_TEMPLATE } from '@/lib/constants';
import { buildEmployerRecords } from '@/lib/selectors';
import { normalizeFilters } from '@/lib/filters';
import { applyAccentTheme } from '@/lib/theme';
import { MAX_COMPARISON } from '@/types';
import { isoOffset, uid } from '@/lib/utils';

const STORAGE_KEY = 'efms.state.v1';

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

export const DEFAULT_SETTINGS: AppSettings = {
  density: 'comfortable',
  accent: 'levelup',
  theme: 'light',
  viewMode: 'table',
  rowsPerPage: 10,
  landingPage: '/dashboard',
  currencyDisplay: 'both',
  showArchived: false,
  defaultCountry: '',
  defaultEmployerStatus: '',
  notificationPrefs: {
    Contract: true,
    Document: true,
    Verification: true,
    Fee: true,
    Requirement: true,
    Employer: false,
    System: true,
  },
};

export const DEFAULT_EMPLOYER_COLUMNS = [
  'company',
  'country',
  'industry',
  'positions',
  'salary',
  'contract',
  'fees',
  'requirements',
  'verification',
  'status',
  'updated',
];

/* ------------------------------------------------------------------ */
/* Persisted shape                                                     */
/* ------------------------------------------------------------------ */

interface PersistedState {
  employers: Employer[];
  jobs: JobOrder[];
  contracts: Contract[];
  fees: FeeItem[];
  requirements: RequirementItem[];
  documents: DocumentRecord[];
  notes: Note[];
  verificationEvents: VerificationEvent[];
  shortlist: ShortlistEntry[];
  presets: FilterPreset[];
  notifications: NotificationItem[];
  activity: ActivityLogEntry[];
  settings: AppSettings;
  employerColumns: string[];
  savedFilters: FilterState | null;
  /** Employer ids pinned for side-by-side evaluation. */
  comparison: string[];
  /**
   * Bumped whenever the house palette changes. A payload written by an older
   * build has its accent reset to the current default on load, so a returning
   * visitor sees the new branding instead of their stale saved accent — while
   * keeping every record, note and shortlist entry they had.
   */
  brandingVersion: number;
}

/** Increment when the default accent/theme changes. */
const BRANDING_VERSION = 2;

/** Seeded so the comparison workspace demonstrates itself on first run. */
const COMPARISON_SEED = ['emp-001', 'emp-003', 'emp-007'];

function initialState(): PersistedState {
  return {
    employers: DATASET.employers,
    jobs: DATASET.jobs,
    contracts: DATASET.contracts,
    fees: DATASET.fees,
    requirements: DATASET.requirements,
    documents: DATASET.documents,
    notes: DATASET.notes,
    verificationEvents: DATASET.verificationEvents,
    shortlist: DATASET.shortlist,
    presets: DATASET.presets,
    notifications: DATASET.notifications,
    activity: DATASET.activity,
    settings: DEFAULT_SETTINGS,
    employerColumns: DEFAULT_EMPLOYER_COLUMNS,
    savedFilters: null,
    comparison: COMPARISON_SEED,
    brandingVersion: BRANDING_VERSION,
  };
}

function loadState(): PersistedState {
  if (typeof window === 'undefined') return initialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const base = initialState();
    /* A payload from before the current branding keeps its data but adopts the
       new house accent, so the palette change is visible on first reload. */
    const staleBranding = (parsed.brandingVersion ?? 0) < BRANDING_VERSION;
    return {
      ...base,
      ...parsed,
      settings: {
        ...base.settings,
        ...(parsed.settings ?? {}),
        ...(staleBranding ? { accent: base.settings.accent } : {}),
      },
      brandingVersion: BRANDING_VERSION,
      employerColumns: parsed.employerColumns?.length ? parsed.employerColumns : base.employerColumns,
      savedFilters: parsed.savedFilters ? normalizeFilters(parsed.savedFilters) : null,
      comparison: Array.isArray(parsed.comparison)
        ? parsed.comparison.filter((id) => typeof id === 'string').slice(0, MAX_COMPARISON)
        : base.comparison,
    };
  } catch {
    return initialState();
  }
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

interface AppStoreValue {
  /* Raw collections */
  employers: Employer[];
  jobs: JobOrder[];
  contracts: Contract[];
  fees: FeeItem[];
  requirements: RequirementItem[];
  documents: DocumentRecord[];
  notes: Note[];
  shortlist: ShortlistEntry[];
  presets: FilterPreset[];
  notifications: NotificationItem[];
  activity: ActivityLogEntry[];
  settings: AppSettings;
  employerColumns: string[];
  savedFilters: FilterState | null;
  comparison: string[];

  /* Derived */
  records: EmployerRecord[];
  unreadCount: number;
  shortlistedIds: string[];
  comparisonRecords: EmployerRecord[];

  /* Employers */
  createEmployer: (draft: EmployerDraft) => Employer;
  saveEmployer: (id: string, draft: EmployerDraft) => void;
  updateEmployer: (id: string, patch: Partial<Employer>) => void;
  setEmployerStatus: (id: string, status: EmployerStatus) => void;
  setVerification: (id: string, status: VerificationStatus, stage: number) => void;
  advanceVerification: (id: string) => void;
  archiveEmployer: (id: string) => void;
  restoreEmployer: (id: string) => void;
  deleteEmployer: (id: string) => void;

  /* Shortlist */
  toggleShortlist: (id: string) => void;
  isShortlisted: (id: string) => boolean;
  updateShortlistNote: (id: string, note: string) => void;

  /* Comparison */
  isComparing: (id: string) => boolean;
  toggleComparison: (id: string) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;

  /* Fees */
  updateFee: (feeId: string, patch: Partial<FeeItem>) => void;
  addFee: (employerId: string, fee: Omit<FeeItem, 'id' | 'employerId'>) => void;
  removeFee: (feeId: string) => void;

  /* Requirements */
  toggleRequirement: (requirementId: string) => void;
  setRequirementStatus: (requirementId: string, status: RequirementItem['status']) => void;

  /* Documents */
  addDocument: (employerId: string, doc: Omit<DocumentRecord, 'id' | 'employerId'>) => void;
  updateDocument: (docId: string, patch: Partial<DocumentRecord>) => void;
  setDocumentStatus: (docId: string, status: DocumentStatus) => void;
  removeDocument: (docId: string) => void;

  /* Notes */
  addNote: (employerId: string, body: string, pinned?: boolean) => void;
  deleteNote: (noteId: string) => void;

  /* Presets */
  savePreset: (name: string, description: string, filters: FilterState) => void;
  renamePreset: (id: string, name: string, description: string) => void;
  deletePreset: (id: string) => void;
  markPresetUsed: (id: string) => void;

  /* Notifications */
  markNotificationRead: (id: string, read?: boolean) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;

  /* Filters persistence */
  persistFilters: (filters: FilterState | null) => void;

  /* Settings */
  updateSettings: (patch: Partial<AppSettings>) => void;
  setEmployerColumns: (columns: string[]) => void;

  /* Activity */
  logActivity: (entry: {
    action: string;
    actionType: ActivityActionType;
    employerId?: string | null;
    employerName?: string;
    detail?: string;
    user?: string;
  }) => void;

  /* Toasts */
  toasts: ToastMessage[];
  toast: (message: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  /* Maintenance */
  resetDemoData: () => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

const USER_INITIALS: Record<string, string> = {
  'Johsua Rivera': 'JR',
  'Maria Santos': 'MS',
  'Angelo Cruz': 'AC',
  'Ella Mendoza': 'EM',
};

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadState);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /* Persist — cheap enough at this data size to write on every mutation. */
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Quota exceeded or private mode — the app keeps working in memory. */
    }
  }, [state]);

  /* Theme is applied to the document root, not the React tree: the accent ramp
     is written as inline custom properties and dark mode toggles a root class. */
  useEffect(() => {
    const dark = state.settings.theme === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    applyAccentTheme(state.settings.accent, dark);
  }, [state.settings.accent, state.settings.theme]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback(
    (message: Omit<ToastMessage, 'id'>) => {
      const id = uid('toast');
      setToasts((current) => [...current.slice(-3), { ...message, id }]);
      timers.current[id] = setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast],
  );

  useEffect(
    () => () => {
      Object.values(timers.current).forEach(clearTimeout);
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /* Derived                                                           */
  /* ---------------------------------------------------------------- */

  const records = useMemo(
    () =>
      buildEmployerRecords({
        employers: state.employers,
        jobs: state.jobs,
        contracts: state.contracts,
        fees: state.fees,
        requirements: state.requirements,
        documents: state.documents,
        notes: state.notes,
        verificationEvents: state.verificationEvents,
      }),
    [
      state.employers,
      state.jobs,
      state.contracts,
      state.fees,
      state.requirements,
      state.documents,
      state.notes,
      state.verificationEvents,
    ],
  );

  const unreadCount = useMemo(
    () => state.notifications.filter((item) => !item.read).length,
    [state.notifications],
  );

  const shortlistedIds = useMemo(
    () => state.shortlist.map((entry) => entry.employerId),
    [state.shortlist],
  );

  const comparisonRecords = useMemo(
    () =>
      state.comparison
        .map((id) => records.find((record) => record.employer.id === id))
        .filter((record): record is EmployerRecord => Boolean(record)),
    [state.comparison, records],
  );

  /* ---------------------------------------------------------------- */
  /* Activity helper                                                   */
  /* ---------------------------------------------------------------- */

  const logActivity = useCallback<AppStoreValue['logActivity']>((entry) => {
    const user = entry.user ?? CURRENT_USER.name;
    setState((current) => ({
      ...current,
      activity: [
        {
          id: uid('act'),
          user,
          userInitials: USER_INITIALS[user] ?? 'SY',
          action: entry.action,
          actionType: entry.actionType,
          employerId: entry.employerId ?? null,
          employerName: entry.employerName ?? '—',
          timestamp: isoOffset(0, 0),
          detail: entry.detail,
        },
        ...current.activity,
      ].slice(0, 400),
    }));
  }, []);

  const employerNameOf = useCallback(
    (id: string) => state.employers.find((e) => e.id === id)?.companyName ?? '—',
    [state.employers],
  );

  /* ---------------------------------------------------------------- */
  /* Employer actions                                                  */
  /* ---------------------------------------------------------------- */

  /**
   * Expands a registration draft into the employer's dependent collections.
   *
   * A staff member registers an employer *and* their first job order, fee
   * schedule and benefit package in a single pass, so the store — not the form
   * component — owns the rules that turn one draft into five records. Both
   * `createEmployer` and `saveEmployer` go through here, which keeps the two
   * paths from drifting apart.
   */
  const expandDraft = useCallback((draft: EmployerDraft, employerId: string) => {
    const now = isoOffset(0, 0);
    const year = new Date(now).getFullYear();
    const suffix = employerId.slice(-4).toUpperCase();
    const rate = CURRENCIES[draft.currency]?.rateToPhp ?? 1;
    const toPhp = (amount: number) => Math.round(amount * rate);

    const job: JobOrder = {
      id: `${employerId}-job-1`,
      employerId,
      reference: `JO-${year}-${suffix}`,
      position: draft.position,
      jobCategory: draft.jobCategory,
      workersNeeded: draft.workersNeeded,
      workersDeployed: 0,
      salaryMinLocal: draft.salaryMinLocal,
      salaryMaxLocal: draft.salaryMaxLocal,
      currency: draft.currency,
      salaryMinPhp: toPhp(draft.salaryMinLocal),
      salaryMaxPhp: toPhp(draft.salaryMaxLocal),
      workingHours: draft.workingHours,
      overtime: draft.overtime,
      contractDurationMonths: draft.contractDurationMonths,
      employmentType: draft.employmentType,
      benefits: draft.benefits,
      requirements: [],
      status: 'Open',
      postedAt: now,
    };

    const contract: Contract = {
      id: `${employerId}-contract`,
      employerId,
      contractNumber: `CT-${year}-${suffix}`,
      jobOrderId: job.id,
      startDate: isoOffset(0),
      endDate: isoOffset(draft.contractDurationMonths * 30),
      durationMonths: draft.contractDurationMonths,
      salaryMinLocal: draft.salaryMinLocal,
      salaryMaxLocal: draft.salaryMaxLocal,
      currency: draft.currency,
      workingConditions: `${draft.workingHours}; overtime ${draft.overtime.toLowerCase()}.`,
      renewalStatus: 'Not Started',
      status: 'Draft',
      signedAt: null,
      notes: 'Generated from the employer registration form.',
    };

    const fees: FeeItem[] = FEE_TYPES.map((type) => ({
      id: `${employerId}-fee-${type.toLowerCase().replace(/[^a-z]+/g, '-')}`,
      employerId,
      type,
      amount: draft.fees[type] ?? 0,
      currency: 'PHP',
      borneBy: type === 'Insurance' ? 'Employer' : 'Worker',
      paymentStatus: 'Pending',
      dueDate: null,
      notes: '',
    }));

    const requirements: RequirementItem[] = REQUIREMENT_TEMPLATE.map((template) => ({
      id: `${employerId}-req-${template.key}`,
      employerId,
      key: template.key,
      label: template.label,
      description: template.description,
      completed: false,
      status: template.mandatory ? 'Missing Documents' : 'Incomplete',
      mandatory: template.mandatory,
      updatedAt: now,
    }));

    return { job, contract, fees, requirements };
  }, []);

  const buildEmployerFromDraft = useCallback(
    (id: string, draft: EmployerDraft): Employer => {
      const now = isoOffset(0, 0);
      return {
        id,
        companyName: draft.companyName,
        legalName: draft.legalName || draft.companyName,
        logoInitials: draft.companyName
          .split(/\s+/)
          .slice(0, 2)
          .map((word) => word[0]?.toUpperCase() ?? '')
          .join(''),
        logoHue: Math.floor(Math.random() * 360),
        registrationNumber: draft.registrationNumber || 'PENDING',
        country: draft.country,
        countryCode: COUNTRY_CODE[draft.country] ?? 'XX',
        city: draft.city,
        address: draft.address,
        industry: draft.industry,
        companySize: draft.companySize,
        website: draft.website,
        contactPerson: draft.contactPerson,
        contactRole: draft.contactRole,
        email: draft.email,
        phone: draft.phone,
        yearsOperating: 0,
        status: draft.status,
        verification: draft.verification,
        verificationStage: draft.verification === 'Verified' ? 4 : 0,
        verificationUpdatedAt: now,
        description: draft.description,
        createdAt: now,
        updatedAt: now,
        updatedBy: CURRENT_USER.name,
      };
    },
    [],
  );

  const createEmployer = useCallback<AppStoreValue['createEmployer']>(
    (draft) => {
      const id = uid('emp');
      const now = isoOffset(0, 0);
      const employer = buildEmployerFromDraft(id, draft);
      const { job, contract, fees, requirements } = expandDraft(draft, id);

      setState((current) => ({
        ...current,
        employers: [employer, ...current.employers],
        jobs: [...current.jobs, job],
        contracts: [...current.contracts, contract],
        fees: [...current.fees, ...fees],
        requirements: [...current.requirements, ...requirements],
        notifications: [
          {
            id: uid('ntf'),
            category: 'Employer',
            title: 'New employer added',
            message: `${employer.companyName} (${employer.country}) was added to the employer database.`,
            employerId: employer.id,
            createdAt: now,
            read: false,
            severity: 'info',
          },
          ...current.notifications,
        ],
        activity: [
          {
            id: uid('act'),
            user: CURRENT_USER.name,
            userInitials: CURRENT_USER.initials,
            action: 'added a new employer',
            actionType: 'created',
            employerId: employer.id,
            employerName: employer.companyName,
            timestamp: now,
            detail: `${employer.companyName} (${employer.country}) registered with a ${draft.contractDurationMonths}-month contract.`,
          },
          ...current.activity,
        ],
      }));

      return employer;
    },
    [buildEmployerFromDraft, expandDraft],
  );

  const saveEmployer = useCallback<AppStoreValue['saveEmployer']>(
    (id, draft) => {
      const existingJob = state.jobs.find((job) => job.employerId === id);
      const generated = expandDraft(draft, id);
      const now = isoOffset(0, 0);

      setState((current) => {
        const employer = current.employers.find((item) => item.id === id);
        if (!employer) return current;

        const updatedEmployer: Employer = {
          ...employer,
          companyName: draft.companyName,
          legalName: draft.legalName || draft.companyName,
          registrationNumber: draft.registrationNumber || employer.registrationNumber,
          country: draft.country,
          countryCode: COUNTRY_CODE[draft.country] ?? employer.countryCode,
          city: draft.city,
          address: draft.address,
          industry: draft.industry,
          companySize: draft.companySize,
          website: draft.website,
          contactPerson: draft.contactPerson,
          contactRole: draft.contactRole,
          email: draft.email,
          phone: draft.phone,
          status: draft.status,
          verification: draft.verification,
          verificationStage:
            draft.verification === 'Verified' ? 4 : employer.verificationStage,
          verificationUpdatedAt:
            draft.verification === employer.verification ? employer.verificationUpdatedAt : now,
          description: draft.description,
          updatedAt: now,
          updatedBy: CURRENT_USER.name,
        };

        const job: JobOrder = existingJob
          ? {
              ...existingJob,
              position: generated.job.position,
              jobCategory: generated.job.jobCategory,
              workersNeeded: generated.job.workersNeeded,
              salaryMinLocal: generated.job.salaryMinLocal,
              salaryMaxLocal: generated.job.salaryMaxLocal,
              currency: generated.job.currency,
              salaryMinPhp: generated.job.salaryMinPhp,
              salaryMaxPhp: generated.job.salaryMaxPhp,
              workingHours: generated.job.workingHours,
              overtime: generated.job.overtime,
              contractDurationMonths: generated.job.contractDurationMonths,
              employmentType: generated.job.employmentType,
              benefits: generated.job.benefits,
            }
          : generated.job;

        const existingContract = current.contracts.find((item) => item.employerId === id);
        const contract: Contract | null = existingContract
          ? {
              ...existingContract,
              durationMonths: generated.contract.durationMonths,
              salaryMinLocal: generated.contract.salaryMinLocal,
              salaryMaxLocal: generated.contract.salaryMaxLocal,
              currency: generated.contract.currency,
              workingConditions: generated.contract.workingConditions,
              endDate:
                existingContract.status === 'Draft'
                  ? generated.contract.endDate
                  : existingContract.endDate,
            }
          : generated.contract;

        return {
          ...current,
          employers: current.employers.map((item) => (item.id === id ? updatedEmployer : item)),
          jobs: existingJob
            ? current.jobs.map((item) => (item.id === existingJob.id ? job : item))
            : [...current.jobs, job],
          contracts: existingContract
            ? current.contracts.map((item) => (item.id === existingContract.id ? (contract as Contract) : item))
            : [...current.contracts, generated.contract],
          fees: [
            ...current.fees.filter((fee) => fee.employerId !== id),
            ...generated.fees,
          ],
          activity: [
            {
              id: uid('act'),
              user: CURRENT_USER.name,
              userInitials: CURRENT_USER.initials,
              action: 'updated employer information',
              actionType: 'updated',
              employerId: id,
              employerName: updatedEmployer.companyName,
              timestamp: now,
              detail: 'Company profile, job order, fee schedule and benefits updated.',
            },
            ...current.activity,
          ],
        };
      });
    },
    [expandDraft, state.jobs],
  );

  const updateEmployer = useCallback<AppStoreValue['updateEmployer']>((id, patch) => {
    setState((current) => ({
      ...current,
      employers: current.employers.map((employer) =>
        employer.id === id
          ? { ...employer, ...patch, updatedAt: isoOffset(0, 0), updatedBy: CURRENT_USER.name }
          : employer,
      ),
      activity: [
        {
          id: uid('act'),
          user: CURRENT_USER.name,
          userInitials: CURRENT_USER.initials,
          action: 'updated employer information',
          actionType: 'updated',
          employerId: id,
          employerName: current.employers.find((e) => e.id === id)?.companyName ?? '—',
          timestamp: isoOffset(0, 0),
          detail: `Updated fields: ${Object.keys(patch).join(', ')}.`,
        },
        ...current.activity,
      ],
    }));
  }, []);

  const setEmployerStatus = useCallback<AppStoreValue['setEmployerStatus']>((id, status) => {
    setState((current) => ({
      ...current,
      employers: current.employers.map((employer) =>
        employer.id === id
          ? { ...employer, status, updatedAt: isoOffset(0, 0), updatedBy: CURRENT_USER.name }
          : employer,
      ),
      activity: [
        {
          id: uid('act'),
          user: CURRENT_USER.name,
          userInitials: CURRENT_USER.initials,
          action: `changed employer status to ${status}`,
          actionType: 'status-changed',
          employerId: id,
          employerName: current.employers.find((e) => e.id === id)?.companyName ?? '—',
          timestamp: isoOffset(0, 0),
        },
        ...current.activity,
      ],
    }));
  }, []);

  const setVerification = useCallback<AppStoreValue['setVerification']>((id, status, stage) => {
    setState((current) => ({
      ...current,
      employers: current.employers.map((employer) =>
        employer.id === id
          ? {
              ...employer,
              verification: status,
              verificationStage: stage,
              verificationUpdatedAt: isoOffset(0, 0),
              updatedAt: isoOffset(0, 0),
              updatedBy: CURRENT_USER.name,
            }
          : employer,
      ),
      activity: [
        {
          id: uid('act'),
          user: CURRENT_USER.name,
          userInitials: CURRENT_USER.initials,
          action: `set verification outcome to ${status}`,
          actionType: status === 'Verified' ? 'verified' : status === 'Rejected' ? 'rejected' : 'status-changed',
          employerId: id,
          employerName: current.employers.find((e) => e.id === id)?.companyName ?? '—',
          timestamp: isoOffset(0, 0),
          detail: `Verification workflow moved to stage ${stage + 1}.`,
        },
        ...current.activity,
      ],
    }));
  }, []);

  const advanceVerification = useCallback<AppStoreValue['advanceVerification']>(
    (id) => {
      const employer = state.employers.find((e) => e.id === id);
      if (!employer) return;
      const nextStage = Math.min(employer.verificationStage + 1, 4);
      const verified = nextStage === 4;
      setVerification(id, verified ? 'Verified' : 'Under Review', nextStage);
      toast({
        title: verified ? 'Employer verified' : `Advanced to stage ${nextStage + 1}`,
        description: verified
          ? `${employer.companyName} has completed the verification workflow.`
          : `${employer.companyName} moved forward in the verification workflow.`,
        variant: 'success',
      });
    },
    [state.employers, setVerification, toast],
  );

  const archiveEmployer = useCallback<AppStoreValue['archiveEmployer']>(
    (id) => {
      setEmployerStatus(id, 'Archived');
      toast({
        title: 'Employer archived',
        description: `${employerNameOf(id)} has been archived and hidden from active views.`,
        variant: 'info',
      });
    },
    [setEmployerStatus, toast, employerNameOf],
  );

  const restoreEmployer = useCallback<AppStoreValue['restoreEmployer']>(
    (id) => {
      setEmployerStatus(id, 'Active');
      toast({ title: 'Employer restored', description: `${employerNameOf(id)} is active again.`, variant: 'success' });
    },
    [setEmployerStatus, toast, employerNameOf],
  );

  const deleteEmployer = useCallback<AppStoreValue['deleteEmployer']>((id) => {
    setState((current) => ({
      ...current,
      employers: current.employers.filter((e) => e.id !== id),
      jobs: current.jobs.filter((j) => j.employerId !== id),
      contracts: current.contracts.filter((c) => c.employerId !== id),
      fees: current.fees.filter((f) => f.employerId !== id),
      requirements: current.requirements.filter((r) => r.employerId !== id),
      documents: current.documents.filter((d) => d.employerId !== id),
      notes: current.notes.filter((n) => n.employerId !== id),
      verificationEvents: current.verificationEvents.filter((v) => v.employerId !== id),
      shortlist: current.shortlist.filter((s) => s.employerId !== id),
      comparison: current.comparison.filter((entry) => entry !== id),
    }));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Shortlist                                                         */
  /* ---------------------------------------------------------------- */

  const isShortlisted = useCallback(
    (id: string) => state.shortlist.some((entry) => entry.employerId === id),
    [state.shortlist],
  );

  const toggleShortlist = useCallback<AppStoreValue['toggleShortlist']>(
    (id) => {
      const exists = state.shortlist.some((entry) => entry.employerId === id);
      const name = employerNameOf(id);

      setState((current) => ({
        ...current,
        shortlist: exists
          ? current.shortlist.filter((entry) => entry.employerId !== id)
          : [
              { employerId: id, note: '', addedAt: isoOffset(0, 0), addedBy: CURRENT_USER.name },
              ...current.shortlist,
            ],
        activity: [
          {
            id: uid('act'),
            user: CURRENT_USER.name,
            userInitials: CURRENT_USER.initials,
            action: exists ? 'removed employer from shortlist' : 'added employer to shortlist',
            actionType: exists ? 'removed' : 'shortlisted',
            employerId: id,
            employerName: name,
            timestamp: isoOffset(0, 0),
          },
          ...current.activity,
        ],
      }));

      toast({
        title: exists ? 'Removed from shortlist' : 'Added to shortlist',
        description: name,
        variant: exists ? 'info' : 'success',
      });
    },
    [state.shortlist, toast, employerNameOf],
  );

  const updateShortlistNote = useCallback<AppStoreValue['updateShortlistNote']>((id, note) => {
    setState((current) => ({
      ...current,
      shortlist: current.shortlist.map((entry) =>
        entry.employerId === id ? { ...entry, note } : entry,
      ),
    }));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Comparison                                                        */
  /* ---------------------------------------------------------------- */

  const isComparing = useCallback(
    (id: string) => state.comparison.includes(id),
    [state.comparison],
  );

  const toggleComparison = useCallback<AppStoreValue['toggleComparison']>(
    (id) => {
      const exists = state.comparison.includes(id);
      const name = employerNameOf(id);

      if (!exists && state.comparison.length >= MAX_COMPARISON) {
        toast({
          title: `Comparison is full (${MAX_COMPARISON})`,
          description: 'Remove an employer before adding another.',
          variant: 'warning',
        });
        return;
      }

      setState((current) => ({
        ...current,
        comparison: exists
          ? current.comparison.filter((entry) => entry !== id)
          : [...current.comparison, id],
      }));

      toast({
        title: exists ? 'Removed from comparison' : 'Added to comparison',
        description: name,
        variant: exists ? 'info' : 'success',
      });
    },
    [state.comparison, toast, employerNameOf],
  );

  const removeFromComparison = useCallback<AppStoreValue['removeFromComparison']>((id) => {
    setState((current) => ({ ...current, comparison: current.comparison.filter((entry) => entry !== id) }));
  }, []);

  const clearComparison = useCallback(() => {
    setState((current) => ({ ...current, comparison: [] }));
    toast({ title: 'Comparison cleared', variant: 'info' });
  }, [toast]);

  /* ---------------------------------------------------------------- */
  /* Fees                                                              */
  /* ---------------------------------------------------------------- */

  const updateFee = useCallback<AppStoreValue['updateFee']>(
    (feeId, patch) => {
      const fee = state.fees.find((f) => f.id === feeId);
      setState((current) => ({
        ...current,
        fees: current.fees.map((item) => (item.id === feeId ? { ...item, ...patch } : item)),
        activity: fee
          ? [
              {
                id: uid('act'),
                user: CURRENT_USER.name,
                userInitials: CURRENT_USER.initials,
                action: 'updated fee information',
                actionType: 'updated',
                employerId: fee.employerId,
                employerName: current.employers.find((e) => e.id === fee.employerId)?.companyName ?? '—',
                timestamp: isoOffset(0, 0),
                detail: `${fee.type} updated.`,
              },
              ...current.activity,
            ]
          : current.activity,
      }));
    },
    [state.fees],
  );

  const addFee = useCallback<AppStoreValue['addFee']>((employerId, fee) => {
    setState((current) => ({
      ...current,
      fees: [...current.fees, { ...fee, id: uid('fee'), employerId }],
    }));
  }, []);

  const removeFee = useCallback<AppStoreValue['removeFee']>((feeId) => {
    setState((current) => ({ ...current, fees: current.fees.filter((f) => f.id !== feeId) }));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Requirements                                                      */
  /* ---------------------------------------------------------------- */

  const toggleRequirement = useCallback<AppStoreValue['toggleRequirement']>((requirementId) => {
    setState((current) => {
      const target = current.requirements.find((r) => r.id === requirementId);
      if (!target) return current;
      const completed = !target.completed;
      const status: RequirementItem['status'] = completed
        ? 'Complete'
        : target.mandatory
          ? 'Missing Documents'
          : 'Incomplete';

      return {
        ...current,
        requirements: current.requirements.map((item) =>
          item.id === requirementId ? { ...item, completed, status, updatedAt: isoOffset(0, 0) } : item,
        ),
        activity: [
          {
            id: uid('act'),
            user: CURRENT_USER.name,
            userInitials: CURRENT_USER.initials,
            action: completed ? 'completed a requirement' : 'reopened a requirement',
            actionType: 'updated',
            employerId: target.employerId,
            employerName: current.employers.find((e) => e.id === target.employerId)?.companyName ?? '—',
            timestamp: isoOffset(0, 0),
            detail: `"${target.label}" marked as ${status}.`,
          },
          ...current.activity,
        ],
      };
    });
  }, []);

  const setRequirementStatus = useCallback<AppStoreValue['setRequirementStatus']>((requirementId, status) => {
    setState((current) => ({
      ...current,
      requirements: current.requirements.map((item) =>
        item.id === requirementId
          ? { ...item, status, completed: status === 'Complete', updatedAt: isoOffset(0, 0) }
          : item,
      ),
    }));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Documents                                                         */
  /* ---------------------------------------------------------------- */

  const addDocument = useCallback<AppStoreValue['addDocument']>((employerId, doc) => {
    setState((current) => ({
      ...current,
      documents: [{ ...doc, id: uid('doc'), employerId }, ...current.documents],
      activity: [
        {
          id: uid('act'),
          user: CURRENT_USER.name,
          userInitials: CURRENT_USER.initials,
          action: 'uploaded a document',
          actionType: 'uploaded',
          employerId,
          employerName: current.employers.find((e) => e.id === employerId)?.companyName ?? '—',
          timestamp: isoOffset(0, 0),
          detail: `${doc.name} (${doc.type}).`,
        },
        ...current.activity,
      ],
    }));
  }, []);

  const updateDocument = useCallback<AppStoreValue['updateDocument']>((docId, patch) => {
    setState((current) => ({
      ...current,
      documents: current.documents.map((item) => (item.id === docId ? { ...item, ...patch } : item)),
      activity: [
        {
          id: uid('act'),
          user: CURRENT_USER.name,
          userInitials: CURRENT_USER.initials,
          action: 'updated a document record',
          actionType: 'updated',
          employerId: current.documents.find((d) => d.id === docId)?.employerId ?? null,
          employerName:
            current.employers.find(
              (e) => e.id === current.documents.find((d) => d.id === docId)?.employerId,
            )?.companyName ?? '—',
          timestamp: isoOffset(0, 0),
          detail: `Updated fields: ${Object.keys(patch).join(', ')}.`,
        },
        ...current.activity,
      ],
    }));
  }, []);

  const setDocumentStatus = useCallback<AppStoreValue['setDocumentStatus']>(
    (docId, status) => {
      const doc = state.documents.find((d) => d.id === docId);
      setState((current) => ({
        ...current,
        documents: current.documents.map((item) => (item.id === docId ? { ...item, status } : item)),
        activity: doc
          ? [
              {
                id: uid('act'),
                user: CURRENT_USER.name,
                userInitials: CURRENT_USER.initials,
                action: `marked a document as ${status.toLowerCase()}`,
                actionType: status === 'Verified' ? 'verified' : status === 'Rejected' ? 'rejected' : 'status-changed',
                employerId: doc.employerId,
                employerName: current.employers.find((e) => e.id === doc.employerId)?.companyName ?? '—',
                timestamp: isoOffset(0, 0),
                detail: doc.name,
              },
              ...current.activity,
            ]
          : current.activity,
      }));
    },
    [state.documents],
  );

  const removeDocument = useCallback<AppStoreValue['removeDocument']>((docId) => {
    setState((current) => ({ ...current, documents: current.documents.filter((d) => d.id !== docId) }));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Notes                                                             */
  /* ---------------------------------------------------------------- */

  const addNote = useCallback<AppStoreValue['addNote']>(
    (employerId, body, pinned = false) => {
      setState((current) => ({
        ...current,
        notes: [
          {
            id: uid('note'),
            employerId,
            author: CURRENT_USER.name,
            body,
            createdAt: isoOffset(0, 0),
            pinned,
          },
          ...current.notes,
        ],
        activity: [
          {
            id: uid('act'),
            user: CURRENT_USER.name,
            userInitials: CURRENT_USER.initials,
            action: 'added an internal note',
            actionType: 'updated',
            employerId,
            employerName: current.employers.find((e) => e.id === employerId)?.companyName ?? '—',
            timestamp: isoOffset(0, 0),
            detail: body.slice(0, 90),
          },
          ...current.activity,
        ],
      }));
      toast({ title: 'Note added', variant: 'success' });
    },
    [toast],
  );

  const deleteNote = useCallback<AppStoreValue['deleteNote']>((noteId) => {
    setState((current) => ({ ...current, notes: current.notes.filter((n) => n.id !== noteId) }));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Presets                                                           */
  /* ---------------------------------------------------------------- */

  const savePreset = useCallback<AppStoreValue['savePreset']>(
    (name, description, filters) => {
      setState((current) => ({
        ...current,
        presets: [
          ...current.presets,
          {
            id: uid('preset'),
            name,
            description,
            filters,
            system: false,
            createdAt: isoOffset(0, 0),
            lastUsedAt: null,
            useCount: 0,
          },
        ],
      }));
      toast({ title: 'Filter preset saved', description: name, variant: 'success' });
    },
    [toast],
  );

  const renamePreset = useCallback<AppStoreValue['renamePreset']>((id, name, description) => {
    setState((current) => ({
      ...current,
      presets: current.presets.map((preset) =>
        preset.id === id ? { ...preset, name, description } : preset,
      ),
    }));
  }, []);

  const deletePreset = useCallback<AppStoreValue['deletePreset']>(
    (id) => {
      const preset = state.presets.find((p) => p.id === id);
      setState((current) => ({ ...current, presets: current.presets.filter((p) => p.id !== id) }));
      toast({ title: 'Preset deleted', description: preset?.name, variant: 'info' });
    },
    [state.presets, toast],
  );

  const markPresetUsed = useCallback<AppStoreValue['markPresetUsed']>((id) => {
    setState((current) => ({
      ...current,
      presets: current.presets.map((preset) =>
        preset.id === id
          ? { ...preset, lastUsedAt: isoOffset(0, 0), useCount: preset.useCount + 1 }
          : preset,
      ),
    }));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Notifications                                                     */
  /* ---------------------------------------------------------------- */

  const markNotificationRead = useCallback<AppStoreValue['markNotificationRead']>((id, read = true) => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((item) =>
        item.id === id ? { ...item, read } : item,
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((item) => ({ ...item, read: true })),
    }));
    toast({ title: 'All notifications marked as read', variant: 'success' });
  }, [toast]);

  const dismissNotification = useCallback<AppStoreValue['dismissNotification']>((id) => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.filter((item) => item.id !== id),
    }));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Settings & filters                                                */
  /* ---------------------------------------------------------------- */

  const updateSettings = useCallback<AppStoreValue['updateSettings']>((patch) => {
    setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
  }, []);

  const setEmployerColumns = useCallback<AppStoreValue['setEmployerColumns']>((columns) => {
    setState((current) => ({ ...current, employerColumns: columns }));
  }, []);

  const persistFilters = useCallback<AppStoreValue['persistFilters']>((filters) => {
    setState((current) => ({ ...current, savedFilters: filters }));
  }, []);

  const resetDemoData = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    const fresh = initialState();
    setState(fresh);
    toast({ title: 'Demo data restored', description: 'All changes have been reset to the original dataset.', variant: 'info' });
  }, [toast]);

  /* ---------------------------------------------------------------- */
  /* Value                                                             */
  /* ---------------------------------------------------------------- */

  const value = useMemo<AppStoreValue>(
    () => ({
      ...state,
      records,
      unreadCount,
      shortlistedIds,
      comparisonRecords,
      createEmployer,
      saveEmployer,
      updateEmployer,
      setEmployerStatus,
      setVerification,
      advanceVerification,
      archiveEmployer,
      restoreEmployer,
      deleteEmployer,
      toggleShortlist,
      isShortlisted,
      updateShortlistNote,
      isComparing,
      toggleComparison,
      removeFromComparison,
      clearComparison,
      updateFee,
      addFee,
      removeFee,
      toggleRequirement,
      setRequirementStatus,
      addDocument,
      updateDocument,
      setDocumentStatus,
      removeDocument,
      addNote,
      deleteNote,
      savePreset,
      renamePreset,
      deletePreset,
      markPresetUsed,
      markNotificationRead,
      markAllNotificationsRead,
      dismissNotification,
      persistFilters,
      updateSettings,
      setEmployerColumns,
      logActivity,
      toasts,
      toast,
      dismissToast,
      resetDemoData,
    }),
    [
      state,
      records,
      unreadCount,
      shortlistedIds,
      comparisonRecords,
      createEmployer,
      saveEmployer,
      updateEmployer,
      setEmployerStatus,
      setVerification,
      advanceVerification,
      archiveEmployer,
      restoreEmployer,
      deleteEmployer,
      toggleShortlist,
      isShortlisted,
      updateShortlistNote,
      isComparing,
      toggleComparison,
      removeFromComparison,
      clearComparison,
      updateFee,
      addFee,
      removeFee,
      toggleRequirement,
      setRequirementStatus,
      addDocument,
      updateDocument,
      setDocumentStatus,
      removeDocument,
      addNote,
      deleteNote,
      savePreset,
      renamePreset,
      deletePreset,
      markPresetUsed,
      markNotificationRead,
      markAllNotificationsRead,
      dismissNotification,
      persistFilters,
      updateSettings,
      setEmployerColumns,
      logActivity,
      toasts,
      toast,
      dismissToast,
      resetDemoData,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('useAppStore must be used inside <AppStoreProvider>.');
  return context;
}

export type { AppSettings, Density };
