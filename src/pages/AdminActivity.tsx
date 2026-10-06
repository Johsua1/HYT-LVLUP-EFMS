import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Building2, Download, History, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import type { ActivityActionType, ActivityLogEntry } from '@/types';
import { ACTIVITY_LABEL } from '@/lib/tokens';
import { dateOnly, dateTime, downloadFile, relativeTime, toCsv } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InlineSelect } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserAvatar } from '@/components/ui/CompanyLogo';
import { Toolbar, ToolbarGroup } from '@/components/common/Toolbar';
import { StatCard } from '@/components/common/StatCard';
import { ActivityTypeBadge } from '@/components/common/StatusBadge';

const ACTION_TYPES = Object.keys(ACTIVITY_LABEL) as ActivityActionType[];

/**
 * Administrator audit trail.
 *
 * Every write in the application calls `writeActivity`, which appends an
 * attributed row to `activity_log` (who did what, to which employer, and when).
 * This screen is the read side of that trail: newest first, grouped by day, with
 * search and filters so an administrator can answer "who changed this, and when".
 */
export default function AdminActivityPage() {
  const { activity, refresh } = useAppStore();
  const [query, setQuery] = useState('');
  const [actionType, setActionType] = useState<ActivityActionType | 'all'>('all');
  const [user, setUser] = useState('all');

  const users = useMemo(
    () => Array.from(new Set(activity.map((entry) => entry.user))).sort((a, b) => a.localeCompare(b)),
    [activity],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return activity.filter((entry) => {
      if (actionType !== 'all' && entry.actionType !== actionType) return false;
      if (user !== 'all' && entry.user !== user) return false;
      if (needle) {
        const haystack = `${entry.action} ${entry.employerName} ${entry.detail ?? ''} ${entry.user}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [activity, actionType, user, query]);

  /* Bucket by calendar day so the trail reads as a timeline. */
  const groups = useMemo(() => {
    const map = new Map<string, ActivityLogEntry[]>();
    filtered.forEach((entry) => {
      const day = entry.timestamp.slice(0, 10);
      const bucket = map.get(day) ?? [];
      bucket.push(entry);
      map.set(day, bucket);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = activity.filter((entry) => entry.timestamp.slice(0, 10) === today).length;
  const employerCount = new Set(activity.map((entry) => entry.employerId).filter(Boolean)).size;

  const handleExport = () => {
    const csv = toCsv(
      filtered.map((entry) => ({
        When: dateTime(entry.timestamp),
        Who: entry.user,
        Action: entry.action,
        Type: ACTIVITY_LABEL[entry.actionType] ?? entry.actionType,
        Employer: entry.employerName,
        Detail: entry.detail ?? '',
      })),
    );
    downloadFile(`efms-activity-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const filtersActive = Boolean(query) || actionType !== 'all' || user !== 'all';

  return (
    <>
      <PageHeader
        title="Activity log"
        description="An attributed audit trail of every action taken in the workspace. Entries are written automatically as staff work and cannot be edited."
        actions={
          <>
            <Button variant="outline" icon={<RefreshCw />} onClick={() => void refresh()}>
              Refresh
            </Button>
            <Button variant="primary" icon={<Download />} onClick={handleExport} disabled={filtered.length === 0}>
              Export
            </Button>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total events" value={activity.length} icon={<History />} tone="brand" hint="Most recent 400" />
        <StatCard label="Today" value={todayCount} icon={<Activity />} tone="info" />
        <StatCard label="People" value={users.length} icon={<Users />} tone="neutral" hint="Distinct actors" />
        <StatCard label="Employers touched" value={employerCount} icon={<Building2 />} tone="success" />
      </section>

      <Card flush>
        <Toolbar>
          <ToolbarGroup grow>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search action, employer, detail or person…"
              aria-label="Search activity"
              className="border-ink-300 text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:ring-brand-500/20 h-9 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none sm:max-w-sm"
            />
          </ToolbarGroup>
          <InlineSelect
            ariaLabel="Filter by action type"
            value={actionType}
            onChange={(value) => setActionType(value as ActivityActionType | 'all')}
            options={[
              { value: 'all', label: 'All actions' },
              ...ACTION_TYPES.map((type) => ({ value: type, label: ACTIVITY_LABEL[type] })),
            ]}
          />
          <InlineSelect
            ariaLabel="Filter by person"
            value={user}
            onChange={setUser}
            options={[{ value: 'all', label: 'Everyone' }, ...users.map((name) => ({ value: name, label: name }))]}
          />
          <Badge tone="neutral">{filtered.length} events</Badge>
        </Toolbar>

        {groups.length === 0 ? (
          <EmptyState
            title={filtersActive ? 'No matching activity' : 'No activity yet'}
            description={
              filtersActive
                ? 'No entries match the current filters. Clear them to see the full trail.'
                : 'Actions such as adding an employer, editing details, verifying or uploading documents are recorded here automatically.'
            }
            action={
              filtersActive ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setActionType('all');
                    setUser('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-ink-200 divide-y">
            {groups.map(([day, entries]) => (
              <div key={day}>
                <div className="bg-ink-50/70 flex items-center justify-between gap-3 px-4 py-2">
                  <p className="text-ink-600 text-[11px] font-semibold tracking-wide uppercase">
                    {day === today ? 'Today' : dateOnly(entries[0].timestamp)}
                  </p>
                  <span className="text-ink-400 tnum text-[11px]">{entries.length}</span>
                </div>
                <ul className="divide-ink-200 divide-y">
                  {entries.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
                      <UserAvatar initials={entry.userInitials || '—'} size="sm" className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-ink-900 text-[13px]">
                            <span className="font-semibold">{entry.user}</span>{' '}
                            <span className="text-ink-700">{entry.action}</span>
                          </p>
                          <ActivityTypeBadge actionType={entry.actionType} />
                        </div>
                        <p className="text-ink-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
                          {entry.employerId ? (
                            <Link
                              to={`/employers/${entry.employerId}`}
                              className="text-brand-700 hover:underline font-medium"
                            >
                              {entry.employerName}
                            </Link>
                          ) : (
                            <span className="text-ink-600">{entry.employerName}</span>
                          )}
                          {entry.detail && <span className="text-ink-500">· {entry.detail}</span>}
                        </p>
                      </div>
                      <span className="text-ink-400 shrink-0 text-[11px]" title={dateTime(entry.timestamp)}>
                        {relativeTime(entry.timestamp)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-ink-500 mt-3 flex items-center gap-1.5 text-[11px]">
        <ShieldCheck className="h-3.5 w-3.5" />
        The log is append-only: entries are attributed to the signed-in account and cannot be modified from the app.
      </p>
    </>
  );
}
