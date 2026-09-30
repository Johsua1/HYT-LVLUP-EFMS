import { cn } from '@/lib/utils';

export type ProgressTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const BAR_TONES: Record<ProgressTone, string> = {
  brand: 'bg-brand-600',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-ink-400',
};

export interface ProgressBarProps {
  value: number;
  tone?: ProgressTone;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
  /** Renders a segmented checklist bar rather than a continuous fill. */
  segments?: number;
  segmentsFilled?: number;
}

export function ProgressBar({
  value,
  tone = 'brand',
  size = 'md',
  showLabel = false,
  label,
  className,
  segments,
  segmentsFilled,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  if (segments && segments > 0) {
    const filled = segmentsFilled ?? Math.round((clamped / 100) * segments);
    return (
      <div className={cn('flex items-center gap-1.5', className)} aria-hidden>
        {Array.from({ length: segments }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              index < filled ? BAR_TONES[tone] : 'bg-ink-200',
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-ink-600 text-xs">{label ?? 'Completion'}</span>
          <span className="tnum text-ink-800 text-xs font-semibold">{clamped}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className={cn(
          'bg-ink-200 w-full overflow-hidden rounded-full',
          size === 'sm' && 'h-1',
          size === 'md' && 'h-1.5',
          size === 'lg' && 'h-2.5',
        )}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', BAR_TONES[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

/** Compact circular indicator used in table rows. */
export function ProgressRing({
  value,
  size = 36,
  tone = 'brand',
  label,
  showValue = true,
}: {
  value: number;
  size?: number;
  tone?: ProgressTone;
  label?: string;
  showValue?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor: Record<ProgressTone, string> = {
    brand: 'var(--color-brand-600)',
    success: 'var(--color-emerald-600)',
    warning: '#f59e0b',
    danger: '#f43f5e',
    neutral: 'var(--color-ink-400)',
  };

  return (
    <span
      className="relative inline-flex items-center justify-center"
      title={label ?? `${clamped}% complete`}
      role="img"
      aria-label={label ?? `${clamped}% complete`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-ink-200)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showValue && (
        <span className="tnum text-ink-700 absolute text-[10px] font-semibold">{clamped}%</span>
      )}
    </span>
  );
}
