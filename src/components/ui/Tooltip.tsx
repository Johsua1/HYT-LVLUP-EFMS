import { useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Placement = 'top' | 'bottom' | 'left' | 'right';

const PLACEMENT: Record<Placement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

/**
 * Lightweight, dependency-free tooltip.
 * Shows on pointer hover and keyboard focus so the information is reachable
 * without a mouse — important because most icon-only controls rely on it.
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 220,
  className,
  disabled = false,
}: {
  content: ReactNode;
  children: ReactNode;
  placement?: Placement;
  delay?: number;
  className?: string;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (disabled || !content) return;
    timer.current = setTimeout(() => setVisible(true), delay);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            'animate-fade-in pointer-events-none absolute z-50 max-w-64 rounded-md bg-ink-900 px-2.5 py-1.5 text-center text-[11px] leading-snug font-medium text-white shadow-lg',
            PLACEMENT[placement],
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
