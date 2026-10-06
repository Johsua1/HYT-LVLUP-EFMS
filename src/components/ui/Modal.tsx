import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZES: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl',
  full: 'sm:max-w-[min(96rem,96vw)]',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  /** Prevents accidental dismissal while a destructive action is confirmed. */
  dismissible?: boolean;
  icon?: ReactNode;
}

/**
 * On phones the dialog docks to the bottom of the viewport as a sheet; from the
 * `sm` breakpoint upward it becomes a centred dialog. One component, two
 * interaction patterns — no duplicated markup.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
  icon,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  /* Keep the latest handlers in refs so the effect below depends ONLY on
     `open`. Call sites pass an inline `onClose={() => …}`, so listing it as a
     dependency gave the effect a new identity on every parent render: typing a
     character re-ran the effect mid-typing and its autofocus stole focus back
     to the dialog's first control, so only one character ever landed in a
     field. */
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissibleRef.current) onCloseRef.current();
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      /* Prefer an explicit [data-autofocus] target, then the first form field,
         and only fall back to a button/link. The previous selector returned the
         first DOM match, which was always the header ✕ button. */
      const target =
        panel.querySelector<HTMLElement>('[data-autofocus]') ??
        panel.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea') ??
        panel.querySelector<HTMLElement>('button, a[href]');
      target?.focus();
    });

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      cancelAnimationFrame(raf);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-ink-900/50 backdrop-blur-[2px]"
        onClick={() => dismissible && onClose()}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'animate-slide-up relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-overlay',
          'rounded-t-2xl sm:rounded-xl',
          SIZES[size],
        )}
      >
        {(title || description) && (
          <header className="border-ink-200 flex items-start gap-3 border-b px-5 py-4">
            {icon && (
              <span className="bg-brand-50 text-brand-700 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4">
                {icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-ink-900 text-base font-semibold">{title}</h2>
              {description && <p className="text-ink-500 mt-1 text-[13px] leading-relaxed">{description}</p>}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="text-ink-400 hover:text-ink-700 hover:bg-ink-100 -mt-1 -mr-1 rounded-md p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="border-ink-200 bg-ink-50/70 flex flex-col-reverse gap-2 border-t px-5 py-3.5 sm:flex-row sm:items-center sm:justify-end">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      dismissible={!loading}
      icon={
        destructive ? (
          <AlertTriangle className="text-rose-600" />
        ) : (
          <Info className="text-brand-600" />
        )
      }
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            data-autofocus
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-ink-600 text-sm leading-relaxed">{message}</div>
    </Modal>
  );
}
