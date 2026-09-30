import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronDown,
  CircleUser,
  Info,
  Menu,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';
import { CURRENT_USER } from '@/data/dataset';
import { Badge, CountPill } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Popover } from '@/components/ui/Popover';
import { UserAvatar } from '@/components/ui/CompanyLogo';
import { SeverityDot } from '@/components/common/StatusBadge';
import { relativeTime } from '@/lib/utils';

export interface TopbarProps {
  onOpenMobileNav: () => void;
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    resetDemoData,
    toast,
  } = useAppStore();
  const [query, setQuery] = useState('');

  const recent = notifications.slice(0, 6);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    navigate(`/employers?q=${encodeURIComponent(term)}`);
    setQuery('');
  };

  return (
    <header className="border-ink-200 no-print sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-white px-3 sm:gap-3 sm:px-4">
      <IconButton label="Open navigation" onClick={onOpenMobileNav} className="lg:hidden">
        <Menu />
      </IconButton>

      {/* Global search */}
      <form onSubmit={submitSearch} className="relative min-w-0 flex-1 max-w-xl" role="search">
        <Search className="text-ink-400 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search employers, countries, positions…"
          aria-label="Search employers"
          className="border-ink-300 text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:ring-brand-500/20 h-9 w-full rounded-lg border bg-white pr-3 pl-9 text-sm focus:ring-2 focus:outline-none"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Badge tone="warning" icon={<Info />} className="hidden xl:inline-flex">
          Demo data — fictional employers
        </Badge>

        {/* Notification centre */}
        <Popover
          align="end"
          width={360}
          trigger={({ open, toggle, ref }) => (
            <button
              ref={ref}
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              className={cn(
                'text-ink-600 hover:bg-ink-100 hover:text-ink-900 relative inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                open && 'bg-ink-100 text-ink-900',
              )}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5">
                  <CountPill value={unreadCount > 9 ? 9 : unreadCount} tone="danger" className="min-w-4 px-1" />
                </span>
              )}
            </button>
          )}
        >
          {({ close }) => (
            <div className="flex max-h-[26rem] flex-col">
              <div className="border-ink-200 flex items-center justify-between gap-2 border-b px-3 py-2.5">
                <div>
                  <p className="text-ink-900 text-[13px] font-semibold">Notifications</p>
                  <p className="text-ink-500 text-[11px]">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  disabled={unreadCount === 0}
                  className="text-brand-700 hover:bg-brand-50 inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium disabled:opacity-40"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {recent.length === 0 && (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <BellOff className="text-ink-300 h-6 w-6" />
                    <p className="text-ink-500 text-xs">You have no notifications.</p>
                  </div>
                )}
                {recent.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'border-ink-200/70 flex items-start gap-2.5 border-b px-3 py-2.5 last:border-b-0',
                      !item.read && 'bg-brand-50/40',
                    )}
                  >
                    <span className="mt-1.5">
                      <SeverityDot severity={item.severity} />
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        markNotificationRead(item.id, true);
                        if (item.employerId) navigate(`/employers/${item.employerId}`);
                        else navigate('/notifications');
                        close();
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className={cn('text-[13px] leading-snug', item.read ? 'text-ink-700' : 'text-ink-900 font-semibold')}>
                        {item.title}
                      </p>
                      <p className="text-ink-500 mt-0.5 line-clamp-2 text-[11px] leading-relaxed">{item.message}</p>
                      <p className="text-ink-400 mt-1 text-[10px]">{relativeTime(item.createdAt)}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissNotification(item.id)}
                      aria-label="Delete notification"
                      className="text-ink-400 hover:text-rose-600 hover:bg-rose-50 rounded p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-ink-200 bg-ink-50 border-t p-2">
                <Button
                  size="sm"
                  variant="outline"
                  block
                  onClick={() => {
                    navigate('/notifications');
                    close();
                  }}
                >
                  View notification centre
                </Button>
              </div>
            </div>
          )}
        </Popover>

        {/* User menu */}
        <Dropdown
          width={248}
          sections={[
            {
              key: 'account',
              label: 'Signed in as',
              items: [
                {
                  key: 'profile',
                  label: (
                    <span className="flex flex-col">
                      <span className="text-ink-900 text-[13px] font-semibold">{CURRENT_USER.name}</span>
                      <span className="text-ink-500 text-[11px]">{CURRENT_USER.role}</span>
                    </span>
                  ),
                  icon: <CircleUser />,
                  disabled: true,
                },
              ],
            },
            {
              key: 'actions',
              items: [
                { key: 'settings', label: 'Settings', icon: <SettingsIcon />, onSelect: () => navigate('/settings') },
                {
                  key: 'reset',
                  label: 'Reset demo data',
                  icon: <RotateCcw />,
                  tone: 'danger',
                  onSelect: () => {
                    resetDemoData();
                    navigate('/dashboard');
                  },
                },
                {
                  key: 'signout',
                  label: 'Sign out',
                  icon: <Trash2 />,
                  onSelect: () =>
                    toast({
                      title: 'Sign out is disabled',
                      description: 'This prototype has no authentication layer.',
                      variant: 'info',
                    }),
                },
              ],
            },
          ]}
          trigger={({ toggle, ref, open }) => (
            <button
              ref={ref}
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-label="Account menu"
              className={cn(
                'hover:bg-ink-100 flex items-center gap-2 rounded-md p-1 pr-1.5 transition-colors',
                open && 'bg-ink-100',
              )}
            >
              <UserAvatar initials={CURRENT_USER.initials} size="sm" />
              <span className="hidden text-left lg:block">
                <span className="text-ink-800 block text-[12px] leading-tight font-semibold">
                  {CURRENT_USER.name}
                </span>
                <span className="text-ink-500 block text-[10px] leading-tight">{CURRENT_USER.role}</span>
              </span>
              <ChevronDown className="text-ink-400 h-3.5 w-3.5" />
            </button>
          )}
        />
      </div>
    </header>
  );
}

/** Slim banner shown once at the top of the app to satisfy the demo-data notice. */
export function DemoDataBanner() {
  return (
    <div className="border-amber-200 bg-amber-50 border-b px-3 py-1.5 sm:px-4">
      <p className="text-amber-800 flex items-center gap-1.5 text-[11px] font-medium">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>
          Prototype with sample data. Every employer, contract and fee below is fictional and stored only in this
          browser. <Link to="/settings" className="underline underline-offset-2">Reset demo data</Link> at any time.
        </span>
      </p>
    </div>
  );
}
