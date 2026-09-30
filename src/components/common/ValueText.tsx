import {
  cn,
  dateOnly,
  formatCurrency,
  formatDuration,
  formatExpiryCountdown,
  formatFileSize,
  relativeTime,
} from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';

/**
 * Money and time are rendered through these components so the
 * "PHP / local currency / both" preference from Settings applies everywhere
 * without every call site reading the store.
 */

function useCurrencyMode() {
  return useAppStore().settings.currencyDisplay;
}

export function CurrencyAmount({
  value,
  currency = 'PHP',
  className,
  compact = false,
}: {
  value: number;
  currency?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn('tnum', className)}>{formatCurrency(value, currency, { compact })}</span>
  );
}

interface SalaryProps {
  minPhp: number;
  maxPhp: number;
  minLocal: number;
  maxLocal: number;
  currency: string;
  className?: string;
  compact?: boolean;
}

function SalaryValue({ minPhp, maxPhp, minLocal, maxLocal, currency, className, compact }: SalaryProps) {
  const mode = useCurrencyMode();

  if (mode === 'local' && currency !== 'PHP') {
    return (
      <span className={cn('tnum font-medium', className)}>
        {formatCurrency(minLocal, currency, { compact })} – {formatCurrency(maxLocal, currency, { compact })}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span className="tnum font-medium">
        {formatCurrency(minPhp, 'PHP', { compact })} – {formatCurrency(maxPhp, 'PHP', { compact })}
      </span>
      {mode === 'both' && currency !== 'PHP' && (
        <span className="text-ink-500 tnum text-[11px]">
          {formatCurrency(minLocal, currency, { compact })} – {formatCurrency(maxLocal, currency, { compact })}
        </span>
      )}
    </span>
  );
}

export function SalaryRange({
  minPhp,
  maxPhp,
  minLocal,
  maxLocal,
  currency,
  className,
  compact,
}: SalaryProps) {
  if (!maxPhp) return <span className="text-ink-400">—</span>;
  return (
    <SalaryValue
      minPhp={minPhp}
      maxPhp={maxPhp}
      minLocal={minLocal}
      maxLocal={maxLocal}
      currency={currency}
      className={className}
      compact={compact}
    />
  );
}

export function JobSalary({
  job,
  className,
  compact,
}: {
  job: { salaryMinPhp: number; salaryMaxPhp: number; salaryMinLocal: number; salaryMaxLocal: number; currency: string };
  className?: string;
  compact?: boolean;
}) {
  return (
    <SalaryRange
      minPhp={job.salaryMinPhp}
      maxPhp={job.salaryMaxPhp}
      minLocal={job.salaryMinLocal}
      maxLocal={job.salaryMaxLocal}
      currency={job.currency}
      className={className}
      compact={compact}
    />
  );
}

/** "Expires in 25 days" / "Expired 4 days ago" — always relative to today. */
export function ExpiryCountdown({ days, className }: { days: number | null; className?: string }) {
  const tone = days === null ? 'text-ink-500' : days < 0 ? 'text-rose-600' : days <= 30 ? 'text-amber-600' : 'text-emerald-600';
  return <span className={cn('text-xs font-medium', tone, className)}>{formatExpiryCountdown(days)}</span>;
}

export function DateText({ iso, className }: { iso: string | null | undefined; className?: string }) {
  return <span className={cn('tnum text-xs', className)}>{dateOnly(iso)}</span>;
}

export function RelativeTimeText({ iso, className }: { iso: string; className?: string }) {
  return (
    <span className={cn('text-ink-500 text-xs', className)} title={dateOnly(iso)}>
      {relativeTime(iso)}
    </span>
  );
}

export function FileSize({ kb, className }: { kb: number; className?: string }) {
  return <span className={cn('tnum text-xs', className)}>{formatFileSize(kb)}</span>;
}

export function DurationText({ months, className }: { months: number; className?: string }) {
  return <span className={cn('text-xs', className)}>{formatDuration(months)}</span>;
}
