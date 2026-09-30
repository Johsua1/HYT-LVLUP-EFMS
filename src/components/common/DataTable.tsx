import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { Density, TableColumn } from '@/types';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/Checkbox';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { useIsDesktop } from '@/hooks/useMediaQuery';

export interface DataTableSort {
  /** Column key (`TableColumn.sortKey`) currently applied. */
  active: string | null;
  direction: 'asc' | 'desc';
  onSort: (columnKey: string) => void;
}

export interface DataTableSelection {
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  density?: Density;
  loading?: boolean;
  /** Rendered inside the table body when `rows` is empty. */
  empty?: ReactNode;
  /** Controlled sorting. When omitted, columns with `sortValue` sort locally. */
  sort?: DataTableSort;
  selection?: DataTableSelection;
  onRowClick?: (row: T) => void;
  /** Switches to a card layout below the `md` breakpoint. */
  renderMobileCard?: (row: T) => ReactNode;
  rowClassName?: (row: T) => string;
  /** Extra content rendered directly under the table (pagination, totals…). */
  footer?: ReactNode;
  className?: string;
}

type LocalSort = { key: string; direction: 'asc' | 'desc' };

/**
 * One table implementation for the whole application.
 *
 * It supports two sorting modes so it can serve both the employer list (where
 * sorting is a global, persisted token such as `salary-desc`) and the smaller
 * reference tables (documents, contracts) that only need a client-side sort on
 * the rows currently in memory.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  density = 'comfortable',
  loading = false,
  empty,
  sort,
  selection,
  onRowClick,
  renderMobileCard,
  rowClassName,
  footer,
  className,
}: DataTableProps<T>) {
  const isDesktop = useIsDesktop();
  const [localSort, setLocalSort] = useState<LocalSort | null>(null);

  const sortedRows = useMemo(() => {
    if (sort || !localSort) return rows;
    const column = columns.find((item) => item.key === localSort.key);
    if (!column?.sortValue) return rows;

    const accessor = column.sortValue;
    const factor = localSort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = accessor(a);
      const right = accessor(b);
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor;
      return String(left).localeCompare(String(right), undefined, { numeric: true }) * factor;
    });
  }, [rows, columns, localSort, sort]);

  const visibleIds = useMemo(() => sortedRows.map(rowKey), [sortedRows, rowKey]);

  const sortableColumns = (column: TableColumn<T>) =>
    Boolean(column.sortKey || column.sortValue || column.sortable);

  const isActive = (column: TableColumn<T>) =>
    sort ? Boolean(column.sortKey) && sort.active === column.sortKey : localSort?.key === column.key;

  const directionOf = (column: TableColumn<T>): 'asc' | 'desc' =>
    sort ? sort.direction : (localSort?.direction ?? 'asc');

  const handleSort = (column: TableColumn<T>) => {
    if (!sortableColumns(column)) return;
    if (sort && column.sortKey) {
      sort.onSort(column.sortKey);
      return;
    }
    if (column.sortValue) {
      setLocalSort((current) =>
        current?.key === column.key
          ? { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
          : { key: column.key, direction: 'asc' },
      );
    }
  };

  const columnCount = columns.length + (selection ? 1 : 0);

  /* ---------------------------------------------------------------- */
  /* Loading                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        <TableSkeleton rows={6} columns={Math.min(columnCount, 7)} />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Mobile card layout                                                */
  /* ---------------------------------------------------------------- */

  if (renderMobileCard && !isDesktop) {
    if (!sortedRows.length) {
      return <div className={cn('w-full', className)}>{empty}</div>;
    }
    return (
      <div className={cn('flex flex-col gap-2.5', className)}>
        {sortedRows.map((row) => {
          const id = rowKey(row);
          return (
            <div key={id} className="relative">
              {selection && (
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox
                    checked={selection.selectedIds.includes(id)}
                    onChange={() => selection.onToggle(id)}
                    aria-label="Select row"
                  />
                </div>
              )}
              <div className={selection ? 'pl-8' : undefined}>
                {renderMobileCard(row)}
              </div>
            </div>
          );
        })}
        {footer}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Table layout                                                      */
  /* ---------------------------------------------------------------- */

  return (
    <div className={cn('w-full', className)}>
      <div className="w-full overflow-x-auto">
        <table className="efms-table" data-density={density}>
          <thead>
            <tr>
              {selection && (
                <th className="w-10 pr-0">
                  <Checkbox
                    checked={visibleIds.length > 0 && visibleIds.every((id) => selection.selectedIds.includes(id))}
                    indeterminate={
                      visibleIds.some((id) => selection.selectedIds.includes(id)) &&
                      !visibleIds.every((id) => selection.selectedIds.includes(id))
                    }
                    onChange={() => selection.onToggleAll(visibleIds)}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {columns.map((column) => {
                const active = isActive(column);
                const sortable = sortableColumns(column);
                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    aria-sort={active ? (directionOf(column) === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn(
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column)}
                        className={cn(
                          'hover:text-ink-800 -mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-semibold tracking-wider uppercase transition-colors',
                          active ? 'text-brand-700' : 'text-ink-500',
                          column.align === 'right' && 'flex-row-reverse',
                        )}
                      >
                        {column.header}
                        {active ? (
                          directionOf(column) === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="text-ink-300 h-3 w-3" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="!border-b-0">
                  {empty}
                </td>
              </tr>
            )}

            {sortedRows.map((row) => {
              const id = rowKey(row);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    selection?.selectedIds.includes(id) && 'bg-brand-50/60',
                    rowClassName?.(row),
                  )}
                >
                  {selection && (
                    <td className="pr-0" onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        checked={selection.selectedIds.includes(id)}
                        onChange={() => selection.onToggle(id)}
                        aria-label={`Select ${id}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center',
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
