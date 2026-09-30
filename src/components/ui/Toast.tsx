import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { ToastMessage } from '@/types';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';

const VARIANTS: Record<ToastMessage['variant'], { icon: typeof Info; accent: string; ring: string }> = {
  success: { icon: CheckCircle2, accent: 'text-emerald-600', ring: 'ring-emerald-200' },
  error: { icon: XCircle, accent: 'text-rose-600', ring: 'ring-rose-200' },
  warning: { icon: AlertTriangle, accent: 'text-amber-600', ring: 'ring-amber-200' },
  info: { icon: Info, accent: 'text-brand-600', ring: 'ring-brand-200' },
};

export function ToastViewport() {
  const { toasts, dismissToast } = useAppStore();

  if (!toasts.length) return null;

  return createPortal(
    <div
      className="no-print pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const variant = VARIANTS[toast.variant];
        const Icon = variant.icon;
        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={cn(
              'animate-slide-in-right pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg bg-white px-3.5 py-3 shadow-overlay ring-1',
              variant.ring,
            )}
          >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', variant.accent)} />
            <div className="min-w-0 flex-1">
              <p className="text-ink-900 text-[13px] font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="text-ink-500 mt-0.5 text-xs leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-ink-400 hover:text-ink-700 hover:bg-ink-100 -mt-0.5 -mr-1 rounded p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
