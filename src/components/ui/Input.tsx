import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const FIELD_BASE =
  'w-full rounded-lg border bg-white text-sm text-ink-800 placeholder:text-ink-400 transition-colors ' +
  'focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500';

function stateClasses(invalid?: boolean) {
  return invalid
    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
    : 'border-ink-300 hover:border-ink-400 focus:border-brand-500 focus:ring-brand-500/20';
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon, suffix, className, containerClassName, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-ink-700 mb-1.5 block text-xs font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="text-ink-400 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            FIELD_BASE,
            stateClasses(Boolean(error)),
            'h-9 px-3',
            icon && 'pl-9',
            suffix && 'pr-9',
            className,
          )}
          {...rest}
        />
        {suffix && (
          <span className="absolute top-1/2 right-2.5 -translate-y-1/2 [&>svg]:h-4 [&>svg]:w-4">
            {suffix}
          </span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-ink-500 mt-1.5 text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, containerClassName, id, rows = 3, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-ink-700 mb-1.5 block text-xs font-medium">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD_BASE, stateClasses(Boolean(error)), 'resize-y px-3 py-2 leading-relaxed', className)}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-ink-500 mt-1.5 text-xs">{hint}</p>
      ) : null}
    </div>
  );
});

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onValueChange,
  onClear,
  placeholder = 'Search…',
  className,
  ...rest
}: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="text-ink-400 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <input
        type="search"
        role="searchbox"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          FIELD_BASE,
          stateClasses(false),
          'h-9 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden',
        )}
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onValueChange('');
            onClear?.();
          }}
          aria-label="Clear search"
          className="text-ink-400 hover:text-ink-700 hover:bg-ink-100 absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/** Range input pair used by the numeric filter groups. */
export function NumberRangeInput({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
  prefix,
  placeholderMin = 'Min',
  placeholderMax = 'Max',
}: {
  label: string;
  min: number | null;
  max: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
  prefix?: string;
  placeholderMin?: string;
  placeholderMax?: string;
}) {
  const parse = (raw: string): number | null => {
    if (raw.trim() === '') return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  };

  return (
    <div>
      <span className="text-ink-700 mb-1.5 block text-xs font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {prefix && (
            <span className="text-ink-400 pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs">
              {prefix}
            </span>
          )}
          <input
            type="number"
            inputMode="numeric"
            value={min ?? ''}
            placeholder={placeholderMin}
            onChange={(event) => onMinChange(parse(event.target.value))}
            className={cn(FIELD_BASE, stateClasses(false), 'h-9', prefix ? 'pl-7' : 'pl-3', 'pr-2')}
          />
        </div>
        <span className="text-ink-400 text-xs">to</span>
        <div className="relative flex-1">
          {prefix && (
            <span className="text-ink-400 pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs">
              {prefix}
            </span>
          )}
          <input
            type="number"
            inputMode="numeric"
            value={max ?? ''}
            placeholder={placeholderMax}
            onChange={(event) => onMaxChange(parse(event.target.value))}
            className={cn(FIELD_BASE, stateClasses(false), 'h-9', prefix ? 'pl-7' : 'pl-3', 'pr-2')}
          />
        </div>
      </div>
    </div>
  );
}

/** Single numeric ceiling input used for the financial filter group. */
export function MaxAmountInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-ink-700 mb-1.5 block text-xs font-medium">{label}</label>
      <div className="relative">
        <span className="text-ink-400 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs">₱</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value ?? ''}
          placeholder={placeholder ?? 'No limit'}
          onChange={(event) => {
            const raw = event.target.value;
            onChange(raw.trim() === '' ? null : Number(raw));
          }}
          className={cn(FIELD_BASE, stateClasses(false), 'h-9 pr-2 pl-7')}
        />
      </div>
      {hint && <p className="text-ink-500 mt-1.5 text-xs">{hint}</p>}
    </div>
  );
}
