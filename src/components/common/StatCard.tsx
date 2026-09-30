import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const ICON_TONES: Record<StatTone, string> = {
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
  neutral: 'bg-ink-100 text-ink-600',
};

const VALUE_TONES: Record<StatTone, string> = {
  brand: 'text-ink-900',
  success: 'text-ink-900',
  warning: 'text-ink-900',
  danger: 'text-rose-700',
  info: 'text-ink-900',
  neutral: 'text-ink-900',
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  /** Optional delta indicator, e.g. `{ value: '3', direction: 'up', label: 'vs last month' }`. */
  delta?: { value: string; direction: 'up' | 'down' | 'flat'; label?: string };
  to?: string;
  className?: string;
}

/**
 * Dashboard KPI tile. Renders as a link when `to` is supplied so the number is
 * always a route into the underlying list rather than a dead end.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  delta,
  to,
  className,
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-ink-500 text-[11px] font-semibold tracking-wide uppercase">{label}</p>
        {icon && (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4',
              ICON_TONES[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <p className={cn('tnum mt-3 text-2xl leading-none font-semibold', VALUE_TONES[tone])}>{value}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-semibold',
              delta.direction === 'up' && 'text-emerald-600',
              delta.direction === 'down' && 'text-rose-600',
              delta.direction === 'flat' && 'text-ink-500',
            )}
          >
            {delta.direction === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : delta.direction === 'down' ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {delta.value}
          </span>
        )}
        {hint && <span className="text-ink-500 text-xs">{hint}</span>}
      </div>
    </>
  );

  const classes = cn(
    'border-ink-200 shadow-card rounded-card block border bg-white p-4',
    to && 'hover:border-brand-300 transition-colors hover:shadow-md',
    className,
  );

  return to ? (
    <Link to={to} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
