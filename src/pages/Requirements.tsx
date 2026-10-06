import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Download, Eye, FileWarning, ListChecks } from 'lucide-react';
import type { EmployerRecord, RequirementStatus, TableColumn } from '@/types';
import { REQUIREMENT_STATUSES } from '@/lib/constants';
import { completionTone } from '@/lib/tokens';
import { downloadFile, toCsv } from '@/lib/utils';
import { deriveRequirementBucket } from '@/lib/selectors';
import { useAppStore } from '@/store/AppStore';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
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
import { RequirementStatusBadge } from '@/components/common/StatusBadge';
import { RelativeTimeText } from '@/components/common/ValueText';
import { RequirementChecklist } from '@/components/requirements/RequirementChecklist';

type RequirementTab = 'all' | RequirementStatus;

/**
 * Requirements management.
 *
 * Completion is always recomputed from the checklist items rather than stored,
 * which is why the "5 / 6 complete · 83%" figure here, on the employer table and
 * in the dashboard chart can never disagree with the tick boxes.
 */
export default function RequirementsPage() {
  const { records, toast } = useAppStore();
  const [tab, setTab] = useState<RequirementTab>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* Read the open record back out of the live store so a status change made
     inside the modal is reflected immediately, rather than against the
     snapshot taken when the modal was opened. */
  const selected = useMemo(
    () => (selectedId ? (records.find((record) => record.employer.id === selectedId) ?? null) : null),
    [selectedId, records],
  );

  const buckets = useMemo(() => {
    const map = new Map<RequirementStatus, number>();
    records.forEach((record) => {
      const bucket = deriveRequirementBucket(record.requirements);
      map.set(bucket, (map.get(bucket) ?? 0) + 1);
    });
    return map;
  }, [records]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records
      .filter((record) => (tab === 'all' ? true : deriveRequirementBucket(record.requirements) === tab))
      .filter((record) =>
        needle
          ? `${record.employer.companyName} ${record.employer.country} ${record.employer.industry}`
              .toLowerCase()
              .includes(needle)
          : true,
      )
      .sort((a, b) => a.requirementCompletion - b.requirementCompletion);
  }, [records, tab, query]);

  const pagination = usePagination(rows.length, 15);
  const pageRows = pagination.paginate(rows);

  const complete = buckets.get('Complete') ?? 0;
  const incomplete = buckets.get('Incomplete') ?? 0;
  const missing = buckets.get('Missing Documents') ?? 0;
  const underReview = buckets.get('Under Review') ?? 0;
  const average = records.length
    ? Math.round(records.reduce((sum, record) => sum + record.requirementCompletion, 0) / records.length)
    : 0;

  const columns = useMemo<TableColumn<EmployerRecord>[]>(
    () => [
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
      {
        key: 'progress',
        header: 'Completion',
        sortable: true,
        sortValue: (record) => record.requirementCompletion,
        render: (record) => {
          const done = record.requirements.filter((item) => item.completed).length;
          return (
            <div className="min-w-40">
              <ProgressBar
                value={record.requirementCompletion}
                tone={completionTone(record.requirementCompletion)}
                size="sm"
              />
              <p className="text-ink-600 tnum mt-1 text-[11px] font-medium">
                {done} / {record.requirements.length} Complete · {record.requirementCompletion}%
              </p>
            </div>
          );
        },
      },
      {
        key: 'mandatory',
        header: 'Mandatory outstanding',
        align: 'center',
        sortable: true,
        sortValue: (record) => record.mandatoryOutstanding,
        render: (record) =>
          record.mandatoryOutstanding > 0 ? (
            <Badge tone="danger" icon={<AlertTriangle />}>
              {record.mandatoryOutstanding}
            </Badge>
          ) : (
            <Badge tone="success" icon={<CheckCircle2 />}>
              None
            </Badge>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (record) => <RequirementStatusBadge status={deriveRequirementBucket(record.requirements)} />,
      },
      {
        key: 'updated',
        header: 'Last change',
        render: (record) => {
          const latest = [...record.requirements].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )[0];
          return latest ? <RelativeTimeText iso={latest.updatedAt} /> : <span className="text-ink-400">—</span>;
        },
      },
      {
        key: 'actions',
        header: '',
        locked: true,
        align: 'right',
        width: '5rem',
        render: (record) => (
          <div className="flex items-center justify-end">
            <IconButton
              size="sm"
              label={`Open checklist for ${record.employer.companyName}`}
              onClick={() => setSelectedId(record.employer.id)}
            >
              <Eye />
            </IconButton>
          </div>
        ),
      },
    ],
    [],
  );

  const renderMobileCard = (record: EmployerRecord) => {
    const done = record.requirements.filter((item) => item.completed).length;
    const latest = [...record.requirements].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];

    return (
      <div className="border-ink-200 shadow-card rounded-card border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/employers/${record.employer.id}`}
              className="text-ink-900 hover:text-brand-700 block truncate text-[13px] font-semibold"
            >
              {record.employer.companyName}
            </Link>
            <p className="text-ink-500 truncate text-[11px]">
              {record.employer.country} · {record.employer.industry}
            </p>
          </div>
          <IconButton
            size="sm"
            label={`Open checklist for ${record.employer.companyName}`}
            onClick={() => setSelectedId(record.employer.id)}
          >
            <Eye />
          </IconButton>
        </div>

        <div className="mt-3">
          <ProgressBar
            value={record.requirementCompletion}
            tone={completionTone(record.requirementCompletion)}
            size="sm"
            label="Completion"
            showLabel
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RequirementStatusBadge status={deriveRequirementBucket(record.requirements)} />
          {record.mandatoryOutstanding > 0 ? (
            <Badge tone="danger" icon={<AlertTriangle />}>
              {record.mandatoryOutstanding} mandatory
            </Badge>
          ) : (
            <Badge tone="success" icon={<CheckCircle2 />}>
              None
            </Badge>
          )}
        </div>

        <div className="border-ink-200 text-ink-600 mt-3 flex items-center justify-between gap-3 border-t pt-3 text-[11px]">
          <span className="tnum">
            {done} / {record.requirements.length} complete · {record.requirementCompletion}%
          </span>
          {latest && <RelativeTimeText iso={latest.updatedAt} />}
        </div>
      </div>
    );
  };

  const handleExport = () => {
    const csv = toCsv(
      rows.map((record) => {
        const row: Record<string, string | number> = {
          Employer: record.employer.companyName,
          Country: record.employer.country,
          'Completion (%)': record.requirementCompletion,
          'Mandatory outstanding': record.mandatoryOutstanding,
          Status: deriveRequirementBucket(record.requirements),
        };
        record.requirements.forEach((item) => {
          row[item.label] = item.completed ? 'Complete' : item.status;
        });
        return row;
      }),
    );
    downloadFile(`efms-requirements-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast({ title: 'Checklists exported', description: `${rows.length} employers downloaded.`, variant: 'success' });
  };

  const tabs = [
    { id: 'all', label: 'All employers', icon: <ListChecks />, count: records.length },
    { id: 'Complete', label: 'Complete', count: complete },
    { id: 'Incomplete', label: 'Incomplete', count: incomplete, tone: 'warning' as const },
    { id: 'Missing Documents', label: 'Missing documents', count: missing, tone: 'danger' as const },
    { id: 'Under Review', label: 'Under review', count: underReview },
  ];

  return (
    <>
      <PageHeader
        title="Requirements"
        description="Documentation checklist per employer. Ticking an item recalculates completion instantly — nothing here is a stored percentage."
        actions={
          <Button variant="outline" icon={<Download />} onClick={handleExport} disabled={rows.length === 0}>
            Export checklists
          </Button>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Fully complete"
          value={complete}
          icon={<CheckCircle2 />}
          tone="success"
          hint="Every item ticked"
        />
        <StatCard
          label="Missing mandatory"
          value={missing}
          icon={<FileWarning />}
          tone={missing > 0 ? 'danger' : 'success'}
          hint="Blocks deployment"
        />
        <StatCard label="Incomplete" value={incomplete} icon={<AlertTriangle />} tone="warning" hint="Optional items open" />
        <StatCard label="Average completion" value={`${average}%`} icon={<ListChecks />} tone="brand" hint={`${records.length} employers`} />
      </section>

      <Card flush>
        <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as RequirementTab)} className="px-3" />

        <Toolbar className="border-t-0">
          <ToolbarGroup grow>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search employers…"
              aria-label="Search employers by requirement status"
              className="border-ink-300 text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:ring-brand-500/20 h-9 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none sm:max-w-sm"
            />
          </ToolbarGroup>
          <Badge tone="neutral">{rows.length} employers</Badge>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey={(record) => record.employer.id}
          renderMobileCard={renderMobileCard}
          empty={
            <EmptyState
              title={tab === 'all' ? 'No employers' : `No employers are “${tab}”`}
              description="Requirement checklists are created automatically when an employer is registered."
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
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        size="lg"
        icon={<ListChecks />}
        title={selected ? `Checklist — ${selected.employer.companyName}` : 'Checklist'}
        description="Ticking an item updates completion everywhere in the application."
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
            <Button variant="primary" onClick={() => setSelectedId(null)}>
              Done
            </Button>
          </>
        }
      >
        {selected && <RequirementChecklist record={selected} bare />}
      </Modal>
    </>
  );
}
