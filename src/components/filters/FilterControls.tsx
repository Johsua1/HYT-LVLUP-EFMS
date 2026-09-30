import { useState, type ReactNode } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/Checkbox';

/* ------------------------------------------------------------------ */
/* Collapsible section                                                 */
/* ------------------------------------------------------------------ */

export interface FilterSectionProps {
  title: string;
  /** Number of active values in this section — drives the counter pill. */
  activeCount?: number;
  description?: string;
  defaultOpen?: boolean;
  onClear?: () => void;
  children: ReactNode;
}

export function FilterSection({
  title,
  activeCount = 0,
  description,
  defaultOpen = true,
  onClear,
  children,
}: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-ink-200 border-b last:border-b-0">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="group flex min-w-0 flex-1 items-center gap-2 py-3 text-left"
        >
          <ChevronDown
            className={cn('text-ink-400 h-3.5 w-3.5 shrink-0 transition-transform', !open && '-rotate-90')}
          />
          <span className="text-ink-800 truncate text-[13px] font-semibold">{title}</span>
          {activeCount > 0 && (
            <span className="bg-brand-50 text-brand-700 tnum rounded px-1.5 py-0.5 text-[10px] font-semibold">
              {activeCount}
            </span>
          )}
        </button>
        {onClear && activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded p-1"
            aria-label={`Clear ${title} filters`}
            title={`Clear ${title}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="pb-4">
          {description && <p className="text-ink-500 mb-2.5 text-[11px] leading-relaxed">{description}</p>}
          {children}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Checkbox list                                                       */
/* ------------------------------------------------------------------ */

export interface CheckboxGroupProps {
  options: { value: string; label: string; hint?: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Locks the list to a scrollable viewport once it grows past this count. */
  scrollAfter?: number;
  columns?: 1 | 2;
  emptyMessage?: string;
}

export function CheckboxGroup({
  options,
  value,
  onChange,
  scrollAfter,
  columns = 1,
  emptyMessage = 'No options available.',
}: CheckboxGroupProps) {
  if (!options.length) return <p className="text-ink-500 text-xs">{emptyMessage}</p>;

  const scrollable = scrollAfter !== undefined && options.length > scrollAfter;

  return (
    <div
      className={cn('grid gap-1.5', columns === 2 ? 'grid-cols-2' : 'grid-cols-1', scrollable && 'max-h-52 overflow-y-auto pr-1')}
    >
      {options.map((option) => (
        <Checkbox
          key={option.value}
          label={
            <span className="flex items-center gap-1.5">
              <span className="truncate">{option.label}</span>
              {option.hint && <span className="text-ink-400 text-[10px]">{option.hint}</span>}
            </span>
          }
          checked={value.includes(option.value)}
          onChange={() =>
            onChange(
              value.includes(option.value)
                ? value.filter((entry) => entry !== option.value)
                : [...value, option.value],
            )
          }
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle chips                                                        */
/* ------------------------------------------------------------------ */

export interface ToggleChipsProps {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

/** Compact multi-select for short option sets (durations, statuses, hours). */
export function ToggleChips({ options, value, onChange, className }: ToggleChipsProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {options.map((option) => {
        const active = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() =>
              onChange(
                active ? value.filter((entry) => entry !== option.value) : [...value, option.value],
              )
            }
            className={cn(
              'rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors',
              'focus-visible:outline-brand-600 focus-visible:outline-2 focus-visible:outline-offset-1',
              active
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-ink-300 text-ink-600 hover:border-ink-400 hover:bg-ink-50 hover:text-ink-800',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fee band picker                                                     */
/* ------------------------------------------------------------------ */

export interface FeeBandPickerProps {
  /** `null` means "no ceiling". */
  value: number | null;
  onChange: (value: number | null) => void;
  bands: { value: number | null; label: string }[];
}

export function FeeBandPicker({ value, onChange, bands }: FeeBandPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {bands.map((band) => {
        const active = value === band.value;
        return (
          <button
            key={band.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : band.value)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors',
              'focus-visible:outline-brand-600 focus-visible:outline-2 focus-visible:outline-offset-1',
              active
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-ink-300 text-ink-600 hover:border-ink-400 hover:bg-ink-50 hover:text-ink-800',
            )}
          >
            {band.label}
          </button>
        );
      })}
    </div>
  );
}
