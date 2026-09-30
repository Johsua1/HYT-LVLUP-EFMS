import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Page-level toolbar: search on one side, actions on the other. */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 border-b border-ink-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ToolbarGroup({
  children,
  className,
  grow = false,
}: {
  children: ReactNode;
  className?: string;
  grow?: boolean;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', grow && 'min-w-0 flex-1', className)}>
      {children}
    </div>
  );
}

/** Small labelled container used above filter inputs. */
export function FieldLabel({
  children,
  htmlFor,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn('text-ink-700 mb-1.5 block text-xs font-medium', className)}>
      {children}
    </label>
  );
}

/** Vertical rhythm helper for stacked form/filter sections. */
export function Stack({
  children,
  gap = 'md',
  className,
}: {
  children: ReactNode;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col',
        gap === 'sm' && 'gap-2',
        gap === 'md' && 'gap-4',
        gap === 'lg' && 'gap-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
