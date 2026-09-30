import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Archive,
  Download,
  Heart,
  LayoutGrid,
  Plus,
  Rows3,
  Scale,
  SearchX,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import type { EmployerRecord, FilterState, SortKey } from '@/types';
import { EMPTY_FILTERS, SORT_OPTIONS } from '@/lib/constants';
import { downloadFile, toCsv } from '@/lib/utils';
import { effectiveContractStatus } from '@/lib/selectors';
import { useAppStore } from '@/store/AppStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFilteredEmployers } from '@/hooks/useFilteredEmployers';
import { usePagination } from '@/hooks/usePagination';
import { useRowSelection } from '@/hooks/useRowSelection';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Toolbar, ToolbarGroup } from '@/components/common/Toolbar';
import { SearchBar } from '@/components/ui/Input';
import { InlineSelect } from '@/components/ui/Select';
import { Button, IconButton } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Checkbox';
import { Pagination } from '@/components/ui/Pagination';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmployerCard } from '@/components/employers/EmployerCard';
import { EmployerFormModal } from '@/components/employers/EmployerFormModal';
import { ColumnsMenu } from '@/components/employers/ColumnsMenu';
import { buildEmployerColumns } from '@/components/employers/columns';
import { DEFAULT_EMPLOYER_COLUMNS } from '@/store/AppStore';

/** Column sort tokens map onto concrete, direction-aware sort keys. */
const SORT_KEY_MAP: Record<string, { asc: SortKey; desc: SortKey }> = {
  name: { asc: 'name-asc', desc: 'name-desc' },
  country: { asc: 'country-asc', desc: 'country-desc' },
  salary: { asc: 'salary-asc', desc: 'salary-desc' },
  fee: { asc: 'fee-asc', desc: 'fee-desc' },
  requirements: { asc: 'requirements-asc', desc: 'requirements-desc' },
  updated: { asc: 'updated-asc', desc: 'updated-desc' },
  contract: { asc: 'contract-expiry-asc', desc: 'contract-expiry-desc' },
};

/**
 * Employer database.
 *
 * Search, sorting and pagination all run client-side over the in-memory record
 * set, so the table reacts instantly. Selection is deliberately kept across
 * pages so a bulk action can span more than one screen of results.
 */
export default function EmployersPage() {
  const {
    records,
    settings,
    updateSettings,
    employerColumns,
    setEmployerColumns,
    archiveEmployer,
    restoreEmployer,
    deleteEmployer,
    toggleShortlist,
    toggleComparison,
    toast,
  } = useAppStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') ?? '');
  const debouncedSearch = useDebouncedValue(searchInput, 220);
  const [sortBy, setSortBy] = useState<SortKey>('updated-desc');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployerRecord | null>(null);
  const selection = useRowSelection();
  const { confirm, dialog } = useConfirmDialog();

  /* The topbar search hands its term over through the query string. */
  useEffect(() => {
    const term = searchParams.get('q');
    if (!term) return;
    setSearchInput(term);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const filters = useMemo<FilterState>(
    () => ({ ...EMPTY_FILTERS, search: debouncedSearch, sortBy }),
    [debouncedSearch, sortBy],
  );

  const matched = useFilteredEmployers(records, filters);
  const rows = useMemo(
    () => (settings.showArchived ? matched : matched.filter((record) => record.employer.status !== 'Archived')),
    [matched, settings.showArchived],
  );

  const pagination = usePagination(rows.length, settings.rowsPerPage);
  const pageRows = pagination.paginate(rows);
  const pageIds = pageRows.map((record) => record.employer.id);

  const columns = useMemo(
    () =>
      buildEmployerColumns({
        onEdit: (record) => {
          setEditing(record);
          setFormOpen(true);
        },
        onArchive: (record) => void handleArchive(record),
        onRestore: (record) => restoreEmployer(record.employer.id),
        onDelete: (record) => void handleDelete(record),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [restoreEmployer],
  );

  const visibleColumns = useMemo(
    () => columns.filter((column) => column.locked || employerColumns.includes(column.key)),
    [columns, employerColumns],
  );

  /* ---------------------------------------------------------------- */
  /* Handlers                                                          */
  /* ---------------------------------------------------------------- */

  const handleSort = (token: string) => {
    const mapping = SORT_KEY_MAP[token];
    if (!mapping) return;
    setSortBy((current) => (current === mapping.asc ? mapping.desc : current === mapping.desc ? mapping.asc : mapping.asc));
  };

  const activeSortToken =
    Object.keys(SORT_KEY_MAP).find((token) => SORT_KEY_MAP[token].asc === sortBy || SORT_KEY_MAP[token].desc === sortBy) ??
    null;

  async function handleArchive(record: EmployerRecord) {
    const confirmed = await confirm({
      title: 'Archive employer',
      message: (
        <>
          <strong>{record.employer.companyName}</strong> will be moved to Archived. It stays in the database and can be
          restored at any time, but it is hidden from the default list and from filtering results.
        </>
      ),
      confirmLabel: 'Archive employer',
      destructive: true,
    });
    if (confirmed) archiveEmployer(record.employer.id);
  }

  async function handleDelete(record: EmployerRecord) {
    const confirmed = await confirm({
      title: 'Delete employer permanently',
      message: (
        <>
          <strong>{record.employer.companyName}</strong> and all of its job orders, fees, requirements and documents will
          be removed from this browser. This cannot be undone — use Archive instead if you only want to hide it.
        </>
      ),
      confirmLabel: 'Delete permanently',
      destructive: true,
    });
    if (confirmed) {
      deleteEmployer(record.employer.id);
      toast({ title: 'Employer deleted', description: record.employer.companyName, variant: 'info' });
    }
  }

  const handleBulkArchive = async () => {
    const confirmed = await confirm({
      title: `Archive ${selection.selectedCount} employer${selection.selectedCount === 1 ? '' : 's'}`,
      message: 'Archived employers are hidden from the default list and from filtering results.',
      confirmLabel: 'Archive selected',
      destructive: true,
    });
    if (!confirmed) return;
    selection.selectedIds.forEach((id) => archiveEmployer(id));
    selection.clear();
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirm({
      title: `Delete ${selection.selectedCount} employer${selection.selectedCount === 1 ? '' : 's'}`,
      message: 'This removes the employers and every record attached to them. This cannot be undone.',
      confirmLabel: 'Delete permanently',
      destructive: true,
    });
    if (!confirmed) return;
    selection.selectedIds.forEach((id) => deleteEmployer(id));
    toast({ title: 'Employers deleted', description: `${selection.selectedCount} removed.`, variant: 'info' });
    selection.clear();
  };

  const handleExport = () => {
    const target = selection.selectedCount > 0 ? rows.filter((r) => selection.isSelected(r.employer.id)) : rows;
    const csv = toCsv(
      target.map((record) => ({
        Company: record.employer.companyName,
        Country: record.employer.country,
        City: record.employer.city,
        Industry: record.employer.industry,
        Position: record.primaryJob?.position ?? '',
        'Salary (PHP)': `${record.salaryMinPhp}-${record.salaryMaxPhp}`,
        'Total fees (PHP)': record.totalEstimatedCost,
        'Contract status': effectiveContractStatus(record),
        'Requirement completion': `${record.requirementCompletion}%`,
        Status: record.employer.status,
        Verification: record.employer.verification,
      })),
    );
    downloadFile(`efms-employers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast({
      title: 'Export ready',
      description: `${target.length} employer record${target.length === 1 ? '' : 's'} downloaded as CSV.`,
      variant: 'success',
    });
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  const emptyState =
    records.length === 0 ? (
      <EmptyState
        title="No employers yet"
        description="Register your first overseas employer to start building the portfolio."
        action={
          <Button
            variant="primary"
            icon={<Plus />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add employer
          </Button>
        }
      />
    ) : (
      <EmptyState
        variant="search"
        title="No employers match your search"
        description={
          debouncedSearch
            ? `Nothing matched “${debouncedSearch}”. Try a different company name, country or position.`
            : 'No employers match the current view.'
        }
        action={
          <Button variant="outline" icon={<X />} onClick={() => setSearchInput('')}>
            Clear search
          </Button>
        }
      />
    );

  return (
    <>
      <PageHeader
        title="Employer database"
        description="Every registered overseas employer with their job orders, fee schedule, contract position and documentation status."
        actions={
          <>
            <Button variant="outline" icon={<Download />} onClick={handleExport} disabled={rows.length === 0}>
              Export CSV
            </Button>
            <Button
              variant="primary"
              icon={<Plus />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add employer
            </Button>
          </>
        }
      />

      <Card flush>
        {/* Toolbar ---------------------------------------------------- */}
        <Toolbar>
          <ToolbarGroup grow>
            <SearchBar
              value={searchInput}
              onValueChange={setSearchInput}
              placeholder="Search company, country, industry or position…"
              aria-label="Search employers"
              className="w-full sm:max-w-sm"
            />
            <InlineSelect
              ariaLabel="Sort employers"
              options={SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              value={sortBy}
              onChange={(value) => setSortBy(value as SortKey)}
            />
          </ToolbarGroup>

          <ToolbarGroup>
            <Segmented
              ariaLabel="View mode"
              value={settings.viewMode}
              onChange={(value) => updateSettings({ viewMode: value })}
              options={[
                { value: 'table', label: 'Table', icon: <Table2 /> },
                { value: 'card', label: 'Cards', icon: <LayoutGrid /> },
              ]}
            />
            <Segmented
              ariaLabel="Row density"
              size="sm"
              value={settings.density}
              onChange={(value) => updateSettings({ density: value })}
              options={[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'compact', label: 'Compact' },
              ]}
            />
            <ColumnsMenu
              columns={columns}
              visible={employerColumns}
              onChange={setEmployerColumns}
              onReset={() => setEmployerColumns(DEFAULT_EMPLOYER_COLUMNS)}
            />
            <IconButton
              label={settings.showArchived ? 'Hide archived employers' : 'Show archived employers'}
              active={settings.showArchived}
              onClick={() => updateSettings({ showArchived: !settings.showArchived })}
            >
              <Archive />
            </IconButton>
          </ToolbarGroup>
        </Toolbar>

        {/* Bulk selection bar ---------------------------------------- */}
        {selection.selectedCount > 0 && (
          <div className="border-brand-200 bg-brand-50 flex flex-wrap items-center gap-2 border-b px-3 py-2">
            <span className="text-brand-800 text-[13px] font-medium">
              {selection.selectedCount} selected
            </span>
            <span className="text-brand-300 hidden sm:inline">|</span>
            <Button
              size="sm"
              variant="outline"
              icon={<Heart />}
              onClick={() => {
                selection.selectedIds.forEach((id) => toggleShortlist(id));
                selection.clear();
              }}
            >
              Shortlist
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={<Scale />}
              onClick={() => {
                selection.selectedIds.forEach((id) => toggleComparison(id));
                selection.clear();
              }}
            >
              Compare
            </Button>
            <Button size="sm" variant="outline" icon={<Archive />} onClick={handleBulkArchive}>
              Archive
            </Button>
            <Button size="sm" variant="danger-outline" icon={<Trash2 />} onClick={handleBulkDelete}>
              Delete
            </Button>
            <Button size="sm" variant="ghost" icon={<X />} onClick={selection.clear} className="ml-auto">
              Clear selection
            </Button>
          </div>
        )}

        {/* Table / cards --------------------------------------------- */}
        {settings.viewMode === 'table' ? (
          <DataTable
            columns={visibleColumns}
            rows={pageRows}
            rowKey={(record) => record.employer.id}
            density={settings.density}
            empty={emptyState}
            sort={{ active: activeSortToken, direction: sortBy.endsWith('-asc') ? 'asc' : 'desc', onSort: handleSort }}
            selection={{
              selectedIds: selection.selectedIds,
              onToggle: selection.toggle,
              onToggleAll: selection.toggleAll,
            }}
            renderMobileCard={(record) => <EmployerCard record={record} />}
            footer={
              rows.length > 0 ? (
                <Pagination
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  totalItems={rows.length}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                  itemLabel="employers"
                />
              ) : null
            }
          />
        ) : rows.length === 0 ? (
          <div>{emptyState}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
              {pageRows.map((record) => (
                <EmployerCard key={record.employer.id} record={record} />
              ))}
            </div>
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={rows.length}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              itemLabel="employers"
            />
          </>
        )}
      </Card>

      <p className="text-ink-500 mt-3 flex items-center gap-1.5 text-[11px]">
        <Rows3 className="h-3.5 w-3.5" />
        Showing {pageRows.length} of {rows.length} employers
        {!settings.showArchived && ' · archived employers are hidden'}
      </p>

      <EmployerFormModal open={formOpen} onClose={() => setFormOpen(false)} record={editing} />
      {dialog}
    </>
  );
}
