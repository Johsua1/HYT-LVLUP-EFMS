import type { ReactNode } from 'react';
import type { BadgeTone } from '@/types';
import { cn } from '@/lib/utils';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
};

const DOTS: Record<BadgeTone, string> = {
  neutral: 'bg-ink-400',
  brand: 'bg-brand-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
};

const SOLID: Record<BadgeTone, string> = {
  neutral: 'bg-ink-700 text-white ring-ink-700',
  brand: 'bg-brand-600 text-white ring-brand-600',
  success: 'bg-emerald-600 text-white ring-emerald-600',
  warning: 'bg-amber-500 text-white ring-amber-500',
  danger: 'bg-rose-600 text-white ring-rose-600',
  info: 'bg-sky-600 text-white ring-sky-600',
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  /** Renders a leading status dot — useful in dense tables. */
  dot?: boolean;
  solid?: boolean;
  size?: 'sm' | 'md';
  icon?: ReactNode;
  className?: string;
  title?: string;
}

export function Badge({
  tone = 'neutral',
  children,
  dot = false,
  solid = false,
  size = 'sm',
  icon,
  className,
  title,
}: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        solid ? SOLID[tone] : TONES[tone],
        className,
      )}
    >
      {dot && !solid && <span className={cn('h-1.5 w-1.5 rounded-full', DOTS[tone])} aria-hidden />}
      {icon && <span className="[&>svg]:h-3 [&>svg]:w-3">{icon}</span>}
      {children}
    </span>
  );
}

/** Numeric pill used for counts in navigation and headers. */
export function CountPill({
  value,
  tone = 'neutral',
  className,
}: {
  value: number;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'tnum inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
        TONES[tone],
        className,
      )}
    >
      {value}
    </span>
  );
}
