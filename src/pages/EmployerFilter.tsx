import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Filter,
  LayoutGrid,
  RotateCcw,
  Scale,
  SlidersHorizontal,
  Table2,
  X,
} from 'lucide-react';
import type { EmployerRecord, FilterState, SortKey } from '@/types';
import { EMPTY_FILTERS, SORT_OPTIONS } from '@/lib/constants';
import { countActiveFilters, normalizeFilters } from '@/lib/filters';
import { deriveFilterOptions } from '@/lib/selectors';
import { useAppStore } from '@/store/AppStore';
import { useFilteredEmployers } from '@/hooks/useFilteredEmployers';
import { usePagination } from '@/hooks/usePagination';
import { useRowSelection } from '@/hooks/useRowSelection';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InlineSelect } from '@/components/ui/Select';
import { Segmented } from '@/components/ui/Checkbox';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/common/DataTable';
import { EmployerCard } from '@/components/employers/EmployerCard';
import { EmployerFormModal } from '@/components/employers/EmployerFormModal';
import { buildEmployerColumns } from '@/components/employers/columns';
import { ActiveFilterBar } from '@/components/filters/ActiveFilterBar';
import { FilterDrawer } from '@/components/filters/FilterDrawer';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { SavedFilters } from '@/components/filters/SavedFilters';

const SORT_KEY_MAP: Record<string, { asc: SortKey; desc: SortKey }> = {
  name: { asc: 'name-asc', desc: 'name-desc' },
  country: { asc: 'country-asc', desc: 'country-desc' },
  salary: { asc: 'salary-asc', desc: 'salary-desc' },
  fee: { asc: 'fee-asc', desc: 'fee-desc' },
  requirements: { asc: 'requirements-asc', desc: 'requirements-desc' },
  updated: { asc: 'updated-asc', desc: 'updated-desc' },
  contract: { asc: 'contract-expiry-asc', desc: 'contract-expiry-desc' },
};

const serialize = (filters: FilterState) => JSON.stringify(filters);

/**
 * Advanced employer filtering — the primary workspace.
 *
 * Criteria are combined with AND semantics: country, industry, salary, fees,
 * benefits, contract and requirement status all narrow the same result set, and
 * the count updates on every keystroke. Filters are held in local state so the
 * user can experiment freely, then committed to localStorage with
 * "Apply filters" (or discarded with "Reset").
 */
export default function EmployerFilterPage() {
  const {
    records,
    settings,
    updateSettings,
    savedFilters,
    persistFilters,
    presets,
    savePreset,
    deletePreset,
    markPresetUsed,
    archiveEmployer,
    restoreEmployer,
    deleteEmployer,
    isComparing,
    toggleComparison,
    toast,
  } = useAppStore();

  const defaults = useMemo<FilterState>(
    () => ({
      ...EMPTY_FILTERS,
      country: settings.defaultCountry ? [settings.defaultCountry] : [],
      employerStatus: settings.defaultEmployerStatus ? [settings.defaultEmployerStatus] : [],
    }),
    [settings.defaultCountry, settings.defaultEmployerStatus],
  );

  const [filters, setFilters] = useState<FilterState>(() => savedFilters ?? defaults);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployerRecord | null>(null);
  const selection = useRowSelection();
  const { confirm, dialog } = useConfirmDialog();

  /* The committed set is the baseline "Reset" returns to. */
  const applied = savedFilters ?? defaults;
  const dirty = serialize(filters) !== serialize(applied);
  const activeCount = countActiveFilters(filters);

  useEffect(() => {
    if (!savedFilters) return;
    setFilters(savedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedFilters]);

  const options = useMemo(() => deriveFilterOptions(records), [records]);
  const results = useFilteredEmployers(records, filters);
  const pagination = usePagination(results.length, settings.rowsPerPage);
  const pageRows = pagination.paginate(results);

  const patchFilters = (patch: Partial<FilterState>) =>
    setFilters((current) => normalizeFilters({ ...current, ...patch }));

  const handleApply = () => {
    persistFilters(filters);
    setDrawerOpen(false);
    toast({
      title: 'Filters applied',
      description: `${results.length} employer${results.length === 1 ? '' : 's'} match. The criteria are saved in this browser.`,
      variant: 'success',
    });
  };

  const handleReset = () => {
    setFilters(applied);
    toast({ title: 'Filters reset', description: 'Returned to the last applied criteria.', variant: 'info' });
  };

  const handleClearAll = () => {
    setFilters((current) => ({ ...EMPTY_FILTERS, sortBy: current.sortBy }));
    toast({ title: 'All filters cleared', description: `Showing all ${records.length} employers.`, variant: 'info' });
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find((entry) => entry.id === presetId);
    if (!preset) return;
    const next = normalizeFilters(preset.filters);
    setFilters(next);
    persistFilters(next);
    markPresetUsed(preset.id);
    setDrawerOpen(false);
    toast({ title: `Filter applied: ${preset.name}`, description: preset.description, variant: 'success' });
  };

  const handleSortToken = (token: string) => {
    const mapping = SORT_KEY_MAP[token];
    if (!mapping) return;
    setFilters((current) => ({
      ...current,
      sortBy:
        current.sortBy === mapping.asc ? mapping.desc : current.sortBy === mapping.desc ? mapping.asc : mapping.asc,
    }));
  };

  const activeSortToken =
    Object.keys(SORT_KEY_MAP).find(
      (token) => SORT_KEY_MAP[token].asc === filters.sortBy || SORT_KEY_MAP[token].desc === filters.sortBy,
    ) ?? null;

  const columns = useMemo(
    () =>
      buildEmployerColumns({
        onEdit: (record) => {
          setEditing(record);
          setFormOpen(true);
        },
        onArchive: (record) => {
          void confirm({
            title: 'Archive employer',
            message: `${record.employer.companyName} will be hidden from the default list and from filtering results.`,
            confirmLabel: 'Archive employer',
            destructive: true,
          }).then((confirmed) => confirmed && archiveEmployer(record.employer.id));
        },
        onRestore: (record) => restoreEmployer(record.employer.id),
        onDelete: (record) => {
          void confirm({
            title: 'Delete employer permanently',
            message: `${record.employer.companyName} and all attached records will be removed. This cannot be undone.`,
            confirmLabel: 'Delete permanently',
            destructive: true,
          }).then((confirmed) => {
            if (confirmed) {
              deleteEmployer(record.employer.id);
              toast({ title: 'Employer deleted', description: record.employer.companyName, variant: 'info' });
            }
          });
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [archiveEmployer, restoreEmployer, deleteEmployer, confirm, toast],
  );

  const panel = (
    <FilterPanel
      filters={filters}
      onChange={patchFilters}
      onClearAll={handleClearAll}
      onReset={handleReset}
      options={options}
      resultCount={results.length}
      totalCount={records.length}
    />
  );

  const emptyState = (
    <EmptyState
      variant="search"
      title="No employers match these criteria"
      description={
        activeCount > 0
          ? 'The combination is too narrow. Remove a chip above or clear all filters to widen the search.'
          : 'There are no employers in the database yet.'
      }
      action={
        activeCount > 0 ? (
          <Button variant="outline" icon={<X />} onClick={handleClearAll}>
            Clear all filters
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add employer
          </Button>
        )
      }
    />
  );

  return (
    <>
      <PageHeader
        title="Employer filtering"
        description="Combine country, industry, salary, fee, benefit and contract criteria to narrow the employer pool. Every filter is additive — an employer must satisfy all of them."
        actions={
          <>
            <Button
              variant="outline"
              icon={<Filter />}
              className="lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              Filters
              {activeCount > 0 && (
                <span className="bg-brand-600 ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {activeCount}
                </span>
              )}
            </Button>
            <Button variant="outline" icon={<RotateCcw />} onClick={handleReset} disabled={!dirty}>
              Reset
            </Button>
            <Button variant="primary" icon={<Check />} onClick={handleApply} disabled={!dirty}>
              Apply filters
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
        {/* Filter panel — desktop */}
        <aside className="hidden lg:block">
          <Card flush className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-hidden">
            <div className="border-ink-200 flex items-center gap-2 border-b px-4 py-3">
              <SlidersHorizontal className="text-ink-400 h-4 w-4" />
              <h2 className="text-ink-900 text-[13px] font-semibold">Filter criteria</h2>
              {activeCount > 0 && (
                <span className="bg-brand-50 text-brand-700 tnum ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold">
                  {activeCount} active
                </span>
              )}
            </div>
            {panel}
          </Card>
        </aside>

        {/* Results */}
        <div className="min-w-0">
          <Card flush>
            <SavedFilters
              presets={presets}
              currentFilters={filters}
              onApply={(preset) => applyPreset(preset.id)}
              onSave={(name, description) => savePreset(name, description, filters)}
              onDelete={(preset) => {
                void confirm({
                  title: 'Delete saved filter',
                  message: `“${preset.name}” will be removed from this browser.`,
                  confirmLabel: 'Delete filter',
                  destructive: true,
                }).then((confirmed) => confirmed && deletePreset(preset.id));
              }}
            />

            <ActiveFilterBar
              filters={filters}
              onFiltersChange={setFilters}
              onClearAll={handleClearAll}
              resultCount={results.length}
              totalCount={records.length}
              dirty={dirty}
              onApply={handleApply}
            />

            {/* Results toolbar */}
            <div className="border-ink-200 flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <InlineSelect
                  ariaLabel="Sort filtered results"
                  options={SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                  value={filters.sortBy}
                  onChange={(value) => setFilters((current) => ({ ...current, sortBy: value as SortKey }))}
                />
                {selection.selectedCount > 0 && (
                  <span className="text-ink-600 text-xs">
                    {selection.selectedCount} selected ·{' '}
                    <button
                      type="button"
                      className="text-brand-700 hover:underline"
                      onClick={() => {
                        selection.selectedIds.forEach((id) => archiveEmployer(id));
                        selection.clear();
                      }}
                    >
                      archive
                    </button>
                  </span>
                )}
              </div>
              <Segmented
                ariaLabel="Result view"
                value={settings.viewMode}
                onChange={(value) => updateSettings({ viewMode: value })}
                options={[
                  { value: 'table', label: 'Table', icon: <Table2 /> },
                  { value: 'card', label: 'Cards', icon: <LayoutGrid /> },
                ]}
              />
            </div>

            {settings.viewMode === 'table' ? (
              <DataTable
                columns={columns}
                rows={pageRows}
                rowKey={(record) => record.employer.id}
                density={settings.density}
                empty={emptyState}
                sort={{
                  active: activeSortToken,
                  direction: filters.sortBy.endsWith('-asc') ? 'asc' : 'desc',
                  onSort: handleSortToken,
                }}
                selection={{
                  selectedIds: selection.selectedIds,
                  onToggle: selection.toggle,
                  onToggleAll: selection.toggleAll,
                }}
                renderMobileCard={(record) => <EmployerCard record={record} />}
                footer={
                  results.length > 0 ? (
                    <Pagination
                      page={pagination.page}
                      pageSize={pagination.pageSize}
                      totalItems={results.length}
                      onPageChange={pagination.setPage}
                      onPageSizeChange={pagination.setPageSize}
                      itemLabel="matching employers"
                    />
                  ) : null
                }
              />
            ) : results.length === 0 ? (
              <div>{emptyState}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 2xl:grid-cols-3">
                  {pageRows.map((record) => (
                    <EmployerCard key={record.employer.id} record={record} />
                  ))}
                </div>
                <Pagination
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  totalItems={results.length}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                  itemLabel="matching employers"
                />
              </>
            )}
          </Card>

          {results.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-ink-500 text-[11px]">
                {results.length} of {records.length} employers match {activeCount} active criterion
                {activeCount === 1 ? '' : 'a'}.
              </p>
              {results.length >= 2 && (
                <Button
                  size="xs"
                  variant="outline"
                  icon={<Scale />}
                  onClick={() => {
                    results.slice(0, 4).forEach((record) => {
                      if (!isComparing(record.employer.id)) toggleComparison(record.employer.id);
                    });
                    toast({
                      title: 'Comparison updated',
                      description: 'The first four results were added to the comparison workspace.',
                      variant: 'success',
                    });
                  }}
                >
                  Compare first four results
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter drawer — mobile */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<X />} onClick={handleClearAll} className="flex-1">
              Clear all
            </Button>
            <Button variant="primary" size="sm" icon={<Check />} onClick={handleApply} className="flex-1">
              Show {results.length} result{results.length === 1 ? '' : 's'}
            </Button>
          </div>
        }
      >
        {panel}
      </FilterDrawer>

      <EmployerFormModal open={formOpen} onClose={() => setFormOpen(false)} record={editing} />
      {dialog}
    </>
  );
}
