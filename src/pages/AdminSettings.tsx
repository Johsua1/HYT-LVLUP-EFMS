import { useCallback, useEffect, useState } from 'react';
import { KeyRound, LogOut, RefreshCw, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { useAppStore } from '@/store/AppStore';
import { describeError, supabase } from '@/lib/supabase';
import type { Factor } from '@supabase/supabase-js';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/LoadingState';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

/** Admin → Security settings. */
export default function AdminSettingsPage() {
  const { profile, mfaVerified, mfaEnrolled, unenrollMfa, refreshMfa, signOut } = useAuth();
  const { toast } = useAppStore();
  const { confirm, dialog } = useConfirmDialog();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) toast({ title: 'Could not load factors', description: describeError(error), variant: 'error' });
    setFactors((data?.totp ?? []) as Factor[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const reenroll = async () => {
    const confirmed = await confirm({
      title: 'Reset two-factor authentication?',
      message:
        'Your current authenticator will be removed and you will be asked to set up a new one before continuing. Only do this if you still have access to your account.',
      confirmLabel: 'Reset MFA',
      destructive: true,
    });
    if (!confirmed) return;

    setBusy(true);
    for (const factor of factors) {
      if (factor.status === 'verified') await unenrollMfa(factor.id);
    }
    await load();
    await refreshMfa();
    setBusy(false);
    /* Removing the last factor flips the app gate back to the enrolment step. */
    toast({ title: 'Set up your new authenticator', variant: 'info' });
  };

  const signOutEverywhere = async () => {
    const confirmed = await confirm({
      title: 'Sign out of all devices?',
      message: 'Every active session for your account, including this one, will be revoked.',
      confirmLabel: 'Sign out everywhere',
      destructive: true,
    });
    if (!confirmed) return;
    await supabase.auth.signOut({ scope: 'global' });
  };

  return (
    <>
      <PageHeader
        title="Admin settings"
        description="Account and security controls for your administrator session."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Account"
            description="Your administrator identity."
            icon={<ShieldCheck />}
          />
          <dl className="flex flex-col gap-3 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-500">Name</dt>
              <dd className="text-ink-900 truncate font-medium">{profile?.full_name || '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-500">Email</dt>
              <dd className="text-ink-900 truncate font-medium">{profile?.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-500">Role</dt>
              <dd><Badge tone="brand">Administrator</Badge></dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-500">Status</dt>
              <dd><Badge tone="success" dot>Active</Badge></dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="Two-factor authentication"
            description="Required for every administrator sign-in."
            icon={mfaVerified ? <ShieldCheck /> : <ShieldOff />}
            actions={
              <Badge tone={mfaVerified ? 'success' : 'warning'} icon={mfaVerified ? <ShieldCheck /> : <ShieldOff />}>
                {mfaVerified ? 'Verified' : 'Not verified'}
              </Badge>
            }
          />

          {loading ? (
            <div className="flex items-center gap-2 py-4">
              <Spinner /> <span className="text-ink-500 text-[13px]">Loading factors…</span>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {factors.length === 0 && (
                <li className="text-ink-500 text-[13px]">No authenticator is enrolled yet.</li>
              )}
              {factors.map((factor) => (
                <li
                  key={factor.id}
                  className="border-ink-200 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <span className="flex items-center gap-2 text-[13px]">
                    <Smartphone className="text-ink-400 h-4 w-4" />
                    <span className="text-ink-800">{factor.friendly_name || 'Authenticator app'}</span>
                  </span>
                  <Badge tone={factor.status === 'verified' ? 'success' : 'warning'} dot>
                    {factor.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <div className="border-ink-200 mt-4 flex flex-wrap gap-2 border-t pt-4">
            <Button
              variant="outline"
              icon={<RefreshCw />}
              loading={busy}
              disabled={!mfaEnrolled}
              onClick={() => void reenroll()}
            >
              Reset authenticator
            </Button>
            <Button variant="outline" icon={<KeyRound />} onClick={() => void load()}>
              Refresh
            </Button>
          </div>
          <p className="text-ink-500 mt-3 text-[11px] leading-relaxed">
            If you lose access to your authenticator and have no recovery option, another administrator can reset your
            account from Staff Management.
          </p>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Sessions" description="Revoke every signed-in device for your account." icon={<LogOut />} />
          <div className="flex flex-wrap gap-2">
            <Button variant="danger-outline" icon={<LogOut />} onClick={() => void signOutEverywhere()}>
              Sign out of all devices
            </Button>
            <Button variant="ghost" icon={<LogOut />} onClick={() => void signOut()}>
              Sign out of this device
            </Button>
          </div>
        </Card>
      </div>

      {dialog}
    </>
  );
}
