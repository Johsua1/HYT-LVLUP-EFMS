import { NavLink, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';
import { useAuth } from '@/auth/AuthProvider';
import { NAV_SECTIONS } from './navigation';
import { CountPill } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import levelUpLogo from '@/images/LEVELUPLOGO.png';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { unreadCount, shortlist } = useAppStore();
  const { isAdmin } = useAuth();
  const location = useLocation();

  /* The Administration section is only shown to administrators. Route guards
     and RLS enforce this independently — hiding the links is just polish. */
  const sections = NAV_SECTIONS.filter((section) => !section.adminOnly || isAdmin);

  const badgeValue = (badge?: 'shortlist' | 'notifications') => {
    if (badge === 'shortlist') return shortlist.length;
    if (badge === 'notifications') return unreadCount;
    return undefined;
  };

  const content = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div
        className={cn(
          'border-ink-200 flex shrink-0 items-center gap-2.5 border-b',
          collapsed ? 'h-14 justify-center px-0' : 'px-3 py-2.5',
        )}
      >
        {collapsed ? (
          /* The full logo is a wide horizontal lock-up, so at rail width it
             would be illegible. A monogram tile keeps the brand present
             without shrinking the wordmark into mush. */
          <span
            className="ring-ink-200 bg-brand-600 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold tracking-tight text-white ring-1"
            aria-label="Level Up International Manpower Services Corp."
            title="Level Up International Manpower Services Corp."
          >
            LU
          </span>
        ) : (
          <div className="min-w-0 flex-1">
            {/* The supplied artwork ships with a white background, so it sits
                on an explicit white tile — that reads as intentional in both
                the light and the dark theme instead of showing a white slab. */}
            <div className="ring-ink-200 rounded-lg bg-white px-2 py-1.5 ring-1">
              <img
                src={levelUpLogo}
                alt="Level Up International Manpower Services Corp."
                className="h-8 w-full object-contain"
              />
            </div>
            <p className="text-ink-500 mt-1.5 truncate text-[10px] font-medium tracking-wide">
              Employer Filtering Management System
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="text-ink-500 hover:bg-ink-100 hover:text-ink-800 rounded-md p-1.5 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {sections.map((section) => (
          <div key={section.id} className="mb-4 last:mb-0">
            {!collapsed && (
              <p className="text-ink-400 px-2 pb-1.5 text-[10px] font-semibold tracking-wider uppercase">
                {section.label}
              </p>
            )}
            {collapsed && <div className="bg-ink-200 mx-2 mb-2 h-px lg:block" />}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const count = badgeValue(item.badge);
                const active =
                  location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

                const link = (
                  <NavLink
                    to={item.to}
                    onClick={onCloseMobile}
                    className={cn(
                      'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                      'focus-visible:outline-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2',
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                      collapsed && 'lg:justify-center lg:px-0',
                    )}
                  >
                    {active && (
                      <span className="bg-brand-600 absolute top-1.5 bottom-1.5 -left-2 w-0.5 rounded-r" aria-hidden />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                    {!collapsed && count !== undefined && count > 0 && (
                      <CountPill value={count} tone={item.badge === 'notifications' ? 'danger' : 'brand'} />
                    )}
                    {collapsed && count !== undefined && count > 0 && (
                      <span
                        className="bg-rose-500 absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
                        aria-hidden
                      />
                    )}
                  </NavLink>
                );

                return (
                  <li key={item.to}>
                    {collapsed ? (
                      <Tooltip content={item.label} placement="right" className="w-full [&>a]:w-full">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-ink-200 shrink-0 border-t p-2">
        {!collapsed ? (
          <div className="bg-ink-50 rounded-lg p-2.5">
            <div className="text-ink-600 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">Connected workspace</span>
            </div>
            <p className="text-ink-500 mt-1 text-[10px] leading-relaxed">
              Employer records are stored securely in your team's Supabase database.
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={cn(
            'text-ink-500 hover:bg-ink-100 hover:text-ink-800 mt-2 hidden w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium lg:flex',
            collapsed && 'lg:justify-center lg:px-0',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          'border-ink-200 fixed inset-y-0 left-0 z-30 hidden shrink-0 border-r bg-white transition-[width] duration-200 lg:block',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn('fixed inset-0 z-50 lg:hidden', mobileOpen ? 'visible' : 'invisible')}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            'bg-ink-900/50 absolute inset-0 transition-opacity',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={onCloseMobile}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-ink-200 bg-white transition-transform duration-200',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}
