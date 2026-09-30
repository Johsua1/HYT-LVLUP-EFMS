import { useMemo, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover } from '@/components/ui/Popover';

export interface MultiSelectOption {
  value: string;
  label: string;
  hint?: string;
}

export interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  /** Hides the label inside the trigger — used in dense toolbar contexts. */
  hideLabel?: boolean;
  className?: string;
  disabled?: boolean;
}

/**
 * Checkbox multi-select used throughout the filter panel.
 *
 * Values are held as a plain string array so a filter state can be serialised
 * to localStorage without any extra marshalling.
 */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Any',
  searchable = true,
  hideLabel = false,
  className,
  disabled = false,
}: MultiSelectProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const needle = query.trim().toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle),
    );
  }, [options, query]);

  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((entry) => entry !== optionValue)
        : [...value, optionValue],
    );
  };

  const summary =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? (options.find((option) => option.value === value[0])?.label ?? value[0])
        : `${value.length} selected`;

  return (
    <Popover
      width={280}
      className="flex max-h-[22rem] flex-col"
      trigger={({ open, toggle: toggleOpen, ref }) => (
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          onClick={toggleOpen}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            'border-ink-300 text-ink-800 hover:border-ink-400 focus:border-brand-500 focus:ring-brand-500/20',
            'flex h-9 w-full items-center gap-2 rounded-lg border bg-white px-2.5 text-left text-sm transition-colors',
            'focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500',
            value.length > 0 && 'border-brand-300 bg-brand-50/50',
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate">
            {!hideLabel && <span className="text-ink-500">{label}: </span>}
            <span className={cn('font-medium', value.length === 0 && 'text-ink-400 font-normal')}>
              {summary}
            </span>
          </span>
          {value.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              aria-label={`Clear ${label}`}
              onClick={(event) => {
                event.stopPropagation();
                onChange([]);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange([]);
                }
              }}
              className="text-ink-400 hover:text-ink-700 hover:bg-ink-100 shrink-0 rounded p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className="text-ink-400 h-4 w-4 shrink-0" />
        </button>
      )}
    >
      <div className="flex flex-col overflow-hidden">
        {searchable && options.length > 8 && (
          <div className="border-ink-200 border-b p-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="border-ink-300 text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:ring-brand-500/20 h-8 w-full rounded-md border px-2.5 text-[13px] focus:ring-2 focus:outline-none"
            />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="text-ink-500 px-3 py-3 text-xs">No options match “{query}”.</p>
          )}
          {filtered.map((option) => {
            const selected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="checkbox"
                aria-checked={selected}
                onClick={() => toggle(option.value)}
                className="hover:bg-ink-100 flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px]"
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                    selected ? 'border-brand-600 bg-brand-600' : 'border-ink-300 bg-white',
                  )}
                >
                  {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </span>
                <span className="text-ink-800 min-w-0 flex-1 truncate">{option.label}</span>
                {option.hint && <span className="text-ink-400 shrink-0 text-[11px]">{option.hint}</span>}
              </button>
            );
          })}
        </div>

        <div className="border-ink-200 bg-ink-50 flex items-center justify-between gap-2 border-t px-2 py-1.5">
          <button
            type="button"
            onClick={() => onChange(filtered.map((option) => option.value))}
            className="text-brand-700 hover:bg-brand-50 rounded px-1.5 py-1 text-[11px] font-medium"
          >
            Select all{query.trim() ? ' shown' : ''}
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={value.length === 0}
            className="text-ink-600 hover:bg-ink-100 rounded px-1.5 py-1 text-[11px] font-medium disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>
    </Popover>
  );
}
