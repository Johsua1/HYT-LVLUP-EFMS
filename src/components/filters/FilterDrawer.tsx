import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Sticky action row rendered below the scrollable content. */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Mobile filter sheet.
 *
 * Below `lg` the filter panel would leave no room for results, so it slides in
 * from the left as a full-height sheet instead. The content is the same
 * `FilterPanel` component — only the container changes.
 */
export function FilterDrawer({ open, onClose, title = 'Filters', footer, children }: FilterDrawerProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn('fixed inset-0 z-50 lg:hidden', open ? 'visible' : 'invisible')}
      aria-hidden={!open}
      role="dialog"
      aria-modal={open || undefined}
      aria-label={title}
    >
      <div
        className={cn('bg-ink-900/50 absolute inset-0 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute inset-y-0 left-0 flex w-full max-w-sm flex-col border-r border-ink-200 bg-white transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <header className="border-ink-200 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div>
            <h2 className="text-ink-900 text-sm font-semibold">{title}</h2>
            <p className="text-ink-500 text-[11px]">Changes apply to the results immediately.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="text-ink-500 hover:bg-ink-100 hover:text-ink-800 rounded-md p-1.5"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1">{children}</div>

        {footer && <div className="border-ink-200 shrink-0 border-t p-3">{footer}</div>}
      </div>
    </div>
  );
}
