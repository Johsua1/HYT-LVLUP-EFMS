import type { ReactNode } from 'react';
import { Inbox, SearchX, AlertOctagon, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EmptyStateVariant = 'default' | 'search' | 'error' | 'documents';

const ICONS: Record<EmptyStateVariant, ReactNode> = {
  default: <Inbox />,
  search: <SearchX />,
  error: <AlertOctagon />,
  documents: <FolderOpen />,
};

export function EmptyState({
  title,
  description,
  action,
  variant = 'default',
  className,
  compact = false,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  variant?: EmptyStateVariant;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-8' : 'px-6 py-14',
        className,
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-full',
          compact ? 'h-10 w-10' : 'h-12 w-12',
          variant === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-ink-100 text-ink-400',
        )}
      >
        <span className={compact ? '[&>svg]:h-5 [&>svg]:w-5' : '[&>svg]:h-6 [&>svg]:w-6'}>
          {ICONS[variant]}
        </span>
      </span>
      <h3 className={cn('text-ink-800 mt-3 font-semibold', compact ? 'text-sm' : 'text-[15px]')}>{title}</h3>
      {description && (
        <p className="text-ink-500 mt-1.5 max-w-md text-[13px] leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
