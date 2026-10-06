import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, UserCog, UserPlus, Users, UserX } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { describeError, supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/lib/database.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/LoadingState';
import { UserAvatar } from '@/components/ui/CompanyLogo';
import { dateOnly } from '@/lib/utils';

interface Counts {
  total: number;
  active: number;
  invited: number;
  disabled: number;
}

/** Admin home — a security-aware overview of the workspace and its team. */
export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const counts: Counts = profiles.reduce<Counts>(
    (acc, row) => {
      acc.total += 1;
      if (row.status === 'active') acc.active += 1;
      else if (row.status === 'invited') acc.invited += 1;
      else if (row.status === 'disabled') acc.disabled += 1;
      return acc;
    },
    { total: 0, active: 0, invited: 0, disabled: 0 },
  );

  const stats = [
    { label: 'Team members', value: counts.total, icon: <Users />, tone: 'brand' as const },
    { label: 'Active', value: counts.active, icon: <ShieldCheck />, tone: 'success' as const },
    { label: 'Pending invitations', value: counts.invited, icon: <UserPlus />, tone: 'warning' as const },
    { label: 'Disabled', value: counts.disabled, icon: <UserX />, tone: 'danger' as const },
  ];

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        description="You are signed in as an administrator with two-factor authentication verified. Manage your team and the shared employer workspace from here."
        actions={
          <>
            <Button variant="outline" icon={<Building2 />} onClick={() => navigate('/employers')}>
              Open employer workspace
            </Button>
            <Button variant="primary" icon={<UserCog />} onClick={() => navigate('/admin/staff')}>
              Manage staff
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-ink-500 text-[11px] font-semibold tracking-wide uppercase">{stat.label}</span>
              <Badge tone={stat.tone} icon={stat.icon}>
                <span className="sr-only">{stat.label}</span>
              </Badge>
            </div>
            <p className="text-ink-900 tnum mt-2 text-2xl font-semibold">{loading ? '—' : stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Team"
            description="Everyone with access to this workspace. Invite staff from Staff Management."
            icon={<Users />}
            actions={
              <Button variant="outline" size="sm" icon={<UserCog />} onClick={() => navigate('/admin/staff')}>
                Manage
              </Button>
            }
          />
          {loading ? (
            <div className="flex items-center gap-2 py-6">
              <Spinner /> <span className="text-ink-500 text-[13px]">Loading team…</span>
            </div>
          ) : error ? (
            <p className="text-rose-600 text-[13px]">{error}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-ink-200">
              {profiles.slice(0, 6).map((row) => (
                <li key={row.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <UserAvatar initials={row.initials || '—'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-ink-900 truncate text-[13px] font-medium">{row.full_name || row.email}</p>
                    <p className="text-ink-500 truncate text-[11px]">
                      {row.email} · joined {dateOnly(row.created_at)}
                    </p>
                  </div>
                  <Badge tone={row.role === 'admin' ? 'brand' : 'neutral'}>
                    {row.role === 'admin' ? 'Admin' : 'Staff'}
                  </Badge>
                  <Badge tone={row.status === 'active' ? 'success' : row.status === 'invited' ? 'warning' : 'danger'} dot>
                    {row.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Your security" description="Administrator session requirements." icon={<ShieldCheck />} />
          <dl className="flex flex-col gap-3 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-500">Signed in as</dt>
              <dd className="text-ink-900 truncate font-medium">{profile?.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-500">Role</dt>
              <dd><Badge tone="brand">Administrator</Badge></dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-500">Two-factor auth</dt>
              <dd><Badge tone="success" icon={<ShieldCheck />}>Verified</Badge></dd>
            </div>
          </dl>
          <p className="text-ink-500 mt-4 text-[11px] leading-relaxed">
            Staff-management operations are enforced server-side: the Edge Function requires an MFA-verified
            administrator, so a password-only session cannot manage accounts.
          </p>
          <div className="border-ink-200 mt-4 border-t pt-4">
            <Button variant="outline" block icon={<UserCog />} onClick={() => navigate('/admin/settings')}>
              Security settings
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
