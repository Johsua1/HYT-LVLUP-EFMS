import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellOff, Check, CheckCheck, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import type { NotificationCategory } from '@/types';
import { NOTIFICATION_CATEGORIES } from '@/lib/constants';
import { cn, dateTime, relativeTime } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Segmented } from '@/components/ui/Checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';
import { NotificationCategoryBadge, SeverityDot } from '@/components/common/StatusBadge';

type ReadFilter = 'all' | 'unread';

/**
 * Notification centre.
 *
 * Notifications are generated from the mock dataset (expiring contracts, missing
 * requirements, unverified documents) and then maintained locally: read state
 * and deletions persist in the browser, and the sidebar badge follows.
 */
export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    settings,
  } = useAppStore();
  const { confirm, dialog } = useConfirmDialog();
  const [category, setCategory] = useState<NotificationCategory | 'all'>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  /* Categories switched off in Settings are hidden here. */
  const enabled = useMemo(
    () => notifications.filter((item) => settings.notificationPrefs[item.category] !== false),
    [notifications, settings.notificationPrefs],
  );

  const hiddenByPreference = notifications.length - enabled.length;

  const rows = useMemo(
    () =>
      enabled
        .filter((item) => (category === 'all' ? true : item.category === category))
        .filter((item) => (readFilter === 'unread' ? !item.read : true)),
    [enabled, category, readFilter],
  );

  const unreadByCategory = useMemo(() => {
    const map = new Map<NotificationCategory, number>();
    enabled.forEach((item) => {
      if (!item.read) map.set(item.category, (map.get(item.category) ?? 0) + 1);
    });
    return map;
  }, [enabled]);

  const critical = enabled.filter((item) => item.severity === 'critical' && !item.read).length;

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: 'Delete notification',
      message: `“${title}” will be removed from the notification centre.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (confirmed) dismissNotification(id);
  };

  const tabs = [
    { id: 'all', label: 'All', count: enabled.length },
    ...NOTIFICATION_CATEGORIES.filter((value) => enabled.some((item) => item.category === value)).map((value) => ({
      id: value,
      label: value,
      count: enabled.filter((item) => item.category === value).length,
      tone: unreadByCategory.get(value) ? ('warning' as const) : ('default' as const),
    })),
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Contract, document, verification and fee alerts generated from the employer dataset."
        actions={
          <>
            <Link
              to="/settings"
              className="border-ink-300 text-ink-700 hover:bg-ink-50 inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium"
            >
              <SettingsIcon className="h-4 w-4" />
              Alert preferences
            </Link>
            <Button
              variant="primary"
              icon={<CheckCheck />}
              onClick={markAllNotificationsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={unreadCount > 0 ? 'danger' : 'success'} size="md">
          {unreadCount} unread
        </Badge>
        {critical > 0 && (
          <Badge tone="danger" size="md">
            {critical} critical
          </Badge>
        )}
        <Badge tone="neutral" size="md">
          {enabled.length} total
        </Badge>
        {hiddenByPreference > 0 && (
          <span className="text-ink-500 text-[11px]">
            {hiddenByPreference} hidden by your alert preferences.
          </span>
        )}
        <Segmented
          ariaLabel="Filter by read state"
          className="ml-auto"
          value={readFilter}
          onChange={setReadFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: `Unread (${unreadCount})` },
          ]}
        />
      </div>

      <Card flush>
        <Tabs tabs={tabs} active={category} onChange={(id) => setCategory(id as NotificationCategory | 'all')} className="px-3" />

        {rows.length === 0 ? (
          <EmptyState
            variant="default"
            title={readFilter === 'unread' ? 'Nothing unread' : 'No notifications'}
            description={
              readFilter === 'unread'
                ? 'You are up to date. Switch the filter back to “All” to review past alerts.'
                : 'Notifications appear here as contracts approach expiry and requirements go missing.'
            }
            action={
              readFilter === 'unread' ? (
                <Button variant="outline" onClick={() => setReadFilter('all')}>
                  Show all notifications
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-ink-200 divide-y">
            {rows.map((item) => (
              <li
                key={item.id}
                className={cn('flex items-start gap-3 px-4 py-3.5', !item.read && 'bg-brand-50/40')}
              >
                <span className="mt-1.5 shrink-0">
                  <SeverityDot severity={item.severity} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn('text-[13px]', item.read ? 'text-ink-700' : 'text-ink-900 font-semibold')}>
                      {item.title}
                    </p>
                    <NotificationCategoryBadge category={item.category} />
                    {!item.read && <Badge tone="brand">New</Badge>}
                  </div>
                  <p className="text-ink-600 mt-1 text-[13px] leading-relaxed">{item.message}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <span className="text-ink-400 text-[10px]" title={dateTime(item.createdAt)}>
                      {relativeTime(item.createdAt)}
                    </span>
                    {item.employerId && (
                      <Link
                        to={`/employers/${item.employerId}`}
                        className="text-brand-700 hover:underline text-[11px] font-medium"
                      >
                        Open employer
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Tooltip content={item.read ? 'Mark as unread' : 'Mark as read'}>
                    <IconButton
                      size="sm"
                      label={item.read ? 'Mark as unread' : 'Mark as read'}
                      onClick={() => markNotificationRead(item.id, !item.read)}
                    >
                      {item.read ? <BellOff /> : <Check />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="Delete notification">
                    <IconButton
                      size="sm"
                      label="Delete notification"
                      onClick={() => void handleDelete(item.id, item.title)}
                      className="hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 />
                    </IconButton>
                  </Tooltip>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {notifications.length === 0 && (
        <p className="text-ink-500 mt-3 text-[11px]">
          Every notification has been deleted.{' '}
          <Link to="/settings" className="text-brand-700 hover:underline font-medium">
            Reset the demo data
          </Link>{' '}
          to restore the original alerts.
        </p>
      )}

      {dialog}
    </>
  );
}
