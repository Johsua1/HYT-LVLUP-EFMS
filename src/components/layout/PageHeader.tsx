import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  /** Rendered on a second row — status badges, KPI chips, tab bars. */
  meta?: ReactNode;
  className?: string;
}

/**
 * Consistent page masthead: breadcrumb trail, title, description and an action
 * cluster. Every page uses it so vertical rhythm and heading levels match.
 */
export function PageHeader({ title, description, breadcrumbs, actions, meta, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="text-ink-500 flex flex-wrap items-center gap-1 text-[11px]">
            {breadcrumbs.map((crumb, index) => {
              const last = index === breadcrumbs.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {crumb.to && !last ? (
                    <Link to={crumb.to} className="hover:text-brand-700 rounded underline-offset-2 hover:underline">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={cn(last && 'text-ink-700 font-medium')}>{crumb.label}</span>
                  )}
                  {!last && <ChevronRight className="text-ink-300 h-3 w-3" />}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-ink-900 text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
          {description && (
            <p className="text-ink-500 mt-1 max-w-3xl text-[13px] leading-relaxed">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {meta && <div className="mt-3">{meta}</div>}
    </div>
  );
}
