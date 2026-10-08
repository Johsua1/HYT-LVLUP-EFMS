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
  Benefits,
  Contract,
  ContractStatus,
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
import { COUNTRY_CODE, CURRENCIES, FEE_TYPES, REQUIREMENT_TEMPLATE } from '@/lib/constants';
import {
  buildEmployerRecords,
  DERIVED_NOTIFICATION_PREFIX,
  deriveContractNotifications,
  deriveContractStatus,
  mergeNotifications,
  pickPrimaryJob,
  renewalTerm,
  returnedStageEvent,
} from '@/lib/selectors';
import { MAX_COMPARISON } from '@/types';
import { addMonths, dateOnly, isoOffset, uid } from '@/lib/utils';
import { applyTheme } from '@/lib/theme';
import { useAuth } from '@/auth/AuthProvider';
import { DOCUMENTS_BUCKET, describeError, supabase } from '@/lib/supabase';
import { sanitizeStorageFileName, validateDocumentFile } from '@/lib/security';
import {
  activityFromRow,
  contractFromRow,
  contractToRow,
  documentFromRow,
  documentToRow,
  employerFromRow,
  employerToRow,
  feeFromRow,
  feeToRow,
  jobFromRow,
  jobToRow,
  noteFromRow,
  noteToRow,
  notificationFromRow,
  presetFromRow,
  requirementFromRow,
  requirementToRow,
  settingsFromRow,
  settingsToRow,
  shortlistFromRow,
  snakeize,
  verificationEventFromRow,
} from '@/lib/mappers';
import type {
  ActivityLogRow,
  AppSettingsRow,
  ContractRow,
  DocumentRow,
  EmployerRow,
  FeeRow,
  FilterPresetRow,
  JobOrderRow,
  NoteRow,
  NotificationRow,
  RequirementRow,
  ShortlistRow,
  VerificationEventRow,
} from '@/lib/database.types';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

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

const COMPARISON_KEY = 'efms.comparison.v1';

/**
 * Read/dismiss state for *derived* notifications (contract-expiry alerts),
 * which have no row in the `notifications` table. Kept per user in local
 * storage — the same place the comparison selection lives — so a dismissed
 * alert stays dismissed across reloads without writing throwaway rows.
 */
const DERIVED_HANDLED_KEY = (userId: string) => `efms.derived-notifications.v1.${userId}`;

interface HandledAlert {
  read?: boolean;
  dismissed?: boolean;
}

function loadHandledAlerts(userId: string): Record<string, HandledAlert> {
  try {
    const raw = window.localStorage.getItem(DERIVED_HANDLED_KEY(userId));
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, HandledAlert>) : {};
  } catch {
    return {};
  }
}

interface DataState {
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
}

function emptyState(): DataState {
  return {
    employers: [],
    jobs: [],
    contracts: [],
    fees: [],
    requirements: [],
    documents: [],
    notes: [],
    verificationEvents: [],
    shortlist: [],
    presets: [],
    notifications: [],
    activity: [],
    settings: DEFAULT_SETTINGS,
    employerColumns: DEFAULT_EMPLOYER_COLUMNS,
    savedFilters: null,
  };
}

function loadComparison(): string[] {
  try {
    const raw = window.localStorage.getItem(COMPARISON_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX_COMPARISON)
      : [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

export interface UploadDocumentMeta {
  name: string;
  type: string;
  status: DocumentStatus;
  expiresAt: string | null;
  notes: string;
}

interface AppStoreValue {
  /* Status */
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;

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
  createEmployer: (draft: EmployerDraft) => Promise<Employer | null>;
  saveEmployer: (id: string, draft: EmployerDraft) => Promise<boolean>;
  updateEmployer: (id: string, patch: Partial<Employer>) => Promise<void>;
  setEmployerStatus: (id: string, status: EmployerStatus) => Promise<void>;
  setVerification: (id: string, status: VerificationStatus, stage: number) => Promise<void>;
  advanceVerification: (id: string) => Promise<void>;
  setContractStatus: (employerId: string, status: ContractStatus) => Promise<void>;
  renewContract: (employerId: string) => Promise<void>;
  archiveEmployer: (id: string) => Promise<void>;
  restoreEmployer: (id: string) => Promise<void>;
  deleteEmployer: (id: string) => Promise<void>;

  /* Shortlist */
  toggleShortlist: (id: string) => Promise<void>;
  isShortlisted: (id: string) => boolean;
  updateShortlistNote: (id: string, note: string) => Promise<void>;

  /* Comparison */
  isComparing: (id: string) => boolean;
  toggleComparison: (id: string) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;

  /* Fees */
  updateFee: (feeId: string, patch: Partial<FeeItem>) => Promise<void>;
  addFee: (employerId: string, fee: Omit<FeeItem, 'id' | 'employerId'>) => Promise<void>;
  removeFee: (feeId: string) => Promise<void>;

  /* Requirements */
  toggleRequirement: (requirementId: string) => Promise<void>;
  setRequirementStatus: (requirementId: string, status: RequirementItem['status']) => Promise<void>;

  /* Documents */
  addDocument: (employerId: string, doc: Omit<DocumentRecord, 'id' | 'employerId' | 'storagePath'>) => Promise<void>;
  uploadDocument: (employerId: string, file: File, meta: UploadDocumentMeta) => Promise<{ error: string | null }>;
  updateDocument: (docId: string, patch: Partial<DocumentRecord>) => Promise<void>;
  replaceDocumentFile: (docId: string, file: File) => Promise<{ error: string | null }>;
  setDocumentStatus: (docId: string, status: DocumentStatus) => Promise<void>;
  removeDocument: (docId: string) => Promise<void>;

  /* Notes */
  addNote: (employerId: string, body: string, pinned?: boolean) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;

  /* Presets */
  savePreset: (name: string, description: string, filters: FilterState) => Promise<void>;
  renamePreset: (id: string, name: string, description: string) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  markPresetUsed: (id: string) => Promise<void>;

  /* Notifications */
  markNotificationRead: (id: string, read?: boolean) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;

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

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || 'SY'
  );
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [state, setState] = useState<DataState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<string[]>(loadComparison);
  const [handledAlerts, setHandledAlerts] = useState<Record<string, HandledAlert>>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /* Latest state, readable from callbacks without stale closures. */
  const stateRef = useRef(state);
  stateRef.current = state;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const userRef = useRef(user);
  userRef.current = user;

  /* Mirror of the derived-alert read/dismiss state, so writes can be persisted
     synchronously without an effect firing a spurious write on first load. */
  const handledRef = useRef<Record<string, HandledAlert>>({});

  /* Guards the once-per-load expiry reconciliation below against re-running. */
  const reconciledRef = useRef(false);

  const actor = {
    id: user?.id ?? null,
    name: profile?.full_name || profile?.email || 'Unknown user',
    initials: profile?.initials || initialsOf(profile?.full_name || 'Unknown user'),
  };

  /* Update the derived-alert state and mirror it straight to local storage. */
  const updateHandledAlerts = useCallback(
    (updater: (prev: Record<string, HandledAlert>) => Record<string, HandledAlert>) => {
      const next = updater(handledRef.current);
      handledRef.current = next;
      setHandledAlerts(next);
      const userId = userRef.current?.id;
      if (!userId) return;
      try {
        window.localStorage.setItem(DERIVED_HANDLED_KEY(userId), JSON.stringify(next));
      } catch {
        /* private mode */
      }
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /* Toasts                                                            */
  /* ---------------------------------------------------------------- */

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

  /* Keep the document root in sync with the user's appearance preferences. */
  useEffect(() => {
    applyTheme(state.settings.theme, state.settings.accent);
  }, [state.settings.theme, state.settings.accent]);

  const fail = useCallback(
    (err: unknown, title: string) => {
      const description = describeError(err);
      toast({ title, description, variant: 'error' });
      return description;
    },
    [toast],
  );

  /* ---------------------------------------------------------------- */
  /* Load                                                              */
  /* ---------------------------------------------------------------- */

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [
        employersRes,
        jobsRes,
        contractsRes,
        feesRes,
        requirementsRes,
        documentsRes,
        notesRes,
        verRes,
        shortlistRes,
        presetsRes,
        notificationsRes,
        activityRes,
        settingsRes,
      ] = await Promise.all([
        supabase.from('employers').select('*').order('updated_at', { ascending: false }),
        supabase.from('job_orders').select('*').order('posted_at', { ascending: false }),
        supabase.from('contracts').select('*'),
        supabase.from('fees').select('*'),
        supabase.from('requirements').select('*'),
        supabase.from('documents').select('*').order('uploaded_at', { ascending: false }),
        supabase.from('notes').select('*').order('created_at', { ascending: false }),
        supabase.from('verification_events').select('*').order('occurred_at', { ascending: true }),
        supabase.from('shortlist').select('*').eq('user_id', user.id).order('added_at', { ascending: false }),
        supabase
          .from('filter_presets')
          .select('*')
          .or(`user_id.is.null,user_id.eq.${user.id}`)
          .order('created_at', { ascending: true }),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(400),
        supabase.from('app_settings').select('*').eq('user_id', user.id).maybeSingle<AppSettingsRow>(),
      ]);

      const firstError =
        employersRes.error ||
        jobsRes.error ||
        contractsRes.error ||
        feesRes.error ||
        requirementsRes.error ||
        documentsRes.error ||
        notesRes.error ||
        verRes.error ||
        shortlistRes.error ||
        presetsRes.error ||
        notificationsRes.error ||
        activityRes.error;
      if (firstError) throw firstError;

      /* Guarantee a settings row even if the signup trigger has not run. */
      let settingsRow = settingsRes.data;
      if (!settingsRow) {
        const { data: created } = await supabase
          .from('app_settings')
          .upsert(settingsToRow(user.id, DEFAULT_SETTINGS, DEFAULT_EMPLOYER_COLUMNS, null), {
            onConflict: 'user_id',
          })
          .select('*')
          .single<AppSettingsRow>();
        settingsRow = created ?? null;
      }

      const bundle = settingsRow ? settingsFromRow(settingsRow) : null;

      setState({
        employers: (employersRes.data ?? []).map((r) => employerFromRow(r as EmployerRow)),
        jobs: (jobsRes.data ?? []).map((r) => jobFromRow(r as JobOrderRow)),
        contracts: (contractsRes.data ?? []).map((r) => contractFromRow(r as ContractRow)),
        fees: (feesRes.data ?? []).map((r) => feeFromRow(r as FeeRow)),
        requirements: (requirementsRes.data ?? []).map((r) => requirementFromRow(r as RequirementRow)),
        documents: (documentsRes.data ?? []).map((r) => documentFromRow(r as DocumentRow)),
        notes: (notesRes.data ?? []).map((r) => noteFromRow(r as NoteRow)),
        verificationEvents: (verRes.data ?? []).map((r) => verificationEventFromRow(r as VerificationEventRow)),
        shortlist: (shortlistRes.data ?? []).map((r) => shortlistFromRow(r as ShortlistRow)),
        presets: (presetsRes.data ?? []).map((r) => presetFromRow(r as FilterPresetRow)),
        notifications: (notificationsRes.data ?? []).map((r) => notificationFromRow(r as NotificationRow)),
        activity: (activityRes.data ?? []).map((r) => activityFromRow(r as ActivityLogRow)),
        settings: bundle?.settings ?? DEFAULT_SETTINGS,
        employerColumns: bundle?.employerColumns?.length ? bundle.employerColumns : DEFAULT_EMPLOYER_COLUMNS,
        savedFilters: bundle?.savedFilters ?? null,
      });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setState(emptyState());
      setLoading(false);
      return;
    }
    void load();
  }, [user, load]);

  /* Persist comparison selection locally — it is ephemeral UI state. */
  useEffect(() => {
    try {
      window.localStorage.setItem(COMPARISON_KEY, JSON.stringify(comparison));
    } catch {
      /* private mode */
    }
  }, [comparison]);

  /* Reload the derived-alert read/dismiss state whenever the user changes. */
  useEffect(() => {
    const loaded = user ? loadHandledAlerts(user.id) : {};
    handledRef.current = loaded;
    setHandledAlerts(loaded);
  }, [user]);

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

  /* Contract-expiry alerts are computed from the live dataset, then overlaid
     with whatever the user has already read or dismissed. */
  const derivedNotifications = useMemo(
    () =>
      deriveContractNotifications(records)
        .filter((item) => !handledAlerts[item.id]?.dismissed)
        .map((item) => ({ ...item, read: handledAlerts[item.id]?.read ?? item.read })),
    [records, handledAlerts],
  );

  /* The feed the UI consumes: stored per-user rows plus the derived alerts. */
  const notifications = useMemo(
    () => mergeNotifications(state.notifications, derivedNotifications),
    [state.notifications, derivedNotifications],
  );

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const shortlistedIds = useMemo(
    () => state.shortlist.map((entry) => entry.employerId),
    [state.shortlist],
  );

  const comparisonRecords = useMemo(
    () =>
      comparison
        .map((id) => records.find((record) => record.employer.id === id))
        .filter((record): record is EmployerRecord => Boolean(record)),
    [comparison, records],
  );

  /* ---------------------------------------------------------------- */
  /* Activity helper                                                   */
  /* ---------------------------------------------------------------- */

  const writeActivity = useCallback(
    async (entry: {
      action: string;
      actionType: ActivityActionType;
      employerId?: string | null;
      employerName?: string;
      detail?: string;
      user?: string;
    }) => {
      const current = profileRef.current;
      const name = entry.user ?? current?.full_name ?? current?.email ?? 'Unknown user';
      const payload = {
        user_id: actor.id,
        user_name: name,
        user_initials: current?.initials || initialsOf(name),
        action: entry.action,
        action_type: entry.actionType,
        employer_id: entry.employerId ?? null,
        employer_name: entry.employerName ?? '—',
        detail: entry.detail ?? null,
      };
      const { data } = await supabase.from('activity_log').insert(payload).select('*').single<ActivityLogRow>();
      if (data) {
        setState((prev) => ({ ...prev, activity: [activityFromRow(data), ...prev.activity].slice(0, 400) }));
      }
    },
    [actor.id],
  );

  const employerNameOf = useCallback(
    (id: string) => stateRef.current.employers.find((e) => e.id === id)?.companyName ?? '—',
    [],
  );

  /* ---------------------------------------------------------------- */
  /* Expiry reconciliation                                             */
  /* ---------------------------------------------------------------- */

  /**
   * Automatic inactive-on-expiry.
   *
   * Contract status is derived from the end date, so "Expired" is never stored.
   * This folds that derived fact back onto the employer row: any employer still
   * marked Active whose contract has lapsed becomes Inactive. It is idempotent
   * (a flipped row no longer matches) and best-effort — a failure here must
   * never block the page, so errors are swallowed.
   */
  const reconcileExpiredContracts = useCallback(async () => {
    const { employers, contracts } = stateRef.current;
    const contractByEmployer = new Map(contracts.map((c) => [c.employerId, c]));
    const lapsed = employers.filter((employer) => {
      if (employer.status !== 'Active') return false;
      const contract = contractByEmployer.get(employer.id);
      return contract ? deriveContractStatus(contract.status, contract.endDate) === 'Expired' : false;
    });
    if (!lapsed.length) return;

    const { data, error: err } = await supabase
      .from('employers')
      .update(snakeize({ status: 'Inactive', updatedAt: isoOffset(0, 0), updatedBy: 'System (contract expired)' }))
      .in('id', lapsed.map((employer) => employer.id))
      .select('*');
    if (err || !data) return;

    const byId = new Map((data as EmployerRow[]).map((row) => [row.id, employerFromRow(row)]));
    setState((prev) => ({
      ...prev,
      employers: prev.employers.map((employer) => byId.get(employer.id) ?? employer),
    }));

    lapsed.forEach((employer) => {
      void writeActivity({
        action: 'automatically set employer to Inactive (contract expired)',
        actionType: 'status-changed',
        employerId: employer.id,
        employerName: employer.companyName,
        detail: 'Contract end date has passed; employer deactivated automatically.',
      });
    });
  }, [writeActivity]);

  /* Run the reconciliation once per successful load, never in a loop. */
  useEffect(() => {
    if (loading) {
      reconciledRef.current = false;
      return;
    }
    if (!user || reconciledRef.current) return;
    reconciledRef.current = true;
    void reconcileExpiredContracts();
  }, [loading, user, reconcileExpiredContracts]);

  /* ---------------------------------------------------------------- */
  /* Settings persistence                                              */
  /* ---------------------------------------------------------------- */

  const persistSettings = useCallback(
    async (next: AppSettings, columns: string[], filters: FilterState | null) => {
      if (!actor.id) return;
      const { error: err } = await supabase
        .from('app_settings')
        .upsert(settingsToRow(actor.id, next, columns, filters), { onConflict: 'user_id' });
      if (err) fail(err, 'Could not save settings');
    },
    [actor.id, fail],
  );

  const updateSettings = useCallback<AppStoreValue['updateSettings']>(
    (patch) => {
      const next = { ...stateRef.current.settings, ...patch };
      setState((prev) => ({ ...prev, settings: next }));
      void persistSettings(next, stateRef.current.employerColumns, stateRef.current.savedFilters);
    },
    [persistSettings],
  );

  const setEmployerColumns = useCallback<AppStoreValue['setEmployerColumns']>(
    (columns) => {
      setState((prev) => ({ ...prev, employerColumns: columns }));
      void persistSettings(stateRef.current.settings, columns, stateRef.current.savedFilters);
    },
    [persistSettings],
  );

  const persistFilters = useCallback<AppStoreValue['persistFilters']>(
    (filters) => {
      setState((prev) => ({ ...prev, savedFilters: filters }));
      void persistSettings(stateRef.current.settings, stateRef.current.employerColumns, filters);
    },
    [persistSettings],
  );

  /* ---------------------------------------------------------------- */
  /* Employer draft expansion                                          */
  /* ---------------------------------------------------------------- */

  const expandDraft = useCallback((draft: EmployerDraft, employerId: string) => {
    const now = isoOffset(0, 0);
    const year = new Date(now).getFullYear();
    const suffix = employerId.replace(/-/g, '').slice(-4).toUpperCase();
    const rate = CURRENCIES[draft.currency]?.rateToPhp ?? 1;
    const toPhp = (amount: number) => Math.round(amount * rate);

    const job: JobOrder = {
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
      employerId,
      contractNumber: `CT-${year}-${suffix}`,
      jobOrderId: job.id,
      startDate: now,
      endDate: addMonths(now, draft.contractDurationMonths),
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
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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
      const current = profileRef.current;
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
        updatedBy: current?.full_name ?? 'Unknown user',
      };
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /* Employer actions                                                  */
  /* ---------------------------------------------------------------- */

  const createEmployer = useCallback<AppStoreValue['createEmployer']>(
    async (draft) => {
      const id = crypto.randomUUID();
      const employer = buildEmployerFromDraft(id, draft);
      const { job, contract, fees, requirements } = expandDraft(draft, id);

      const { data, error: err } = await supabase
        .from('employers')
        .insert(employerToRow(employer, actor.id))
        .select('*')
        .single<EmployerRow>();
      if (err || !data) {
        fail(err, 'Employer could not be added');
        return null;
      }
      const saved = employerFromRow(data);

      /* The contract carries a foreign key to the job order, so the job order
         must be committed first — these two cannot share one Promise.all.
         If the job order fails, skip the rest so the database never holds a
         half-written employer that the UI does not know about. */
      const jobRes = await supabase.from('job_orders').insert(jobToRow(job));
      let depError = jobRes.error;
      if (!depError) {
        const [contractRes, feesRes, reqRes] = await Promise.all([
          supabase.from('contracts').insert(contractToRow(contract)),
          supabase.from('fees').insert(fees.map(feeToRow)),
          supabase.from('requirements').insert(requirements.map(requirementToRow)),
        ]);
        depError = contractRes.error || feesRes.error || reqRes.error;
      }
      if (depError) fail(depError, 'Some employer details could not be saved');

      setState((prev) => ({
        ...prev,
        employers: [saved, ...prev.employers],
        jobs: depError ? prev.jobs : [...prev.jobs, job],
        contracts: depError ? prev.contracts : [...prev.contracts, contract],
        fees: depError ? prev.fees : [...prev.fees, ...fees],
        requirements: depError ? prev.requirements : [...prev.requirements, ...requirements],
      }));

      void writeActivity({
        action: 'added a new employer',
        actionType: 'created',
        employerId: id,
        employerName: saved.companyName,
        detail: `${saved.companyName} (${saved.country}) registered with a ${draft.contractDurationMonths}-month contract.`,
      });

      if (actor.id) {
        const { data: ntf } = await supabase
          .from('notifications')
          .insert({
            user_id: actor.id,
            category: 'Employer',
            title: 'New employer added',
            message: `${saved.companyName} (${saved.country}) was added to the employer database.`,
            employer_id: id,
            severity: 'info',
            read: false,
          })
          .select('*')
          .single<NotificationRow>();
        if (ntf) setState((prev) => ({ ...prev, notifications: [notificationFromRow(ntf), ...prev.notifications] }));
      }

      return saved;
    },
    [actor.id, buildEmployerFromDraft, expandDraft, fail, writeActivity],
  );

  const saveEmployer = useCallback<AppStoreValue['saveEmployer']>(
    async (id, draft) => {
      const now = isoOffset(0, 0);
      const existing = stateRef.current.employers.find((item) => item.id === id);
      if (!existing) return false;
      const generated = expandDraft(draft, id);
      const current = profileRef.current;
      const updatedBy = current?.full_name ?? 'Unknown user';

      const employerPatch = {
        companyName: draft.companyName,
        legalName: draft.legalName || draft.companyName,
        registrationNumber: draft.registrationNumber || existing.registrationNumber,
        country: draft.country,
        countryCode: COUNTRY_CODE[draft.country] ?? existing.countryCode,
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
        verificationStage: draft.verification === 'Verified' ? 4 : existing.verificationStage,
        verificationUpdatedAt:
          draft.verification === existing.verification ? existing.verificationUpdatedAt : now,
        description: draft.description,
        updatedAt: now,
        updatedBy,
      };

      const { data: empRow, error: empErr } = await supabase
        .from('employers')
        .update(snakeize(employerPatch))
        .eq('id', id)
        .select('*')
        .single<EmployerRow>();
      if (empErr || !empRow) {
        fail(empErr, 'Employer could not be updated');
        return false;
      }
      const updatedEmployer = employerFromRow(empRow);

      /* The registration form edits one job order — the same one the profile
         surfaces as its primary job. Target that exact row, not merely the
         first one for the employer, or the edit lands on a different job
         order and the form keeps showing the old values when reopened. */
      const existingJob = pickPrimaryJob(stateRef.current.jobs.filter((job) => job.employerId === id));
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

      const jobRes = existingJob
        ? await supabase.from('job_orders').update(snakeize({
            position: job.position,
            jobCategory: job.jobCategory,
            workersNeeded: job.workersNeeded,
            salaryMinLocal: job.salaryMinLocal,
            salaryMaxLocal: job.salaryMaxLocal,
            currency: job.currency,
            salaryMinPhp: job.salaryMinPhp,
            salaryMaxPhp: job.salaryMaxPhp,
            workingHours: job.workingHours,
            overtime: job.overtime,
            contractDurationMonths: job.contractDurationMonths,
            employmentType: job.employmentType,
            benefits: job.benefits,
          })).eq('id', existingJob.id)
        : await supabase.from('job_orders').insert(jobToRow(job));
      if (jobRes.error) fail(jobRes.error, 'Job order could not be saved');

      const existingContract = stateRef.current.contracts.find((item) => item.employerId === id);
      /* The contract window is start + duration, so the end date is re-derived
         on every save: editing the duration moves it, and a term left stale by
         an older edit is repaired at the same time. */
      const contract: Contract = existingContract
        ? {
            ...existingContract,
            durationMonths: generated.contract.durationMonths,
            salaryMinLocal: generated.contract.salaryMinLocal,
            salaryMaxLocal: generated.contract.salaryMaxLocal,
            currency: generated.contract.currency,
            workingConditions: generated.contract.workingConditions,
            endDate: addMonths(existingContract.startDate, generated.contract.durationMonths),
          }
        : generated.contract;
      const contractRes = existingContract
        ? await supabase.from('contracts').update(snakeize({
            durationMonths: contract.durationMonths,
            salaryMinLocal: contract.salaryMinLocal,
            salaryMaxLocal: contract.salaryMaxLocal,
            currency: contract.currency,
            workingConditions: contract.workingConditions,
            endDate: contract.endDate,
          })).eq('id', existingContract.id)
        : await supabase.from('contracts').insert(contractToRow(contract));
      if (contractRes.error) fail(contractRes.error, 'Contract could not be saved');

      const { error: delFeeErr } = await supabase.from('fees').delete().eq('employer_id', id);
      const feeRes = delFeeErr
        ? { error: delFeeErr }
        : await supabase.from('fees').insert(generated.fees.map(feeToRow));
      if (feeRes.error) fail(feeRes.error, 'Fee schedule could not be saved');

      setState((prev) => ({
        ...prev,
        employers: prev.employers.map((item) => (item.id === id ? updatedEmployer : item)),
        jobs: existingJob
          ? prev.jobs.map((item) => (item.id === existingJob.id ? job : item))
          : [...prev.jobs, job],
        contracts: existingContract
          ? prev.contracts.map((item) => (item.id === existingContract.id ? contract : item))
          : [...prev.contracts, contract],
        fees: [...prev.fees.filter((fee) => fee.employerId !== id), ...generated.fees],
      }));

      void writeActivity({
        action: 'updated employer information',
        actionType: 'updated',
        employerId: id,
        employerName: updatedEmployer.companyName,
        detail: 'Company profile, job order, fee schedule and benefits updated.',
      });
      return true;
    },
    [expandDraft, fail, writeActivity],
  );

  const updateEmployer = useCallback<AppStoreValue['updateEmployer']>(
    async (id, patch) => {
      const now = isoOffset(0, 0);
      const payload = { ...patch, updatedAt: now, updatedBy: profileRef.current?.full_name ?? 'Unknown user' };
      const { data, error: err } = await supabase
        .from('employers')
        .update(snakeize(payload as Record<string, unknown>))
        .eq('id', id)
        .select('*')
        .single<EmployerRow>();
      if (err || !data) {
        fail(err, 'Employer could not be updated');
        return;
      }
      const updated = employerFromRow(data);
      setState((prev) => ({ ...prev, employers: prev.employers.map((e) => (e.id === id ? updated : e)) }));
      void writeActivity({
        action: 'updated employer information',
        actionType: 'updated',
        employerId: id,
        employerName: updated.companyName,
        detail: `Updated fields: ${Object.keys(patch).join(', ')}.`,
      });
    },
    [fail, writeActivity],
  );

  const setEmployerStatus = useCallback<AppStoreValue['setEmployerStatus']>(
    async (id, status) => {
      const { data, error: err } = await supabase
        .from('employers')
        .update(snakeize({ status, updatedAt: isoOffset(0, 0), updatedBy: profileRef.current?.full_name ?? '' }))
        .eq('id', id)
        .select('*')
        .single<EmployerRow>();
      if (err || !data) {
        fail(err, 'Status could not be changed');
        return;
      }
      const updated = employerFromRow(data);
      setState((prev) => ({ ...prev, employers: prev.employers.map((e) => (e.id === id ? updated : e)) }));
      void writeActivity({
        action: `changed employer status to ${status}`,
        actionType: 'status-changed',
        employerId: id,
        employerName: updated.companyName,
      });
    },
    [fail, writeActivity],
  );

  const setVerification = useCallback<AppStoreValue['setVerification']>(
    async (id, status, stage) => {
      const now = isoOffset(0, 0);
      const { data, error: err } = await supabase
        .from('employers')
        .update(
          snakeize({
            verification: status,
            verificationStage: stage,
            verificationUpdatedAt: now,
            updatedAt: now,
            updatedBy: profileRef.current?.full_name ?? '',
          }),
        )
        .eq('id', id)
        .select('*')
        .single<EmployerRow>();
      if (err || !data) {
        fail(err, 'Verification could not be updated');
        return;
      }
      const updated = employerFromRow(data);
      setState((prev) => ({ ...prev, employers: prev.employers.map((e) => (e.id === id ? updated : e)) }));
      void writeActivity({
        action: `set verification outcome to ${status}`,
        actionType: status === 'Verified' ? 'verified' : status === 'Rejected' ? 'rejected' : 'status-changed',
        employerId: id,
        employerName: updated.companyName,
        detail: `Verification workflow moved to stage ${stage + 1}.`,
      });
    },
    [fail, writeActivity],
  );

  const advanceVerification = useCallback<AppStoreValue['advanceVerification']>(
    async (id) => {
      const employer = stateRef.current.employers.find((e) => e.id === id);
      if (!employer) return;
      const nextStage = Math.min(employer.verificationStage + 1, 4);
      const verified = nextStage === 4;
      await setVerification(id, verified ? 'Verified' : 'Under Review', nextStage);
      toast({
        title: verified ? 'Employer verified' : `Advanced to stage ${nextStage + 1}`,
        description: verified
          ? `${employer.companyName} has completed the verification workflow.`
          : `${employer.companyName} moved forward in the verification workflow.`,
        variant: 'success',
      });
    },
    [setVerification, toast],
  );

  const setContractStatus = useCallback<AppStoreValue['setContractStatus']>(
    async (employerId, status) => {
      const existing = stateRef.current.contracts.find((c) => c.employerId === employerId);
      if (!existing) {
        fail(null, 'This employer has no contract to update');
        return;
      }

      /* Activating a contract is the moment it is signed — stamp the date once. */
      const signedAt = status === 'Active' ? (existing.signedAt ?? new Date().toISOString()) : existing.signedAt;

      const { data, error: err } = await supabase
        .from('contracts')
        .update({ status, signed_at: signedAt })
        .eq('id', existing.id)
        .select('*')
        .single<ContractRow>();
      if (err || !data) {
        fail(err, 'Contract status could not be updated');
        return;
      }

      const updated = contractFromRow(data);
      setState((prev) => ({
        ...prev,
        contracts: prev.contracts.map((c) => (c.id === updated.id ? updated : c)),
      }));

      void writeActivity({
        action: status === 'Active' ? 'activated the contract' : `moved the contract to ${status}`,
        actionType: status === 'Active' ? 'verified' : 'status-changed',
        employerId,
        employerName: employerNameOf(employerId),
        detail: `${updated.contractNumber}: ${existing.status} → ${status}.`,
      });
      toast({
        title: status === 'Active' ? 'Contract activated' : `Contract moved to ${status}`,
        description: `${updated.contractNumber} is now ${status}.`,
        variant: 'success',
      });
    },
    [fail, writeActivity, employerNameOf, toast],
  );

  /**
   * Drops a "Returned" verification stage back into review.
   *
   * A return means "fix this and resubmit" — renewing the contract is that
   * resubmission. Clearing the failed outcome stops the timeline showing
   * "Returned" against a contract that has since been renewed, and the
   * employer stops reading as Requires Revision. The stage is *not*
   * auto-approved: it returns to "In progress" so the reviewer still makes
   * the call. Best-effort — a renewal must not fail because of it.
   */
  const reopenReturnedContractStage = useCallback(
    async (employerId: string) => {
      const employer = stateRef.current.employers.find((e) => e.id === employerId);
      if (!employer) return;

      const returned = returnedStageEvent(employer, stateRef.current.verificationEvents);
      if (!returned) return;
      const stageLabel = returned.stage;

      const now = isoOffset(0, 0);
      const actor = profileRef.current?.full_name ?? 'Unknown user';

      const { data: eventRow } = await supabase
        .from('verification_events')
        .update({
          outcome: 'current',
          actor,
          occurred_at: now,
          comment: `${stageLabel} returned to review — the contract was renewed.`,
        })
        .eq('id', returned.id)
        .select('*')
        .single<VerificationEventRow>();

      const { data: empRow } = await supabase
        .from('employers')
        .update(
          snakeize({ verification: 'Under Review', verificationUpdatedAt: now, updatedAt: now, updatedBy: actor }),
        )
        .eq('id', employerId)
        .select('*')
        .single<EmployerRow>();
      if (!eventRow && !empRow) return;

      setState((prev) => ({
        ...prev,
        employers: empRow
          ? prev.employers.map((e) => (e.id === employerId ? employerFromRow(empRow) : e))
          : prev.employers,
        verificationEvents: eventRow
          ? prev.verificationEvents.map((v) => (v.id === returned.id ? verificationEventFromRow(eventRow) : v))
          : prev.verificationEvents,
      }));

      void writeActivity({
        action: 'returned verification to review (contract renewed)',
        actionType: 'status-changed',
        employerId,
        employerName: employer.companyName,
        detail: `${stageLabel} had been Returned; the renewed contract puts it back in review.`,
      });
    },
    [writeActivity],
  );

  /**
   * Renews a contract by extending the same record — no new row and no repeat
   * approval. The term rolls forward for another `durationMonths`, the renewal
   * marker flips to `Renewed`, and the employer is returned to good standing.
   */
  const renewContract = useCallback<AppStoreValue['renewContract']>(
    async (employerId) => {
      const existing = stateRef.current.contracts.find((c) => c.employerId === employerId);
      if (!existing) {
        fail(null, 'This employer has no contract to renew');
        return;
      }

      const now = new Date().toISOString();
      const { startDate, endDate } = renewalTerm(existing.endDate, existing.durationMonths);

      const { data, error: err } = await supabase
        .from('contracts')
        .update(snakeize({
          startDate,
          endDate,
          renewalStatus: 'Renewed',
          status: 'Active',
          signedAt: existing.signedAt ?? now,
          updatedAt: now,
        }))
        .eq('id', existing.id)
        .select('*')
        .single<ContractRow>();
      if (err || !data) {
        fail(err, 'Contract could not be renewed');
        return;
      }

      const updated = contractFromRow(data);
      setState((prev) => ({
        ...prev,
        contracts: prev.contracts.map((c) => (c.id === updated.id ? updated : c)),
      }));

      /* A renewal puts the employer back in good standing. */
      await setEmployerStatus(employerId, 'Active');

      /* A renewal is also the employer's answer to a returned contract
         review, so that stage drops back into review. */
      await reopenReturnedContractStage(employerId);

      void writeActivity({
        action: 'renewed the contract',
        actionType: 'updated',
        employerId,
        employerName: employerNameOf(employerId),
        detail: `${updated.contractNumber}: renewed to ${dateOnly(endDate)}.`,
      });
      toast({
        title: 'Contract renewed',
        description: `${updated.contractNumber} now runs to ${dateOnly(endDate)}.`,
        variant: 'success',
      });
    },
    [fail, setEmployerStatus, reopenReturnedContractStage, writeActivity, employerNameOf, toast],
  );

  const archiveEmployer = useCallback<AppStoreValue['archiveEmployer']>(
    async (id) => {
      const name = employerNameOf(id);
      await setEmployerStatus(id, 'Archived');
      toast({ title: 'Employer archived', description: `${name} has been archived and hidden from active views.`, variant: 'info' });
    },
    [setEmployerStatus, toast, employerNameOf],
  );

  const restoreEmployer = useCallback<AppStoreValue['restoreEmployer']>(
    async (id) => {
      const name = employerNameOf(id);
      await setEmployerStatus(id, 'Active');
      toast({ title: 'Employer restored', description: `${name} is active again.`, variant: 'success' });
    },
    [setEmployerStatus, toast, employerNameOf],
  );

  const deleteEmployer = useCallback<AppStoreValue['deleteEmployer']>(
    async (id) => {
      /* Remove any uploaded files first — the DB cascade cannot reach Storage. */
      const paths = stateRef.current.documents
        .filter((doc) => doc.employerId === id && doc.storagePath)
        .map((doc) => doc.storagePath as string);
      if (paths.length) await supabase.storage.from(DOCUMENTS_BUCKET).remove(paths);

      const { error: err } = await supabase.from('employers').delete().eq('id', id);
      if (err) {
        fail(err, 'Employer could not be deleted');
        return;
      }
      setState((prev) => ({
        ...prev,
        employers: prev.employers.filter((e) => e.id !== id),
        jobs: prev.jobs.filter((j) => j.employerId !== id),
        contracts: prev.contracts.filter((c) => c.employerId !== id),
        fees: prev.fees.filter((f) => f.employerId !== id),
        requirements: prev.requirements.filter((r) => r.employerId !== id),
        documents: prev.documents.filter((d) => d.employerId !== id),
        notes: prev.notes.filter((n) => n.employerId !== id),
        verificationEvents: prev.verificationEvents.filter((v) => v.employerId !== id),
        shortlist: prev.shortlist.filter((s) => s.employerId !== id),
      }));
      setComparison((prev) => prev.filter((entry) => entry !== id));
    },
    [fail],
  );

  /* ---------------------------------------------------------------- */
  /* Shortlist                                                         */
  /* ---------------------------------------------------------------- */

  const isShortlisted = useCallback(
    (id: string) => stateRef.current.shortlist.some((entry) => entry.employerId === id),
    [],
  );

  const toggleShortlist = useCallback<AppStoreValue['toggleShortlist']>(
    async (id) => {
      if (!actor.id) return;
      const exists = stateRef.current.shortlist.some((entry) => entry.employerId === id);
      const name = employerNameOf(id);

      if (exists) {
        const { error: err } = await supabase
          .from('shortlist')
          .delete()
          .eq('user_id', actor.id)
          .eq('employer_id', id);
        if (err) {
          fail(err, 'Could not update shortlist');
          return;
        }
        setState((prev) => ({ ...prev, shortlist: prev.shortlist.filter((e) => e.employerId !== id) }));
      } else {
        const entry: ShortlistEntry = {
          employerId: id,
          note: '',
          addedAt: isoOffset(0, 0),
          addedBy: actor.name,
        };
        const { error: err } = await supabase.from('shortlist').insert({
          user_id: actor.id,
          employer_id: id,
          note: '',
          added_by: actor.name,
          added_at: entry.addedAt,
        });
        if (err) {
          fail(err, 'Could not update shortlist');
          return;
        }
        setState((prev) => ({ ...prev, shortlist: [entry, ...prev.shortlist] }));
      }

      void writeActivity({
        action: exists ? 'removed employer from shortlist' : 'added employer to shortlist',
        actionType: exists ? 'removed' : 'shortlisted',
        employerId: id,
        employerName: name,
      });
      toast({
        title: exists ? 'Removed from shortlist' : 'Added to shortlist',
        description: name,
        variant: exists ? 'info' : 'success',
      });
    },
    [actor.id, actor.name, fail, employerNameOf, toast, writeActivity],
  );

  const updateShortlistNote = useCallback<AppStoreValue['updateShortlistNote']>(
    async (id, note) => {
      if (!actor.id) return;
      setState((prev) => ({
        ...prev,
        shortlist: prev.shortlist.map((entry) => (entry.employerId === id ? { ...entry, note } : entry)),
      }));
      const { error: err } = await supabase
        .from('shortlist')
        .update({ note })
        .eq('user_id', actor.id)
        .eq('employer_id', id);
      if (err) fail(err, 'Note could not be saved');
    },
    [actor.id, fail],
  );

  /* ---------------------------------------------------------------- */
  /* Comparison (ephemeral, local)                                     */
  /* ---------------------------------------------------------------- */

  const isComparing = useCallback((id: string) => comparison.includes(id), [comparison]);

  const toggleComparison = useCallback<AppStoreValue['toggleComparison']>(
    (id) => {
      const exists = comparison.includes(id);
      const name = employerNameOf(id);
      if (!exists && comparison.length >= MAX_COMPARISON) {
        toast({
          title: `Comparison is full (${MAX_COMPARISON})`,
          description: 'Remove an employer before adding another.',
          variant: 'warning',
        });
        return;
      }
      setComparison((prev) => (exists ? prev.filter((entry) => entry !== id) : [...prev, id]));
      toast({
        title: exists ? 'Removed from comparison' : 'Added to comparison',
        description: name,
        variant: exists ? 'info' : 'success',
      });
    },
    [comparison, employerNameOf, toast],
  );

  const removeFromComparison = useCallback((id: string) => {
    setComparison((prev) => prev.filter((entry) => entry !== id));
  }, []);

  const clearComparison = useCallback(() => {
    setComparison([]);
    toast({ title: 'Comparison cleared', variant: 'info' });
  }, [toast]);

  /* ---------------------------------------------------------------- */
  /* Fees                                                              */
  /* ---------------------------------------------------------------- */

  const updateFee = useCallback<AppStoreValue['updateFee']>(
    async (feeId, patch) => {
      const fee = stateRef.current.fees.find((f) => f.id === feeId);
      const { data, error: err } = await supabase
        .from('fees')
        .update(snakeize(patch as Record<string, unknown>))
        .eq('id', feeId)
        .select('*')
        .single<FeeRow>();
      if (err || !data) {
        fail(err, 'Fee could not be updated');
        return;
      }
      const updated = feeFromRow(data);
      setState((prev) => ({ ...prev, fees: prev.fees.map((item) => (item.id === feeId ? updated : item)) }));
      if (fee) {
        void writeActivity({
          action: 'updated fee information',
          actionType: 'updated',
          employerId: fee.employerId,
          employerName: employerNameOf(fee.employerId),
          detail: `${fee.type} updated.`,
        });
      }
    },
    [fail, employerNameOf, writeActivity],
  );

  const addFee = useCallback<AppStoreValue['addFee']>(
    async (employerId, fee) => {
      const record: FeeItem = { ...fee, id: crypto.randomUUID(), employerId };
      const { data, error: err } = await supabase
        .from('fees')
        .insert(feeToRow(record))
        .select('*')
        .single<FeeRow>();
      if (err || !data) {
        fail(err, 'Fee could not be added');
        return;
      }
      const saved = feeFromRow(data);
      setState((prev) => ({ ...prev, fees: [...prev.fees, saved] }));
    },
    [fail],
  );

  const removeFee = useCallback<AppStoreValue['removeFee']>(
    async (feeId) => {
      const { error: err } = await supabase.from('fees').delete().eq('id', feeId);
      if (err) {
        fail(err, 'Fee could not be removed');
        return;
      }
      setState((prev) => ({ ...prev, fees: prev.fees.filter((f) => f.id !== feeId) }));
    },
    [fail],
  );

  /* ---------------------------------------------------------------- */
  /* Requirements                                                      */
  /* ---------------------------------------------------------------- */

  const toggleRequirement = useCallback<AppStoreValue['toggleRequirement']>(
    async (requirementId) => {
      const target = stateRef.current.requirements.find((r) => r.id === requirementId);
      if (!target) return;
      const completed = !target.completed;
      const status: RequirementItem['status'] = completed
        ? 'Complete'
        : target.mandatory
          ? 'Missing Documents'
          : 'Incomplete';
      const updatedAt = isoOffset(0, 0);

      /* Apply the tick locally first so the box and its badge move the moment
         it is clicked — waiting for the write makes the change look unsaved. */
      setState((prev) => ({
        ...prev,
        requirements: prev.requirements.map((item) =>
          item.id === requirementId ? { ...item, completed, status, updatedAt } : item,
        ),
      }));

      const { data, error: err } = await supabase
        .from('requirements')
        .update({ completed, status, updated_at: updatedAt })
        .eq('id', requirementId)
        .select('*')
        .single<RequirementRow>();
      if (err || !data) {
        setState((prev) => ({
          ...prev,
          requirements: prev.requirements.map((item) => (item.id === requirementId ? target : item)),
        }));
        fail(err, 'Requirement could not be updated');
        return;
      }
      const updated = requirementFromRow(data);
      setState((prev) => ({
        ...prev,
        requirements: prev.requirements.map((item) => (item.id === requirementId ? updated : item)),
      }));
      void writeActivity({
        action: completed ? 'completed a requirement' : 'reopened a requirement',
        actionType: 'updated',
        employerId: target.employerId,
        employerName: employerNameOf(target.employerId),
        detail: `"${target.label}" marked as ${status}.`,
      });
    },
    [fail, employerNameOf, writeActivity],
  );

  const setRequirementStatus = useCallback<AppStoreValue['setRequirementStatus']>(
    async (requirementId, status) => {
      const target = stateRef.current.requirements.find((r) => r.id === requirementId);
      if (!target) return;
      const completed = status === 'Complete';
      if (target.status === status && target.completed === completed) return;
      const updatedAt = isoOffset(0, 0);

      /* The control is bound to the stored value, so apply the choice locally
         first — otherwise it would snap back and the badge would lag. */
      setState((prev) => ({
        ...prev,
        requirements: prev.requirements.map((item) =>
          item.id === requirementId ? { ...item, status, completed, updatedAt } : item,
        ),
      }));

      const { data, error: err } = await supabase
        .from('requirements')
        .update({ status, completed, updated_at: updatedAt })
        .eq('id', requirementId)
        .select('*')
        .single<RequirementRow>();
      if (err || !data) {
        setState((prev) => ({
          ...prev,
          requirements: prev.requirements.map((item) => (item.id === requirementId ? target : item)),
        }));
        fail(err, 'Requirement could not be updated');
        return;
      }
      const updated = requirementFromRow(data);
      setState((prev) => ({
        ...prev,
        requirements: prev.requirements.map((item) => (item.id === requirementId ? updated : item)),
      }));
    },
    [fail],
  );

  /* ---------------------------------------------------------------- */
  /* Documents                                                         */
  /* ---------------------------------------------------------------- */

  const validateFile = useCallback(
    (file: File): string | null => validateDocumentFile({ name: file.name, size: file.size, type: file.type }),
    [],
  );

  const uploadToStorage = useCallback(
    async (employerId: string, file: File): Promise<{ path: string | null; error: string | null }> => {
      const invalid = validateFile(file);
      if (invalid) return { path: null, error: invalid };
      const safeName = sanitizeStorageFileName(file.name);
      const path = `employers/${employerId}/${crypto.randomUUID()}-${safeName}`;
      const { error: err } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });
      if (err) return { path: null, error: describeError(err) };
      return { path, error: null };
    },
    [validateFile],
  );

  const addDocument = useCallback<AppStoreValue['addDocument']>(
    async (employerId, doc) => {
      const record: DocumentRecord = { ...doc, id: crypto.randomUUID(), employerId, storagePath: null };
      const { data, error: err } = await supabase
        .from('documents')
        .insert(documentToRow(record))
        .select('*')
        .single<DocumentRow>();
      if (err || !data) {
        fail(err, 'Document could not be saved');
        return;
      }
      const saved = documentFromRow(data);
      setState((prev) => ({ ...prev, documents: [saved, ...prev.documents] }));
      void writeActivity({
        action: 'uploaded a document',
        actionType: 'uploaded',
        employerId,
        employerName: employerNameOf(employerId),
        detail: `${doc.name} (${doc.type}).`,
      });
    },
    [fail, employerNameOf, writeActivity],
  );

  const uploadDocument = useCallback<AppStoreValue['uploadDocument']>(
    async (employerId, file, meta) => {
      const { path, error: upErr } = await uploadToStorage(employerId, file);
      if (upErr || !path) return { error: upErr };

      const record: DocumentRecord = {
        id: crypto.randomUUID(),
        employerId,
        name: meta.name,
        type: meta.type,
        fileName: file.name,
        fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
        storagePath: path,
        uploadedAt: isoOffset(0, 0),
        uploadedBy: actor.name,
        expiresAt: meta.expiresAt,
        status: meta.status,
        notes: meta.notes,
      };
      const { data, error: err } = await supabase
        .from('documents')
        .insert(documentToRow(record))
        .select('*')
        .single<DocumentRow>();
      if (err || !data) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
        return { error: describeError(err) };
      }
      const saved = documentFromRow(data);
      setState((prev) => ({ ...prev, documents: [saved, ...prev.documents] }));
      void writeActivity({
        action: 'uploaded a document',
        actionType: 'uploaded',
        employerId,
        employerName: employerNameOf(employerId),
        detail: `${meta.name} (${meta.type}).`,
      });
      return { error: null };
    },
    [actor.name, uploadToStorage, fail, employerNameOf, writeActivity],
  );

  const updateDocument = useCallback<AppStoreValue['updateDocument']>(
    async (docId, patch) => {
      const { data, error: err } = await supabase
        .from('documents')
        .update(snakeize(patch as Record<string, unknown>))
        .eq('id', docId)
        .select('*')
        .single<DocumentRow>();
      if (err || !data) {
        fail(err, 'Document could not be updated');
        return;
      }
      const updated = documentFromRow(data);
      setState((prev) => ({ ...prev, documents: prev.documents.map((item) => (item.id === docId ? updated : item)) }));
      void writeActivity({
        action: 'updated a document record',
        actionType: 'updated',
        employerId: updated.employerId,
        employerName: employerNameOf(updated.employerId),
        detail: `Updated fields: ${Object.keys(patch).join(', ')}.`,
      });
    },
    [fail, employerNameOf, writeActivity],
  );

  const replaceDocumentFile = useCallback<AppStoreValue['replaceDocumentFile']>(
    async (docId, file) => {
      const existing = stateRef.current.documents.find((d) => d.id === docId);
      if (!existing) return { error: 'Document not found.' };
      const { path, error: upErr } = await uploadToStorage(existing.employerId, file);
      if (upErr || !path) return { error: upErr };

      if (existing.storagePath) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([existing.storagePath]);
      }
      const { data, error: err } = await supabase
        .from('documents')
        .update({ storage_path: path, file_name: file.name, file_size_kb: Math.max(1, Math.round(file.size / 1024)) })
        .eq('id', docId)
        .select('*')
        .single<DocumentRow>();
      if (err || !data) return { error: describeError(err) };
      const updated = documentFromRow(data);
      setState((prev) => ({ ...prev, documents: prev.documents.map((item) => (item.id === docId ? updated : item)) }));
      return { error: null };
    },
    [uploadToStorage],
  );

  const setDocumentStatus = useCallback<AppStoreValue['setDocumentStatus']>(
    async (docId, status) => {
      const doc = stateRef.current.documents.find((d) => d.id === docId);
      const { data, error: err } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', docId)
        .select('*')
        .single<DocumentRow>();
      if (err || !data) {
        fail(err, 'Document status could not be changed');
        return;
      }
      const updated = documentFromRow(data);
      setState((prev) => ({ ...prev, documents: prev.documents.map((item) => (item.id === docId ? updated : item)) }));
      if (doc) {
        void writeActivity({
          action: `marked a document as ${status.toLowerCase()}`,
          actionType: status === 'Verified' ? 'verified' : status === 'Rejected' ? 'rejected' : 'status-changed',
          employerId: doc.employerId,
          employerName: employerNameOf(doc.employerId),
          detail: doc.name,
        });
      }
    },
    [fail, employerNameOf, writeActivity],
  );

  const removeDocument = useCallback<AppStoreValue['removeDocument']>(
    async (docId) => {
      const doc = stateRef.current.documents.find((d) => d.id === docId);
      if (doc?.storagePath) await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.storagePath]);
      const { error: err } = await supabase.from('documents').delete().eq('id', docId);
      if (err) {
        fail(err, 'Document could not be deleted');
        return;
      }
      setState((prev) => ({ ...prev, documents: prev.documents.filter((d) => d.id !== docId) }));
    },
    [fail],
  );

  /* ---------------------------------------------------------------- */
  /* Notes                                                             */
  /* ---------------------------------------------------------------- */

  const addNote = useCallback<AppStoreValue['addNote']>(
    async (employerId, body, pinned = false) => {
      const note: Note = {
        id: crypto.randomUUID(),
        employerId,
        author: actor.name,
        body,
        createdAt: isoOffset(0, 0),
        pinned,
      };
      const { data, error: err } = await supabase
        .from('notes')
        .insert(noteToRow(note, actor.id))
        .select('*')
        .single<NoteRow>();
      if (err || !data) {
        fail(err, 'Note could not be added');
        return;
      }
      const saved = noteFromRow(data);
      setState((prev) => ({ ...prev, notes: [saved, ...prev.notes] }));
      void writeActivity({
        action: 'added an internal note',
        actionType: 'updated',
        employerId,
        employerName: employerNameOf(employerId),
        detail: body.slice(0, 90),
      });
      toast({ title: 'Note added', variant: 'success' });
    },
    [actor.id, actor.name, fail, employerNameOf, toast, writeActivity],
  );

  const deleteNote = useCallback<AppStoreValue['deleteNote']>(
    async (noteId) => {
      const { error: err } = await supabase.from('notes').delete().eq('id', noteId);
      if (err) {
        fail(err, 'Note could not be deleted');
        return;
      }
      setState((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }));
    },
    [fail],
  );

  /* ---------------------------------------------------------------- */
  /* Presets                                                           */
  /* ---------------------------------------------------------------- */

  const savePreset = useCallback<AppStoreValue['savePreset']>(
    async (name, description, filters) => {
      if (!actor.id) return;
      const { data, error: err } = await supabase
        .from('filter_presets')
        .insert({
          user_id: actor.id,
          name,
          description,
          filters: filters as unknown as Record<string, unknown>,
          system: false,
          use_count: 0,
        })
        .select('*')
        .single<FilterPresetRow>();
      if (err || !data) {
        fail(err, 'Preset could not be saved');
        return;
      }
      const saved = presetFromRow(data);
      setState((prev) => ({ ...prev, presets: [...prev.presets, saved] }));
      toast({ title: 'Filter preset saved', description: name, variant: 'success' });
    },
    [actor.id, fail, toast],
  );

  const renamePreset = useCallback<AppStoreValue['renamePreset']>(
    async (id, name, description) => {
      const { data, error: err } = await supabase
        .from('filter_presets')
        .update({ name, description })
        .eq('id', id)
        .select('*')
        .single<FilterPresetRow>();
      if (err || !data) {
        fail(err, 'Preset could not be renamed');
        return;
      }
      const updated = presetFromRow(data);
      setState((prev) => ({ ...prev, presets: prev.presets.map((p) => (p.id === id ? updated : p)) }));
    },
    [fail],
  );

  const deletePreset = useCallback<AppStoreValue['deletePreset']>(
    async (id) => {
      const preset = stateRef.current.presets.find((p) => p.id === id);
      if (preset?.system) {
        toast({
          title: 'Built-in preset',
          description: 'System presets are shared and cannot be deleted.',
          variant: 'info',
        });
        return;
      }
      const { error: err } = await supabase.from('filter_presets').delete().eq('id', id);
      if (err) {
        fail(err, 'Preset could not be deleted');
        return;
      }
      setState((prev) => ({ ...prev, presets: prev.presets.filter((p) => p.id !== id) }));
      toast({ title: 'Preset deleted', description: preset?.name, variant: 'info' });
    },
    [fail, toast],
  );

  const markPresetUsed = useCallback<AppStoreValue['markPresetUsed']>(
    async (id) => {
      const preset = stateRef.current.presets.find((p) => p.id === id);
      if (!preset) return;
      const lastUsedAt = isoOffset(0, 0);
      const useCount = preset.useCount + 1;
      setState((prev) => ({
        ...prev,
        presets: prev.presets.map((p) => (p.id === id ? { ...p, lastUsedAt, useCount } : p)),
      }));
      /* System presets are shared and read-only, so usage is tracked locally. */
      if (preset.system) return;
      const { error: err } = await supabase
        .from('filter_presets')
        .update({ last_used_at: lastUsedAt, use_count: useCount })
        .eq('id', id);
      if (err) fail(err, 'Preset usage could not be recorded');
    },
    [fail],
  );

  /* ---------------------------------------------------------------- */
  /* Notifications                                                     */
  /* ---------------------------------------------------------------- */

  const markNotificationRead = useCallback<AppStoreValue['markNotificationRead']>(
    async (id, read = true) => {
      /* Derived alerts have no database row — record the state locally. */
      if (id.startsWith(DERIVED_NOTIFICATION_PREFIX)) {
        updateHandledAlerts((prev) => ({ ...prev, [id]: { ...prev[id], read } }));
        return;
      }
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((item) => (item.id === id ? { ...item, read } : item)),
      }));
      const { error: err } = await supabase.from('notifications').update({ read }).eq('id', id);
      if (err) fail(err, 'Notification could not be updated');
    },
    [fail, updateHandledAlerts],
  );

  const markAllNotificationsRead = useCallback<AppStoreValue['markAllNotificationsRead']>(async () => {
    if (!actor.id) return;
    if (derivedNotifications.length) {
      updateHandledAlerts((prev) => {
        const next = { ...prev };
        derivedNotifications.forEach((item) => {
          next[item.id] = { ...next[item.id], read: true };
        });
        return next;
      });
    }
    setState((prev) => ({ ...prev, notifications: prev.notifications.map((item) => ({ ...item, read: true })) }));
    const { error: err } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', actor.id)
      .eq('read', false);
    if (err) {
      fail(err, 'Notifications could not be updated');
      return;
    }
    toast({ title: 'All notifications marked as read', variant: 'success' });
  }, [actor.id, derivedNotifications, fail, toast, updateHandledAlerts]);

  const dismissNotification = useCallback<AppStoreValue['dismissNotification']>(
    async (id) => {
      /* Derived alerts are hidden locally rather than deleted from the table. */
      if (id.startsWith(DERIVED_NOTIFICATION_PREFIX)) {
        updateHandledAlerts((prev) => ({ ...prev, [id]: { ...prev[id], dismissed: true } }));
        return;
      }
      setState((prev) => ({ ...prev, notifications: prev.notifications.filter((item) => item.id !== id) }));
      const { error: err } = await supabase.from('notifications').delete().eq('id', id);
      if (err) fail(err, 'Notification could not be deleted');
    },
    [fail, updateHandledAlerts],
  );

  /* ---------------------------------------------------------------- */
  /* Maintenance                                                       */
  /* ---------------------------------------------------------------- */

  const resetDemoData = useCallback(() => {
    void load();
    toast({
      title: 'Reloaded from the database',
      description: 'Your local view has been refreshed with the current server data.',
      variant: 'info',
    });
  }, [load, toast]);

  const logActivity = useCallback<AppStoreValue['logActivity']>(
    (entry) => {
      void writeActivity(entry);
    },
    [writeActivity],
  );

  /* ---------------------------------------------------------------- */
  /* Value                                                             */
  /* ---------------------------------------------------------------- */

  const value = useMemo<AppStoreValue>(
    () => ({
      ...state,
      /* Override the raw per-user rows with the feed the UI should see:
         stored notifications plus the derived contract-expiry alerts. */
      notifications,
      loading,
      error,
      refresh: load,
      comparison,
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
      setContractStatus,
      renewContract,
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
      uploadDocument,
      updateDocument,
      replaceDocumentFile,
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
      notifications,
      loading,
      error,
      load,
      comparison,
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
      setContractStatus,
      renewContract,
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
      uploadDocument,
      updateDocument,
      replaceDocumentFile,
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

  /* Block the UI until the first fetch resolves so pages never flash empty. */
  if (loading) {
    return (
      <div className="bg-ink-100 flex min-h-screen items-center justify-center">
        <LoadingState label="Loading your workspace…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-ink-100 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <EmptyState
            variant="error"
            title="Could not load the workspace"
            description={error}
            action={
              <Button variant="primary" onClick={() => void load()}>
                Try again
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('useAppStore must be used inside <AppStoreProvider>.');
  return context;
}

export type { AppSettings, Density };
