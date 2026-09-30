import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PopoverProps {
  /** Render prop so the trigger can be any element without nesting buttons. */
  trigger: (props: { open: boolean; toggle: () => void; ref: React.Ref<HTMLButtonElement> }) => ReactNode;
  children: ReactNode | ((props: { close: () => void }) => ReactNode);
  align?: 'start' | 'end';
  width?: number | string;
  className?: string;
  /** Renders the panel flush against the trigger without the default offset. */
  dense?: boolean;
}

/**
 * Anchored, non-modal panel used by filter multi-selects, column pickers and
 * toolbar menus. Handles outside-click, Escape and focus return so every
 * consumer does not have to re-implement the same lifecycle.
 */
export function Popover({
  trigger,
  children,
  align = 'start',
  width = 260,
  className,
  dense = false,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {trigger({ open, toggle: () => setOpen((value) => !value), ref: triggerRef })}
      {open && (
        <div
          role="dialog"
          style={{ width }}
          className={cn(
            'animate-slide-up border-ink-200 shadow-raised absolute z-40 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-white',
            dense ? 'mt-1' : 'mt-1.5',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}
