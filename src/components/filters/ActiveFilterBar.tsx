import { Check, Filter, RotateCcw, X } from 'lucide-react';
import type { FilterState } from '@/types';
import { buildFilterChips, countActiveFilters, removeFilterChip } from '@/lib/filters';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export interface ActiveFilterBarProps {
  filters: FilterState;
  /** Applies a fully-formed filter state (chip removal). */
  onFiltersChange: (next: FilterState) => void;
  onClearAll: () => void;
  resultCount: number;
  totalCount: number;
  /** True when the workspace holds changes that have not been committed yet. */
  dirty?: boolean;
  onApply?: () => void;
  className?: string;
}

/**
 * Selected-criteria summary.
 *
 * Every chip is individually removable, which matters because the most common
 * correction is "everything is right except this one criterion" — the user
 * should not have to reopen the whole panel to undo a single choice.
 */
export function ActiveFilterBar({
  filters,
  onFiltersChange,
  onClearAll,
  resultCount,
  totalCount,
  dirty = false,
  onApply,
  className,
}: ActiveFilterBarProps) {
  const chips = buildFilterChips(filters);
  const activeCount = countActiveFilters(filters);

  return (
    <div
      className={cn(
        'border-ink-200 flex flex-col gap-2.5 border-b px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="text-ink-500 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
          <Filter className="h-3.5 w-3.5" />
          {activeCount > 0 ? `${activeCount} active` : 'No filters'}
        </span>

        {chips.length === 0 ? (
          <span className="text-ink-500 text-xs">
            All {totalCount} employers are shown. Add criteria to narrow the list.
          </span>
        ) : (
          chips.map((chip) => (
            <span
              key={chip.id}
              className="border-brand-200 bg-brand-50 text-brand-800 inline-flex max-w-full items-center gap-1 rounded-md border py-0.5 pr-1 pl-2 text-[11px] font-medium"
            >
              <span className="text-brand-600/80 shrink-0">{chip.label}:</span>
              <span className="truncate">{chip.value}</span>
              <button
                type="button"
                onClick={() => onFiltersChange(removeFilterChip(filters, chip.id))}
                aria-label={`Remove ${chip.label} filter`}
                className="text-brand-600 hover:bg-brand-100 hover:text-brand-900 shrink-0 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}

        {chips.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-ink-500 hover:text-ink-800 hover:bg-ink-100 ml-1 inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium"
          >
            <RotateCcw className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <p className="text-ink-600 text-[13px] whitespace-nowrap">
          <span className="text-ink-900 tnum font-semibold">{resultCount}</span>
          <span className="text-ink-500"> employer{resultCount === 1 ? '' : 's'} found</span>
        </p>
        {onApply && (
          <Button
            variant={dirty ? 'primary' : 'outline'}
            size="sm"
            icon={<Check />}
            onClick={onApply}
            title="Commit these criteria and keep them after a refresh"
          >
            Apply filters
          </Button>
        )}
      </div>
    </div>
  );
}
