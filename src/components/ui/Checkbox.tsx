import type { InputHTMLAttributes, ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
  indeterminate?: boolean;
}

export function Checkbox({ label, description, indeterminate, className, id, ...rest }: CheckboxProps) {
  const inputId = id ?? rest.name;
  return (
    <label
      htmlFor={inputId}
      className={cn(
        'group flex cursor-pointer items-start gap-2.5 select-none',
        rest.disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          id={inputId}
          type="checkbox"
          className="peer sr-only"
          {...rest}
          checked={rest.checked}
          ref={(node) => {
            if (node) node.indeterminate = Boolean(indeterminate) && !rest.checked;
          }}
        />
        <span
          className={cn(
            'border-ink-300 group-hover:border-ink-400 flex h-4 w-4 items-center justify-center rounded border bg-white transition-colors',
            'peer-checked:border-brand-600 peer-checked:bg-brand-600',
            'peer-focus-visible:outline-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
          )}
        >
          <Check className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3} />
        </span>
        {indeterminate && !rest.checked && (
          <Minus className="text-brand-700 pointer-events-none absolute h-3 w-3" strokeWidth={3} />
        )}
      </span>
      {(label || description) && (
        <span className="min-w-0 leading-tight">
          {label && <span className="text-ink-800 block text-[13px]">{label}</span>}
          {description && <span className="text-ink-500 mt-0.5 block text-xs">{description}</span>}
        </span>
      )}
    </label>
  );
}

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
}

export function Switch({ label, description, className, id, ...rest }: SwitchProps) {
  const inputId = id ?? rest.name;
  return (
    <label
      htmlFor={inputId}
      className={cn('flex cursor-pointer items-start justify-between gap-4 select-none', className)}
    >
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="text-ink-800 block text-[13px] font-medium">{label}</span>}
          {description && <span className="text-ink-500 mt-0.5 block text-xs leading-relaxed">{description}</span>}
        </span>
      )}
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input id={inputId} type="checkbox" className="peer sr-only" {...rest} />
        <span className="bg-ink-300 peer-checked:bg-brand-600 h-5 w-9 rounded-full transition-colors peer-focus-visible:outline-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:opacity-50" />
        <span className="pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

/** Segmented control used for view mode and small mutually exclusive choices. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'md',
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: ReactNode }[];
  ariaLabel: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('border-ink-200 inline-flex rounded-lg border bg-white p-0.5', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[6px] font-medium transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-800',
            )}
          >
            {option.icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{option.icon}</span>}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
