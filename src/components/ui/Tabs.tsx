import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
  tone?: 'default' | 'warning' | 'danger';
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
  variant = 'underline',
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pill';
}) {
  if (variant === 'pill') {
    return (
      <div
        role="tablist"
        className={cn('no-scrollbar flex gap-1 overflow-x-auto rounded-lg bg-ink-100 p-1', className)}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                isActive ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-800',
              )}
            >
              {tab.icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'tnum rounded px-1.5 py-0.5 text-[10px] font-semibold',
                    isActive ? 'bg-brand-50 text-brand-700' : 'bg-ink-200 text-ink-600',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={cn('no-scrollbar border-ink-200 flex gap-1 overflow-x-auto border-b', className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative -mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'border-brand-600 text-brand-700'
                : 'text-ink-500 hover:text-ink-800 border-transparent hover:border-ink-300',
            )}
          >
            {tab.icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'tnum rounded px-1.5 py-0.5 text-[10px] font-semibold',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : tab.tone === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : tab.tone === 'danger'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-ink-100 text-ink-600',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
