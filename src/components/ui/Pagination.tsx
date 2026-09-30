import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './Button';

/** Builds a page list with ellipses, e.g. 1 … 4 5 6 … 20 */
function pageWindow(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('gap');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push('gap');
  pages.push(total);

  return pages;
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = 'records',
  className,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalItems);
  const pages = pageWindow(safePage, pageCount);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 px-3 py-3 sm:flex-row',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <p className="text-ink-500 text-xs">
          Showing <span className="tnum text-ink-800 font-semibold">{from}</span>–
          <span className="tnum text-ink-800 font-semibold">{to}</span> of{' '}
          <span className="tnum text-ink-800 font-semibold">{totalItems}</span> {itemLabel}
        </p>
        {onPageSizeChange && (
          <label className="text-ink-500 flex items-center gap-1.5 text-xs">
            <span className="hidden sm:inline">Rows</span>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="border-ink-300 text-ink-700 focus:border-brand-500 focus:ring-brand-500/20 h-7 cursor-pointer rounded-md border bg-white px-1.5 text-xs focus:ring-2 focus:outline-none"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <IconButton
          size="sm"
          label="First page"
          onClick={() => onPageChange(1)}
          disabled={safePage === 1}
          className="hidden sm:inline-flex"
        >
          <ChevronsLeft />
        </IconButton>
        <IconButton
          size="sm"
          label="Previous page"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
        >
          <ChevronLeft />
        </IconButton>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((entry, index) =>
            entry === 'gap' ? (
              <span key={`gap-${index}`} className="text-ink-400 px-1.5 text-xs">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPageChange(entry)}
                aria-current={entry === safePage ? 'page' : undefined}
                className={cn(
                  'tnum h-7 min-w-7 rounded-md px-2 text-xs font-medium transition-colors',
                  entry === safePage
                    ? 'bg-brand-600 text-white'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )}
              >
                {entry}
              </button>
            ),
          )}
        </div>

        <span className="tnum text-ink-500 px-1 text-xs sm:hidden">
          {safePage} / {pageCount}
        </span>

        <IconButton
          size="sm"
          label="Next page"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === pageCount}
        >
          <ChevronRight />
        </IconButton>
        <IconButton
          size="sm"
          label="Last page"
          onClick={() => onPageChange(pageCount)}
          disabled={safePage === pageCount}
          className="hidden sm:inline-flex"
        >
          <ChevronsRight />
        </IconButton>
      </nav>
    </div>
  );
}
