import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Ban,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { useAppStore } from '@/store/AppStore';
import { describeError, invokeAdminStaff, supabase } from '@/lib/supabase';
import { passwordProblem } from '@/lib/security';
import type { ProfileRow, ProfileStatus } from '@/lib/database.types';
import { dateOnly } from '@/lib/utils';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, SearchBar } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/LoadingState';
import { UserAvatar } from '@/components/ui/CompanyLogo';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

interface StaffDraft {
  fullName: string;
  email: string;
  jobTitle: string;
  role: 'admin' | 'staff';
  tempPassword: string;
}

const EMPTY_DRAFT: StaffDraft = {
  fullName: '',
  email: '',
  jobTitle: '',
  role: 'staff',
  tempPassword: '',
};

/** Shape returned by the invite / resend actions. */
interface InviteOutcome {
  emailSent?: boolean;
  warning?: string | null;
}

/** Mirrors the Edge Function's generator — unambiguous characters only. */
function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function statusBadge(status: ProfileStatus) {
  if (status === 'disabled') return <Badge tone="danger" dot>Disabled</Badge>;
  if (status === 'invited') return <Badge tone="warning" dot>Invited</Badge>;
  return <Badge tone="success" dot>Active</Badge>;
}

/**
 * Staff Management (Admin → Staff).
 *
 * Every mutation goes through the `admin-staff` Edge Function, which holds the
 * service-role key server-side and re-verifies that the caller is an
 * MFA-verified administrator. The browser never receives privileged
 * credentials and there is no mock/local-only state: the list is read straight
 * from the `profiles` table and re-fetched after each action.
 */
export function StaffManager() {
  const { user } = useAuth();
  const { toast, logActivity } = useAppStore();
  const { confirm, dialog } = useConfirmDialog();

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [draft, setDraft] = useState<StaffDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (err) setError(describeError(err));
    else setProfiles((data ?? []) as ProfileRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return profiles;
    return profiles.filter((row) =>
      [row.full_name, row.email, row.job_title, row.role, row.status]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [profiles, query]);

  const openAdd = () => {
    setEditing(null);
    // Pre-fill a strong temporary password so the admin can send straight away.
    setDraft({ ...EMPTY_DRAFT, tempPassword: generateTempPassword() });
    setShowPassword(true);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (row: ProfileRow) => {
    setEditing(row);
    setDraft({
      fullName: row.full_name,
      email: row.email,
      jobTitle: row.job_title,
      role: row.role,
      tempPassword: '',
    });
    setFormError(null);
    setFormOpen(true);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!draft.fullName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!editing && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (!editing) {
      const problem = passwordProblem(draft.tempPassword);
      if (problem) {
        setFormError(problem);
        return;
      }
    }

    setSaving(true);

    if (editing) {
      const result = await invokeAdminStaff({
        action: 'update',
        userId: editing.id,
        fullName: draft.fullName,
        jobTitle: draft.jobTitle,
        role: draft.role,
      });
      setSaving(false);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setFormOpen(false);
      await load();
      toast({ title: 'Staff member updated', description: draft.fullName, variant: 'success' });
      logActivity({
        action: 'updated a staff account',
        actionType: 'updated',
        employerName: draft.fullName,
        detail: `${draft.fullName} · role ${draft.role}.`,
      });
      return;
    }

    const result = await invokeAdminStaff<InviteOutcome>({
      action: 'invite',
      email: draft.email,
      fullName: draft.fullName,
      jobTitle: draft.jobTitle,
      role: draft.role,
      tempPassword: draft.tempPassword,
    });
    setSaving(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setFormOpen(false);
    await load();

    if (result.data?.emailSent) {
      toast({
        title: 'Invitation sent',
        description: `Login details were emailed to ${draft.email.trim()}. They must change the password on first sign-in.`,
        variant: 'success',
      });
    } else {
      toast({
        title: 'Account created — email not sent',
        description: result.data?.warning ?? 'The invitation email could not be sent.',
        variant: 'warning',
      });
    }
    logActivity({
      action: 'invited a new staff member',
      actionType: 'created',
      employerName: draft.fullName,
      detail: `${draft.fullName} (${draft.email.trim()}) invited as ${draft.role}${
        result.data?.emailSent ? '; login details emailed.' : '; email could not be sent.'
      }`,
    });
  };

  const toggleStatus = async (row: ProfileRow) => {
    const disabling = row.status !== 'disabled';
    const confirmed = await confirm({
      title: disabling ? 'Disable this account?' : 'Re-enable this account?',
      message: disabling ? (
        <>
          <strong>{row.full_name || row.email}</strong> will be signed out immediately and blocked from EFMS until
          re-enabled.
        </>
      ) : (
        <>
          <strong>{row.full_name || row.email}</strong> will be able to sign in again.
        </>
      ),
      confirmLabel: disabling ? 'Disable account' : 'Re-enable account',
      destructive: disabling,
    });
    if (!confirmed) return;

    setBusyId(row.id);
    const result = await invokeAdminStaff({
      action: 'set_status',
      userId: row.id,
      status: disabling ? 'disabled' : 'active',
    });
    setBusyId(null);
    if (result.error) {
      toast({ title: 'Could not update account', description: result.error, variant: 'error' });
      return;
    }
    await load();
    toast({
      title: disabling ? 'Account disabled' : 'Account re-enabled',
      description: row.full_name || row.email,
      variant: 'success',
    });
    logActivity({
      action: disabling ? 'disabled a staff account' : 're-enabled a staff account',
      actionType: 'status-changed',
      employerName: row.full_name || row.email,
      detail: `${row.full_name || row.email} (${row.email}).`,
    });
  };

  const resendInvite = async (row: ProfileRow) => {
    setBusyId(row.id);
    const result = await invokeAdminStaff<InviteOutcome>({
      action: 'resend_invite',
      userId: row.id,
    });
    setBusyId(null);

    if (result.error) {
      toast({ title: 'Could not resend the invitation', description: result.error, variant: 'error' });
      return;
    }
    if (result.data?.emailSent) {
      toast({
        title: 'Invitation resent',
        description: `A new temporary password was emailed to ${row.email}.`,
        variant: 'success',
      });
    } else {
      toast({
        title: 'Email could not be sent',
        description: result.data?.warning ?? 'The invitation email could not be sent.',
        variant: 'warning',
      });
    }
    logActivity({
      action: 'resent a staff invitation',
      actionType: 'updated',
      employerName: row.full_name || row.email,
      detail: result.data?.emailSent
        ? `New temporary password emailed to ${row.email}.`
        : `Email could not be sent to ${row.email}.`,
    });
  };

  const removeStaff = async (row: ProfileRow) => {
    const confirmed = await confirm({
      title: 'Delete this account?',
      message: (
        <>
          <strong>{row.full_name || row.email}</strong> will be permanently removed. This cannot be undone.
        </>
      ),
      confirmLabel: 'Delete account',
      destructive: true,
    });
    if (!confirmed) return;

    setBusyId(row.id);
    const result = await invokeAdminStaff({ action: 'delete', userId: row.id });
    setBusyId(null);
    if (result.error) {
      toast({ title: 'Could not delete account', description: result.error, variant: 'error' });
      return;
    }
    await load();
    toast({ title: 'Account deleted', description: row.full_name || row.email, variant: 'info' });
    logActivity({
      action: 'deleted a staff account',
      actionType: 'removed',
      employerName: row.full_name || row.email,
      detail: `${row.full_name || row.email} (${row.email}) removed permanently.`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Staff management"
          description="Invite staff, edit their details, and control who can access EFMS. New staff are invited by email and set their own password."
          icon={<Users />}
          actions={
            <Button variant="primary" icon={<UserPlus />} onClick={openAdd}>
              Add staff
            </Button>
          }
        />

        <div className="mb-3 max-w-sm">
          <SearchBar value={query} onValueChange={setQuery} placeholder="Search name, email, role…" />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-6">
            <Spinner /> <span className="text-ink-500 text-[13px]">Loading team…</span>
          </div>
        ) : error ? (
          <p className="text-rose-600 text-[13px]">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-ink-500 py-6 text-[13px]">No team members match that search.</p>
        ) : (
          <div className="flex flex-col divide-y divide-ink-200">
            {filtered.map((row) => {
              const isSelf = row.id === user?.id;
              const isBusy = busyId === row.id;
              return (
                <div key={row.id} className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatar initials={row.initials || '—'} size="sm" />
                    <div className="min-w-0">
                      <p className="text-ink-900 flex items-center gap-1.5 truncate text-[13px] font-semibold">
                        {row.full_name || row.email}
                        {isSelf && <span className="text-ink-400 font-normal">(you)</span>}
                      </p>
                      <p className="text-ink-500 truncate text-[11px]">
                        {row.email}
                        {row.job_title ? ` · ${row.job_title}` : ''} · joined {dateOnly(row.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={row.role === 'admin' ? 'brand' : 'neutral'} icon={<ShieldCheck />}>
                      {row.role === 'admin' ? 'Administrator' : 'Staff'}
                    </Badge>
                    {statusBadge(row.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Pencil />}
                      disabled={isBusy}
                      onClick={() => openEdit(row)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Mail />}
                      disabled={isBusy || isSelf || row.status !== 'invited'}
                      onClick={() => void resendInvite(row)}
                      title={
                        row.status !== 'invited'
                          ? 'Only invited accounts can be resent — active users can reset via “Forgot password”'
                          : 'Issue a new temporary password and email it'
                      }
                    >
                      Resend
                    </Button>
                    <Button
                      variant={row.status === 'disabled' ? 'ghost' : 'danger-outline'}
                      size="sm"
                      icon={row.status === 'disabled' ? <CheckCircle2 /> : <Ban />}
                      disabled={isBusy || isSelf}
                      onClick={() => void toggleStatus(row)}
                    >
                      {row.status === 'disabled' ? 'Enable' : 'Disable'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 />}
                      disabled={isBusy || isSelf}
                      onClick={() => void removeStaff(row)}
                      aria-label={`Delete ${row.full_name || row.email}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-ink-500 mt-4 text-[11px] leading-relaxed">
          Staff cannot register themselves. Only administrators can create accounts, and only from this screen. Disabling
          an account signs the user out immediately and blocks all database access.
        </p>
      </Card>

      {/* Add / edit --------------------------------------------------- */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        dismissible={!saving}
        size="sm"
        icon={editing ? <Pencil /> : <UserPlus />}
        title={editing ? 'Edit staff member' : 'Add staff member'}
        description={
          editing
            ? 'Update this person’s details or role.'
            : 'The account is created with a temporary password and the login details are emailed. They must choose a new password on first sign-in.'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="staff-form" loading={saving}>
              {editing ? 'Save changes' : 'Send invitation'}
            </Button>
          </>
        }
      >
        <form id="staff-form" onSubmit={submitForm} className="flex flex-col gap-3.5" noValidate>
          {formError && <p className="text-rose-600 text-xs">{formError}</p>}
          <Input
            label="Full name *"
            name="fullName"
            value={draft.fullName}
            onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
            placeholder="e.g. Maria Santos"
            required
          />
          <Input
            label="Work email *"
            name="email"
            type="email"
            icon={<Mail />}
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            placeholder="name@levelup.example"
            disabled={Boolean(editing)}
            hint={editing ? 'Email addresses cannot be changed here.' : undefined}
            required
          />
          <Input
            label="Job title"
            name="jobTitle"
            value={draft.jobTitle}
            onChange={(e) => setDraft((d) => ({ ...d, jobTitle: e.target.value }))}
            placeholder="e.g. Placement Officer"
          />
          <Select
            label="Role"
            name="role"
            value={draft.role}
            disabled={editing?.id === user?.id}
            hint={editing?.id === user?.id ? 'You cannot change your own role.' : undefined}
            options={[
              { value: 'staff', label: 'Staff — full access to employer records' },
              { value: 'admin', label: 'Administrator — can manage the team' },
            ]}
            onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as StaffDraft['role'] }))}
          />

          {!editing && (
            <div className="flex flex-col gap-1.5">
              <Input
                label="Temporary password *"
                name="tempPassword"
                type={showPassword ? 'text' : 'password'}
                icon={<KeyRound />}
                value={draft.tempPassword}
                onChange={(e) => setDraft((d) => ({ ...d, tempPassword: e.target.value }))}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="text-ink-400 hover:text-ink-700 rounded p-1"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                }
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-500 text-[11px]">
                  Emailed in the invitation. They must change it on first sign-in.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  icon={<RefreshCw />}
                  onClick={() => {
                    setDraft((d) => ({ ...d, tempPassword: generateTempPassword() }));
                    setShowPassword(true);
                  }}
                >
                  Generate
                </Button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {dialog}
    </>
  );
}
