import { useMemo } from 'react';
import type { EmployerRecord, FilterState } from '@/types';
import { filterAndSort } from '@/lib/filters';

/**
 * The single place the employer list is derived. Memoised on the record set and
 * the filter object so the dashboard, filtering workspace and reports all share
 * one consistent result without recomputing per render.
 */
export function useFilteredEmployers(
  records: EmployerRecord[],
  filters: FilterState,
): EmployerRecord[] {
  return useMemo(() => filterAndSort(records, filters), [records, filters]);
}
