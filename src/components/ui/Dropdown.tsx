import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger' | 'brand';
  hint?: string;
}

export interface DropdownSection {
  key: string;
  label?: string;
  items: DropdownItem[];
}

export interface DropdownProps {
  /** Render prop so the trigger can be any element without nesting buttons. */
  trigger: (props: { open: boolean; toggle: () => void; ref: React.Ref<HTMLButtonElement> }) => ReactNode;
  sections: DropdownSection[];
  align?: 'start' | 'end';
  width?: number;
  className?: string;
}

export function Dropdown({ trigger, sections, align = 'end', width = 232, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuId = useId();

  const flatItems = sections.flatMap((section) => section.items);

  useEffect(() => {
    if (!open) return;
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

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => {
        menuRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();
      });
      return () => cancelAnimationFrame(raf);
    }
    setActiveIndex(-1);
    return undefined;
  }, [open]);

  const focusItem = (index: number) => {
    const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
    if (!buttons?.length) return;
    const clamped = (index + buttons.length) % buttons.length;
    buttons[clamped]?.focus();
    setActiveIndex(clamped);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((value) => !value), ref: triggerRef })}

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              focusItem(activeIndex + 1);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              focusItem(activeIndex - 1);
            } else if (event.key === 'Tab') {
              setOpen(false);
            }
          }}
          style={{ width }}
          className={cn(
            'animate-slide-up absolute z-40 mt-1.5 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-ink-200 bg-white py-1 shadow-raised',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {sections.map((section, sectionIndex) => (
            <div key={section.key}>
              {sectionIndex > 0 && <div className="bg-ink-100 my-1 h-px" />}
              {section.label && (
                <p className="text-ink-400 px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onSelect?.();
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors',
                    'disabled:cursor-not-allowed disabled:opacity-40',
                    item.tone === 'danger'
                      ? 'text-rose-700 hover:bg-rose-50'
                      : item.tone === 'brand'
                        ? 'text-brand-700 hover:bg-brand-50'
                        : 'text-ink-700 hover:bg-ink-100',
                  )}
                >
                  {item.icon && (
                    <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="text-ink-400 shrink-0 text-[11px]">{item.hint}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
