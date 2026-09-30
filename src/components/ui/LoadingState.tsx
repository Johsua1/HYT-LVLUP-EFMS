import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <Loader2
      aria-hidden
      className={cn(
        'text-brand-600 animate-spin',
        size === 'sm' && 'h-3.5 w-3.5',
        size === 'md' && 'h-5 w-5',
        size === 'lg' && 'h-7 w-7',
        className,
      )}
    />
  );
}

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-14', className)} role="status">
      <Spinner size="lg" />
      <p className="text-ink-500 text-[13px]">{label}</p>
    </div>
  );
}

/** Skeleton rows that mirror the real table geometry to avoid layout shift. */
export function TableSkeleton({
  rows = 8,
  columns = 6,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('w-full', className)} aria-hidden>
      <div className="border-ink-200 flex gap-4 border-b px-3 py-2.5">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="skeleton h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-ink-200/70 flex gap-4 border-b px-3 py-3.5">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="skeleton h-3.5 flex-1"
              style={{ opacity: 1 - rowIndex * 0.07 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border-ink-200 rounded-card border bg-white p-4', className)} aria-hidden>
      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-3 h-7 w-20" />
      <div className="skeleton mt-3 h-3 w-32" />
    </div>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="flex flex-col justify-end gap-2" style={{ height }} aria-hidden>
      <div className="flex flex-1 items-end gap-3">
        {[62, 84, 45, 96, 70, 58, 88].map((value, index) => (
          <div key={index} className="skeleton flex-1" style={{ height: `${value}%` }} />
        ))}
      </div>
      <div className="skeleton h-3 w-full" />
    </div>
  );
}
