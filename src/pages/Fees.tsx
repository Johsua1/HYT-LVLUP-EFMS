import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Pencil, Receipt, SearchX } from 'lucide-react';
import type { EmployerRecord, FeeType, TableColumn } from '@/types';
import { FEE_TYPES } from '@/lib/constants';
import { downloadFile, formatCurrency, toCsv } from '@/lib/utils';
import { computeDashboardMetrics } from '@/lib/selectors';
import { useAppStore } from '@/store/AppStore';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { InlineSelect } from '@/components/ui/Select';
import { Toolbar, ToolbarGroup } from '@/components/common/Toolbar';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { CurrencyAmount } from '@/components/common/ValueText';
import { FeeEditor } from '@/components/fees/FeeEditor';

type FeeSortKey = 'total-asc' | 'total-desc' | 'processing-asc' | 'processing-desc' | 'name-asc';

/**
 * Fees management.
 *
 * Every figure here is computed from the fee line items, so editing a single
 * amount inside the editor moves this table, the dashboard averages and the fee
 * filters at the same time.
 */
export default function FeesPage() {
  const { records, toast } = useAppStore();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<FeeSortKey>('total-desc');
  const [editing, setEditing] = useState<EmployerRecord | null>(null);

  const metrics = useMemo(() => computeDashboardMetrics(records), [records]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = records.filter((record) =>
      needle
        ? `${record.employer.companyName} ${record.employer.country} ${record.employer.industry}`
            .toLowerCase()
            .includes(needle)
        : true,
    );

    const sorted = [...filtered];
    switch (sort) {
      case 'total-asc':
        sorted.sort((a, b) => a.totalEstimatedCost - b.totalEstimatedCost);
        break;
      case 'processing-asc':
        sorted.sort((a, b) => a.feeTotals['Processing Fee'] - b.feeTotals['Processing Fee']);
        break;
      case 'processing-desc':
        sorted.sort((a, b) => b.feeTotals['Processing Fee'] - a.feeTotals['Processing Fee']);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.employer.companyName.localeCompare(b.employer.companyName));
        break;
      case 'total-desc':
      default:
        sorted.sort((a, b) => b.totalEstimatedCost - a.totalEstimatedCost);
    }
    return sorted;
  }, [records, query, sort]);

  const pagination = usePagination(rows.length, 15);
  const pageRows = pagination.paginate(rows);

  const portfolioGross = records.reduce((sum, record) => sum + record.totalEstimatedCost, 0);

  const columns = useMemo<TableColumn<EmployerRecord>[]>(() => {
    const feeColumn = (type: FeeType): TableColumn<EmployerRecord> => ({
      key: `fee-${type}`,
      header: type,
      align: 'right',
      sortable: true,
      sortValue: (record) => record.feeTotals[type],
      render: (record) => (
        <CurrencyAmount
          value={record.feeTotals[type]}
          className={record.feeTotals[type] > 0 ? 'text-ink-700 text-[12px]' : 'text-ink-300 text-[12px]'}
        />
      ),
    });

    return [
      {
        key: 'company',
        header: 'Employer',
        locked: true,
        sortable: true,
        sortValue: (record) => record.employer.companyName,
        render: (record) => (
          <div className="min-w-0">
            <Link
              to={`/employers/${record.employer.id}`}
              className="text-ink-900 hover:text-brand-700 block truncate text-[13px] font-medium"
            >
              {record.employer.companyName}
            </Link>
            <p className="text-ink-500 truncate text-[11px]">
              {record.employer.country} · {record.employer.industry}
            </p>
          </div>
        ),
      },
      ...FEE_TYPES.map(feeColumn),
      {
        key: 'employer-borne',
        header: 'Employer-borne',
        align: 'right',
        defaultVisible: true,
        render: (record) => {
          const borne = record.fees
            .filter((fee) => fee.borneBy === 'Employer')
            .reduce((sum, fee) => sum + fee.amount, 0);
          return (
            <CurrencyAmount
              value={borne}
              className={borne > 0 ? 'text-emerald-700 text-[12px] font-medium' : 'text-ink-300 text-[12px]'}
            />
          );
        },
      },
      {
        key: 'total',
        header: 'Total to worker',
        align: 'right',
        locked: true,
        sortable: true,
        sortValue: (record) => record.totalEstimatedCost,
        render: (record) => (
          <CurrencyAmount value={record.totalEstimatedCost} className="text-ink-900 text-[13px] font-semibold" />
        ),
      },
      {
        key: 'actions',
        header: '',
        locked: true,
        align: 'right',
        width: '3.5rem',
        render: (record) => (
          <IconButton size="sm" label={`Edit fees for ${record.employer.companyName}`} onClick={() => setEditing(record)}>
            <Pencil />
          </IconButton>
        ),
      },
    ];
  }, []);

  const handleExport = () => {
    const csv = toCsv(
      rows.map((record) => {
        const row: Record<string, string | number> = { Company: record.employer.companyName, Country: record.employer.country };
        FEE_TYPES.forEach((type) => {
          row[type] = record.feeTotals[type];
        });
        row['Total to worker'] = record.totalEstimatedCost;
        return row;
      }),
    );
    downloadFile(`efms-fees-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast({ title: 'Fee schedule exported', description: `${rows.length} employers downloaded.`, variant: 'success' });
  };

  return (
    <>
      <PageHeader
        title="Fees"
        description="Processing, placement, visa, medical, documentation and insurance fees per employer, with the resulting cost to the worker."
        actions={
          <Button variant="outline" icon={<Download />} onClick={handleExport} disabled={rows.length === 0}>
            Export fee schedule
          </Button>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Average processing fee"
          value={formatCurrency(metrics.averageProcessingFee)}
          icon={<Receipt />}
          tone="brand"
          hint="Across all employers"
        />
        <StatCard
          label="Average total cost"
          value={formatCurrency(metrics.averageTotalCost)}
          icon={<Receipt />}
          tone="info"
          hint="Cost to the worker"
        />
        <StatCard
          label="Portfolio fee value"
          value={formatCurrency(portfolioGross, 'PHP', { compact: true })}
          icon={<Receipt />}
          tone="neutral"
          hint={`${records.length} employers`}
        />
        <StatCard
          label="Highest total cost"
          value={formatCurrency(rows.length ? Math.max(...rows.map((r) => r.totalEstimatedCost)) : 0)}
          icon={<Receipt />}
          tone="warning"
          hint={rows.length ? [...rows].sort((a, b) => b.totalEstimatedCost - a.totalEstimatedCost)[0].employer.companyName : '—'}
        />
      </section>

      <Card flush>
        <Toolbar>
          <ToolbarGroup grow>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search employers…"
              aria-label="Search employers by fee"
              className="border-ink-300 text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:ring-brand-500/20 h-9 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none sm:max-w-sm"
            />
            <InlineSelect
              ariaLabel="Sort fee schedule"
              options={[
                { value: 'total-desc', label: 'Highest total cost' },
                { value: 'total-asc', label: 'Lowest total cost' },
                { value: 'processing-desc', label: 'Highest processing fee' },
                { value: 'processing-asc', label: 'Lowest processing fee' },
                { value: 'name-asc', label: 'Company name (A–Z)' },
              ]}
              value={sort}
              onChange={(value) => setSort(value as FeeSortKey)}
            />
          </ToolbarGroup>
          <Badge tone="neutral">{rows.length} employers</Badge>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey={(record) => record.employer.id}
          empty={
            <EmptyState
              variant="search"
              title="No employers match"
              description={`Nothing matched “${query}”.`}
              action={
                <Button variant="outline" icon={<SearchX />} onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          }
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
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        size="lg"
        icon={<Receipt />}
        title={editing ? `Fees — ${editing.employer.companyName}` : 'Fees'}
        description="Amounts are quoted in Philippine pesos. Totals recalculate as you edit."
        footer={
          <Button variant="primary" onClick={() => setEditing(null)}>
            Done
          </Button>
        }
      >
        {editing && <FeeEditor record={editing} bare />}
      </Modal>
    </>
  );
}
