import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'danger-outline'
  | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300',
  secondary:
    'bg-ink-800 text-white shadow-sm hover:bg-ink-900 active:bg-ink-900 disabled:bg-ink-400',
  outline:
    'border border-ink-300 bg-white text-ink-700 shadow-xs hover:bg-ink-50 hover:border-ink-400 active:bg-ink-100',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-800 active:bg-ink-200',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800',
  'danger-outline': 'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 hover:border-rose-300',
  link: 'text-brand-700 underline-offset-4 hover:underline hover:text-brand-800 p-0 h-auto',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  /** Stretches to the full width of the container. */
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'outline',
    size = 'md',
    loading = false,
    icon,
    iconRight,
    block = false,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        variant === 'link' && 'h-auto p-0',
        block && 'w-full',
        className,
      )}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        icon && <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      )}
      {children}
      {iconRight && !loading && <span className="[&>svg]:h-4 [&>svg]:w-4">{iconRight}</span>}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  label: string;
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', label, active = false, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md transition-colors',
        'focus-visible:outline-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
        active && variant === 'ghost' && 'bg-brand-50 text-brand-700',
        className,
      )}
      {...rest}
    >
      <span className="[&>svg]:h-4 [&>svg]:w-4">{children}</span>
    </button>
  );
});
