import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Download, Eye, FileSignature, RefreshCcw } from 'lucide-react';
import type { ContractStatus, EmployerRecord, TableColumn } from '@/types';
import { CONTRACT_STATUSES } from '@/lib/constants';
import { dateOnly, downloadFile, formatExpiryCountdown, toCsv } from '@/lib/utils';
import { effectiveContractStatus } from '@/lib/selectors';
import { useAppStore } from '@/store/AppStore';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, DetailList } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Toolbar, ToolbarGroup } from '@/components/common/Toolbar';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { ContractStatusBadge, RenewalStatusBadge } from '@/components/common/StatusBadge';
import { CurrencyAmount, ExpiryCountdown, SalaryRange } from '@/components/common/ValueText';
import { ContractPanel } from '@/components/requirements/RequirementChecklist';

type ContractTab = 'all' | ContractStatus;

/**
 * Contract management.
 *
 * Status and the "expires in N days" countdown are derived from the contract
 * end date at render time, so a contract moves to Expiring Soon or Expired on
 * its own without anyone editing a status field.
 */
export default function ContractsPage() {
  const { records, toast } = useAppStore();
  const [tab, setTab] = useState<ContractTab>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<EmployerRecord | null>(null);

  const withContract = useMemo(() => records.filter((record) => record.contract), [records]);

  const counts = useMemo(() => {
    const map = new Map<ContractStatus, number>();
    withContract.forEach((record) => {
      const status = effectiveContractStatus(record) as ContractStatus;
      map.set(status, (map.get(status) ?? 0) + 1);
    });
    return map;
  }, [withContract]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return withContract
      .filter((record) => (tab === 'all' ? true : effectiveContractStatus(record) === tab))
      .filter((record) =>
        needle
          ? `${record.employer.companyName} ${record.contract?.contractNumber ?? ''} ${record.employer.country}`
              .toLowerCase()
              .includes(needle)
          : true,
      )
      .sort((a, b) => {
        const av = a.daysToContractExpiry ?? Number.MAX_SAFE_INTEGER;
        const bv = b.daysToContractExpiry ?? Number.MAX_SAFE_INTEGER;
        return av - bv;
      });
  }, [withContract, tab, query]);

  const pagination = usePagination(rows.length, 15);
  const pageRows = pagination.paginate(rows);

  const expiring = counts.get('Expiring Soon') ?? 0;
  const expired = counts.get('Expired') ?? 0;
  const active = counts.get('Active') ?? 0;

  const columns = useMemo<TableColumn<EmployerRecord>[]>(
    () => [
      {
        key: 'contract',
        header: 'Contract',
        locked: true,
        sortable: true,
        sortValue: (record) => record.contract?.contractNumber ?? '',
        render: (record) => (
          <div className="min-w-0">
            <p className="text-ink-900 tnum truncate text-[13px] font-semibold">
              {record.contract?.contractNumber}
            </p>
            <Link
              to={`/employers/${record.employer.id}`}
              className="text-ink-500 hover:text-brand-700 truncate text-[11px]"
            >
              {record.employer.companyName}
            </Link>
          </div>
        ),
      },
      {
        key: 'start',
        header: 'Start',
        sortable: true,
        sortValue: (record) => record.contract?.startDate ?? '',
        render: (record) => <span className="text-ink-700 tnum text-[12px]">{dateOnly(record.contract?.startDate)}</span>,
      },
      {
        key: 'end',
        header: 'End',
        sortable: true,
        sortValue: (record) => record.contract?.endDate ?? '',
        render: (record) => <span className="text-ink-700 tnum text-[12px]">{dateOnly(record.contract?.endDate)}</span>,
      },
      {
        key: 'duration',
        header: 'Duration',
        align: 'center',
        render: (record) => (
          <span className="text-ink-700 text-[12px]">{record.contract?.durationMonths ?? 0} mo</span>
        ),
      },
      {
        key: 'salary',
        header: 'Salary',
        align: 'right',
        render: (record) => (
          <SalaryRange
            minPhp={record.salaryMinPhp}
            maxPhp={record.salaryMaxPhp}
            minLocal={record.contract?.salaryMinLocal ?? 0}
            maxLocal={record.contract?.salaryMaxLocal ?? 0}
            currency={record.contract?.currency ?? 'PHP'}
            className="text-ink-800 items-end text-[12px]"
            compact
          />
        ),
      },
      {
        key: 'hours',
        header: 'Working hours',
        render: (record) => (
          <span className="text-ink-600 text-[12px]">{record.primaryJob?.workingHours ?? '—'}</span>
        ),
      },
      {
        key: 'renewal',
        header: 'Renewal',
        render: (record) =>
          record.contract ? <RenewalStatusBadge status={record.contract.renewalStatus} /> : null,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortValue: (record) => String(effectiveContractStatus(record)),
        render: (record) => <ContractStatusBadge status={effectiveContractStatus(record)} />,
      },
      {
        key: 'countdown',
        header: 'Expires in',
        render: (record) => <ExpiryCountdown days={record.daysToContractExpiry} />,
      },
      {
        key: 'actions',
        header: '',
        locked: true,
        align: 'right',
        width: '3.5rem',
        render: (record) => (
          <IconButton size="sm" label={`View contract ${record.contract?.contractNumber}`} onClick={() => setSelected(record)}>
            <Eye />
          </IconButton>
        ),
      },
    ],
    [],
  );

  const handleExport = () => {
    const csv = toCsv(
      rows.map((record) => ({
        'Contract number': record.contract?.contractNumber ?? '',
        Employer: record.employer.companyName,
        Country: record.employer.country,
        Start: dateOnly(record.contract?.startDate),
        End: dateOnly(record.contract?.endDate),
        'Duration (months)': record.contract?.durationMonths ?? 0,
        Salary: `${record.salaryMinPhp}-${record.salaryMaxPhp} PHP`,
        Status: String(effectiveContractStatus(record)),
        'Days to expiry': record.daysToContractExpiry ?? '',
      })),
    );
    downloadFile(`efms-contracts-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast({ title: 'Contracts exported', description: `${rows.length} contracts downloaded.`, variant: 'success' });
  };

  const tabs = [
    { id: 'all', label: 'All contracts', icon: <FileSignature />, count: withContract.length },
    ...CONTRACT_STATUSES.filter((status) => (counts.get(status) ?? 0) > 0).map((status) => ({
      id: status,
      label: status,
      count: counts.get(status) ?? 0,
      tone:
        status === 'Expired'
          ? ('danger' as const)
          : status === 'Expiring Soon'
            ? ('warning' as const)
            : ('default' as const),
    })),
  ];

  return (
    <>
      <PageHeader
        title="Contracts"
        description="Contract terms and expiry monitoring across every employer. Status is recalculated from the end date on every render."
        actions={
          <Button variant="outline" icon={<Download />} onClick={handleExport} disabled={rows.length === 0}>
            Export contracts
          </Button>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Contracts on file" value={withContract.length} icon={<FileSignature />} tone="brand" />
        <StatCard label="Active" value={active} icon={<CalendarClock />} tone="success" hint="More than 30 days left" />
        <StatCard
          label="Expiring soon"
          value={expiring}
          icon={<CalendarClock />}
          tone="warning"
          hint="Within the next 30 days"
        />
        <StatCard label="Expired" value={expired} icon={<CalendarClock />} tone="danger" hint="Past the end date" />
      </section>

      <Card flush>
        <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as ContractTab)} className="px-3" />

        <Toolbar className="border-t-0">
          <ToolbarGroup grow>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search contract number, employer or country…"
              aria-label="Search contracts"
              className="border-ink-300 text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:ring-brand-500/20 h-9 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none sm:max-w-sm"
            />
          </ToolbarGroup>
          <Badge tone="neutral">{rows.length} contracts</Badge>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey={(record) => record.employer.id}
          empty={
            <EmptyState
              title={tab === 'all' ? 'No contracts on file' : `No contracts are ${tab.toLowerCase()}`}
              description="Contracts are generated when an employer is registered, and their status follows the end date."
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
                itemLabel="contracts"
              />
            ) : null
          }
        />
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        size="lg"
        icon={<FileSignature />}
        title={selected ? `Contract ${selected.contract?.contractNumber}` : 'Contract'}
        description={selected?.employer.companyName}
        footer={
          <>
            {selected && (
              <Link
                to={`/employers/${selected.employer.id}`}
                className="border-ink-300 text-ink-700 hover:bg-ink-50 mr-auto inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium"
              >
                Open employer profile
              </Link>
            )}
            <Button variant="primary" onClick={() => setSelected(null)}>
              Close
            </Button>
          </>
        }
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <ContractPanel record={selected} bare />

            <div className="border-ink-200 border-t pt-4">
              <h3 className="text-ink-900 mb-3 text-[13px] font-semibold">Commercial summary</h3>
              <DetailList
                columns={2}
                items={[
                  {
                    label: 'Salary range',
                    value: (
                      <SalaryRange
                        minPhp={selected.salaryMinPhp}
                        maxPhp={selected.salaryMaxPhp}
                        minLocal={selected.contract?.salaryMinLocal ?? 0}
                        maxLocal={selected.contract?.salaryMaxLocal ?? 0}
                        currency={selected.contract?.currency ?? 'PHP'}
                        className="text-ink-800 text-[13px]"
                      />
                    ),
                  },
                  {
                    label: 'Annual salary value',
                    value: <CurrencyAmount value={selected.salaryMaxPhp * 12} className="text-ink-800 text-[13px]" />,
                  },
                  { label: 'Total fees to worker', value: <CurrencyAmount value={selected.totalEstimatedCost} /> },
                  {
                    label: 'Working hours',
                    value: `${selected.primaryJob?.workingHours ?? '—'} · overtime ${selected.primaryJob?.overtime ?? '—'}`,
                  },
                  {
                    label: 'Countdown',
                    value: formatExpiryCountdown(selected.daysToContractExpiry),
                  },
                  {
                    label: 'Positions available',
                    value: `${selected.positionsAvailable} across ${selected.openJobOrders} job order(s)`,
                  },
                ]}
              />
            </div>

            <div className="border-ink-200 border-t pt-4">
              <h3 className="text-ink-900 mb-2 flex items-center gap-2 text-[13px] font-semibold">
                <RefreshCcw className="h-3.5 w-3.5" />
                Documentation readiness
              </h3>
              <ProgressBar
                value={selected.requirementCompletion}
                showLabel
                label={`${selected.requirements.filter((item) => item.completed).length} of ${selected.requirements.length} requirements complete`}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
