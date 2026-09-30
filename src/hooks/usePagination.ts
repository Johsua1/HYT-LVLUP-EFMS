import { useEffect, useMemo, useState } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  pageCount: number;
  /** Zero-based slice bounds for `Array.prototype.slice`. */
  start: number;
  end: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
  /** Slices any list with the current window — handy for derived collections. */
  paginate: <T>(items: T[]) => T[];
}

/**
 * Client-side pagination that keeps itself honest: when the underlying result
 * count shrinks (a filter is applied, a row is deleted) the current page is
 * pulled back into range instead of leaving the user on an empty page.
 */
export function usePagination(totalItems: number, initialPageSize = 10): PaginationState {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  /* The page size is owned by Settings, so follow it when it changes and return
     to the first page — staying on page 7 of a list that now shows 100 rows per
     page would be disorienting. */
  useEffect(() => {
    setPageSize(initialPageSize);
    setPage(1);
  }, [initialPageSize]);

  const start = (safePage - 1) * pageSize;

  return useMemo(
    () => ({
      page: safePage,
      pageSize,
      pageCount,
      start,
      end: start + pageSize,
      setPage,
      setPageSize: (size: number) => {
        setPageSize(size);
        setPage(1);
      },
      reset: () => setPage(1),
      paginate: <T,>(items: T[]) => items.slice(start, start + pageSize),
    }),
    [safePage, pageSize, pageCount, start],
  );
}
