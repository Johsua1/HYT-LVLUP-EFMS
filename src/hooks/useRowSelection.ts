import { useCallback, useMemo, useState } from 'react';

export interface RowSelection {
  selectedIds: string[];
  selectedCount: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  toggleAll: (ids: string[]) => void;
  clear: () => void;
  replace: (ids: string[]) => void;
  /** Drives the header checkbox's indeterminate state. */
  allSelected: (ids: string[]) => boolean;
  someSelected: (ids: string[]) => boolean;
}

/**
 * Selection state for a data table. Selection survives paging and filtering
 * because it is stored as a set of ids rather than row indexes — the "select
 * all" checkbox still only ever applies to the rows currently on screen.
 */
export function useRowSelection(initial: string[] = []): RowSelection {
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = useCallback((id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelected((current) => {
      const allPresent = ids.length > 0 && ids.every((id) => current.includes(id));
      if (allPresent) return current.filter((id) => !ids.includes(id));
      return Array.from(new Set([...current, ...ids]));
    });
  }, []);

  const clear = useCallback(() => setSelected([]), []);
  const replace = useCallback((ids: string[]) => setSelected(ids), []);

  return useMemo(
    () => ({
      selectedIds: selected,
      selectedCount: selected.length,
      isSelected: (id: string) => selected.includes(id),
      toggle,
      toggleAll,
      clear,
      replace,
      allSelected: (ids: string[]) => ids.length > 0 && ids.every((id) => selected.includes(id)),
      someSelected: (ids: string[]) =>
        ids.some((id) => selected.includes(id)) && !ids.every((id) => selected.includes(id)),
    }),
    [selected, toggle, toggleAll, clear, replace],
  );
}
