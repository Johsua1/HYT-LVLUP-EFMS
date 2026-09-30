import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '@/components/ui/Modal';

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * Promise-based confirmation dialogs.
 *
 * Call sites read as straight-line code (`if (!(await confirm({...}))) return;`)
 * instead of threading an extra `isDialogOpen` boolean and a resolver through
 * component state, which keeps destructive handlers easy to audit.
 */
export function useConfirmDialog() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    pendingRef.current?.resolve(confirmed);
    pendingRef.current = null;
    setPending(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const entry: PendingConfirm = { ...options, resolve };
      pendingRef.current = entry;
      setPending(entry);
    });
  }, []);

  const dialog = pending ? (
    <ConfirmDialog
      open
      title={pending.title}
      message={pending.message}
      confirmLabel={pending.confirmLabel}
      cancelLabel={pending.cancelLabel}
      destructive={pending.destructive}
      onCancel={() => settle(false)}
      onConfirm={() => settle(true)}
    />
  ) : null;

  return { confirm, dialog };
}
