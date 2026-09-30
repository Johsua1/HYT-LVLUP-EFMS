import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Removes the default padding so tables and lists can run edge to edge. */
  flush?: boolean;
  interactive?: boolean;
}

export function Card({ flush = false, interactive = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'border-ink-200 shadow-card rounded-card border bg-white',
        !flush && 'p-4',
        interactive && 'hover:border-brand-300 transition-colors hover:shadow-md',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  actions,
  icon,
  className,
  compact = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4',
        compact ? 'mb-3' : 'border-ink-200 mb-4 border-b pb-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && (
          <span className="bg-ink-100 text-ink-600 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-ink-900 truncate text-sm font-semibold">{title}</h2>
          {description && <p className="text-ink-500 mt-0.5 text-xs leading-relaxed">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-ink-200 mt-4 flex items-center justify-between gap-3 border-t pt-3', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Two-column definition list used across profile and detail screens. */
export function DetailList({
  items,
  columns = 2,
  className,
}: {
  items: { label: string; value: ReactNode; span?: boolean }[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        'grid gap-x-6 gap-y-3.5',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className={cn('min-w-0', item.span && 'sm:col-span-2 lg:col-span-3')}>
          <dt className="text-ink-500 text-[11px] font-medium tracking-wide uppercase">{item.label}</dt>
          <dd className="text-ink-800 mt-1 text-sm break-words">{item.value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
