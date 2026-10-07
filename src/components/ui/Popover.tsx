import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
  /**
   * Detach the panel from the trigger on phones. Below `sm` it becomes a
   * full-width sheet pinned under the app header, then snaps back to a normal
   * anchored dropdown from `sm` up. Use this for edge-anchored panels whose
   * fixed width would otherwise overflow a narrow viewport — e.g. the
   * notification centre, which is anchored to a bell that sits well in from
   * the right edge because the account menu is beside it.
   */
  mobileFull?: boolean;
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
  mobileFull = false,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const widthValue = typeof width === 'number' ? `${width}px` : width;

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
          style={
            mobileFull
              ? ({ '--efms-popover-width': widthValue } as CSSProperties)
              : { width }
          }
          className={cn(
            'animate-slide-up border-ink-200 shadow-raised z-40 overflow-hidden rounded-lg border bg-white',
            mobileFull
              ? cn(
                  // Phones: a full-width sheet pinned just below the sticky header.
                  'fixed top-[3.75rem] right-3 left-3',
                  // `sm` and up: back to a normal dropdown anchored to the trigger.
                  'sm:absolute sm:top-full sm:w-[var(--efms-popover-width)] sm:max-w-[calc(100vw-2rem)]',
                  align === 'end' ? 'sm:right-0 sm:left-auto' : 'sm:left-0 sm:right-auto',
                )
              : cn(
                  'absolute max-w-[calc(100vw-2rem)]',
                  align === 'end' ? 'right-0' : 'left-0',
                ),
            dense ? 'mt-1' : 'mt-1.5',
            className,
          )}
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}
