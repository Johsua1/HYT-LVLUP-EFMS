import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  options: { value: string | number; label: string; disabled?: boolean }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, containerClassName, options, placeholder, id, ...rest },
  ref,
) {
  const selectId = id ?? rest.name ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-ink-700 mb-1.5 block text-xs font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-9 w-full cursor-pointer appearance-none rounded-lg border bg-white pr-8 pl-3 text-sm transition-colors',
            'text-ink-800 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-50',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-ink-300 hover:border-ink-400 focus:border-brand-500 focus:ring-brand-500/20',
            className,
          )}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="text-ink-400 pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2" />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-ink-500 mt-1.5 text-xs">{hint}</p>
      ) : null}
    </div>
  );
});

/** Compact inline select used in toolbars — no label, tighter height. */
export function InlineSelect({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  leadingIcon,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  leadingIcon?: React.ReactNode;
}) {
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      {leadingIcon && (
        <span className="text-ink-400 pointer-events-none absolute left-2.5 [&>svg]:h-3.5 [&>svg]:w-3.5">
          {leadingIcon}
        </span>
      )}
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'border-ink-300 text-ink-700 hover:border-ink-400 focus:border-brand-500 focus:ring-brand-500/20',
          'h-9 cursor-pointer appearance-none rounded-lg border bg-white pr-8 text-[13px] font-medium focus:ring-2 focus:outline-none',
          leadingIcon ? 'pl-8' : 'pl-3',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="text-ink-400 pointer-events-none absolute right-2.5 h-4 w-4" />
    </div>
  );
}
