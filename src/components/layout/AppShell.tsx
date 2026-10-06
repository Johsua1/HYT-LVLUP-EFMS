import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ToastViewport } from '@/components/ui/Toast';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const COLLAPSE_KEY = 'efms.sidebar.collapsed';

/**
 * Application chrome: persistent sidebar, sticky topbar, scrolling content
 * region and the global toast viewport. The sidebar collapses to an icon rail
 * on desktop and becomes an overlay drawer below `lg`.
 */
export function AppShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* private mode — collapse state simply does not persist */
    }
  }, [collapsed]);

  /* Route changes close the mobile drawer and return the user to the top. */
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="bg-ink-100 min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-16' : 'lg:pl-64')}>
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
          <div className="mx-auto w-full max-w-[100rem]">
            <Outlet />
          </div>
        </main>

        <footer className="border-ink-200 text-ink-500 no-print border-t px-4 py-4 text-[11px]">
          <div className="mx-auto flex max-w-[100rem] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p>EFMS · Employer Filtering Management System.</p>
            <p>Records are stored in your Supabase database.</p>
          </div>
        </footer>
      </div>

      <ToastViewport />
    </div>
  );
}
