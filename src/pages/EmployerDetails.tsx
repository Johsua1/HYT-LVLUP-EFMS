import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  ArchiveRestore,
  ArrowRightCircle,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronLeft,
  FileText,
  Globe,
  Heart,
  ListChecks,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Receipt,
  RefreshCcw,
  Scale,
  StickyNote,
  Trash2,
  User,
} from 'lucide-react';
import type { EmployerRecord } from '@/types';
import { formatCurrency, formatNumber, dateOnly, relativeTime } from '@/lib/utils';
import { CONTRACT_STEP_LABEL, effectiveContractStatus, findRecord, nextContractStatus } from '@/lib/selectors';
import { completionTone } from '@/lib/tokens';
import { useAppStore } from '@/store/AppStore';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, DetailList } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { ContractStatusBadge, EmployerStatusBadge, RenewalStatusBadge, VerificationBadge } from '@/components/common/StatusBadge';
import { CurrencyAmount, ExpiryCountdown, SalaryRange } from '@/components/common/ValueText';
import { EmployerFormModal } from '@/components/employers/EmployerFormModal';
import { JobList } from '@/components/employers/JobList';
import { NotesPanel, VerificationTimeline } from '@/components/employers/ProfilePanels';
import { FeeEditor } from '@/components/fees/FeeEditor';
import { ContractPanel, RequirementChecklist } from '@/components/requirements/RequirementChecklist';
import { DocumentFormModal, DocumentTable } from '@/components/documents/DocumentManager';

type TabId = 'overview' | 'jobs' | 'fees' | 'contract' | 'requirements' | 'documents' | 'notes';

/**
 * Employer profile.
 *
 * Acts as the hub for a single employer: everything the agency knows about them
 * is reachable from one screen, and every panel writes back to the store so the
 * rest of the application stays in step.
 */
export default function EmployerDetailsPage() {
  const { employerId = '' } = useParams();
  const navigate = useNavigate();
  const {
    records,
    isShortlisted,
    toggleShortlist,
    isComparing,
    toggleComparison,
    archiveEmployer,
    restoreEmployer,
    deleteEmployer,
    removeDocument,
    setContractStatus,
    renewContract,
    toast,
  } = useAppStore();
  const { confirm, dialog } = useConfirmDialog();

  const [tab, setTab] = useState<TabId>('overview');
  const [formOpen, setFormOpen] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<EmployerRecord['documents'][number] | null>(null);

  const record = useMemo(() => findRecord(records, employerId), [records, employerId]);

  if (!record) {
    return (
      <Card>
        <EmptyState
          variant="error"
          title="Employer not found"
          description="This employer may have been deleted, or the link is out of date."
          action={
            <Button variant="primary" icon={<ChevronLeft />} onClick={() => navigate('/employers')}>
              Back to employer database
            </Button>
          }
        />
      </Card>
    );
  }

  const { employer, primaryJob } = record;
  const shortlisted = isShortlisted(employer.id);
  const comparing = isComparing(employer.id);
  const contractNext = record.contract ? nextContractStatus(record.contract.status) : null;

  const handleArchive = async () => {
    const confirmed = await confirm({
      title: 'Archive employer',
      message: `${employer.companyName} will be hidden from the default employer list and from filtering results. You can restore it at any time.`,
      confirmLabel: 'Archive employer',
      destructive: true,
    });
    if (confirmed) archiveEmployer(employer.id);
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete employer permanently',
      message: `${employer.companyName} and every record attached to it will be removed from the database. This cannot be undone.`,
      confirmLabel: 'Delete permanently',
      destructive: true,
    });
    if (confirmed) {
      deleteEmployer(employer.id);
      toast({ title: 'Employer deleted', description: employer.companyName, variant: 'info' });
      navigate('/employers');
    }
  };

  const handleRenew = async () => {
    const months = record.contract?.durationMonths ?? 0;
    const confirmed = await confirm({
      title: 'Renew contract',
      message: `Renew ${employer.companyName}'s contract for another ${months} months. The current term is extended, the renewal is marked as renewed, and the employer is returned to Active.`,
      confirmLabel: 'Renew contract',
    });
    if (confirmed) void renewContract(employer.id);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Building2 /> },
    { id: 'jobs', label: 'Jobs', icon: <BriefcaseBusiness />, count: record.jobs.length },
    { id: 'fees', label: 'Fees', icon: <Receipt /> },
    { id: 'contract', label: 'Contract', icon: <CalendarClock /> },
    {
      id: 'requirements',
      label: 'Requirements',
      icon: <ListChecks />,
      count: record.requirements.filter((item) => !item.completed).length,
      tone: record.mandatoryOutstanding > 0 ? ('danger' as const) : ('default' as const),
    },
    { id: 'documents', label: 'Documents', icon: <FileText />, count: record.documents.length },
    { id: 'notes', label: 'Notes', icon: <StickyNote />, count: record.notes.length },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Employers', to: '/employers' },
          { label: employer.companyName },
        ]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <CompanyLogo initials={employer.logoInitials} hue={employer.logoHue} size="lg" square />
            <span className="min-w-0">
              <span className="block truncate">{employer.companyName}</span>
              <span className="text-ink-500 mt-0.5 block text-[13px] font-normal">
                {employer.industry} · {employer.city}, {employer.country}
              </span>
            </span>
          </span>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <EmployerStatusBadge status={employer.status} size="md" />
            <VerificationBadge status={employer.verification} size="md" />
            <ContractStatusBadge status={effectiveContractStatus(record)} size="md" />
            <Badge tone="neutral" size="md">
              Updated {relativeTime(employer.updatedAt)}
            </Badge>
            <Badge tone="warning" size="md">
              Fictional demo employer
            </Badge>
          </div>
        }
        actions={
          <>
            <Tooltip content={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}>
              <Button
                variant="outline"
                icon={<Heart className={shortlisted ? 'fill-current' : undefined} />}
                onClick={() => toggleShortlist(employer.id)}
              >
                {shortlisted ? 'Shortlisted' : 'Shortlist'}
              </Button>
            </Tooltip>
            <Button
              variant="outline"
              icon={<Scale />}
              onClick={() => toggleComparison(employer.id)}
              disabled={!comparing && record.employer.status === 'Archived'}
            >
              {comparing ? 'In comparison' : 'Compare'}
            </Button>
            <Button variant="outline" icon={<Pencil />} onClick={() => setFormOpen(true)}>
              Edit
            </Button>
            {employer.status === 'Archived' ? (
              <Button variant="outline" icon={<ArchiveRestore />} onClick={() => restoreEmployer(employer.id)}>
                Restore
              </Button>
            ) : (
              <Button variant="outline" icon={<Archive />} onClick={handleArchive}>
                Archive
              </Button>
            )}
            <IconButton label="Delete employer" onClick={handleDelete} className="hover:bg-rose-50 hover:text-rose-600">
              <Trash2 />
            </IconButton>
          </>
        }
      />

      {/* Snapshot strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="py-3.5">
          <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Monthly salary</p>
          <div className="mt-1.5">
            <SalaryRange
              minPhp={record.salaryMinPhp}
              maxPhp={record.salaryMaxPhp}
              minLocal={primaryJob?.salaryMinLocal ?? 0}
              maxLocal={primaryJob?.salaryMaxLocal ?? 0}
              currency={primaryJob?.currency ?? 'PHP'}
              className="text-ink-900 text-[15px] font-semibold"
            />
          </div>
        </Card>
        <Card className="py-3.5">
          <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Total fees to worker</p>
          <CurrencyAmount value={record.totalEstimatedCost} className="text-ink-900 mt-1.5 block text-[15px] font-semibold" />
        </Card>
        <Card className="py-3.5">
          <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Positions available</p>
          <p className="text-ink-900 tnum mt-1.5 text-[15px] font-semibold">
            {formatNumber(record.positionsAvailable)}{' '}
            <span className="text-ink-500 text-xs font-normal">
              across {record.openJobOrders} job order{record.openJobOrders === 1 ? '' : 's'}
            </span>
          </p>
        </Card>
        <Card className="py-3.5">
          <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Contract expiry</p>
          <div className="mt-1.5">
            <ExpiryCountdown days={record.daysToContractExpiry} className="text-[13px]" />
          </div>
        </Card>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} className="mb-4" />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Company information" description={employer.description} icon={<Building2 />} />
            <DetailList
              columns={2}
              items={[
                { label: 'Registered legal name', value: employer.legalName },
                { label: 'Registration number', value: employer.registrationNumber },
                { label: 'Industry', value: employer.industry },
                { label: 'Company size', value: employer.companySize },
                {
                  label: 'Address',
                  value: (
                    <span className="flex items-start gap-1.5">
                      <MapPin className="text-ink-400 mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        {employer.address}
                        <br />
                        {employer.city}, {employer.country}
                      </span>
                    </span>
                  ),
                  span: true,
                },
                {
                  label: 'Website',
                  value: (
                    <span className="flex items-center gap-1.5">
                      <Globe className="text-ink-400 h-3.5 w-3.5" />
                      {employer.website || '—'}
                    </span>
                  ),
                },
                { label: 'Years operating', value: `${employer.yearsOperating} years` },
                { label: 'Added to database', value: dateOnly(employer.createdAt) },
                { label: 'Last updated by', value: employer.updatedBy },
                { label: 'Last updated', value: `${dateOnly(employer.updatedAt)} · ${relativeTime(employer.updatedAt)}` },
              ]}
            />
          </Card>

          <Card>
            <CardHeader title="Primary contact" description="Agency point of contact at the employer." icon={<User />} />
            <dl className="flex flex-col gap-3.5">
              <div>
                <dt className="text-ink-500 text-[11px] font-medium tracking-wide uppercase">Contact person</dt>
                <dd className="text-ink-800 mt-1 text-sm font-medium">{employer.contactPerson || '—'}</dd>
                <dd className="text-ink-500 text-xs">{employer.contactRole}</dd>
              </div>
              <div>
                <dt className="text-ink-500 text-[11px] font-medium tracking-wide uppercase">Email</dt>
                <dd className="text-ink-800 mt-1 flex items-center gap-1.5 text-sm break-all">
                  <Mail className="text-ink-400 h-3.5 w-3.5 shrink-0" />
                  {employer.email || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-500 text-[11px] font-medium tracking-wide uppercase">Phone</dt>
                <dd className="text-ink-800 mt-1 flex items-center gap-1.5 text-sm">
                  <Phone className="text-ink-400 h-3.5 w-3.5 shrink-0" />
                  {employer.phone || '—'}
                </dd>
              </div>
            </dl>

            <div className="border-ink-200 mt-4 border-t pt-4">
              <p className="text-ink-600 mb-2 text-xs font-medium">Requirement completion</p>
              <ProgressBar
                value={record.requirementCompletion}
                tone={completionTone(record.requirementCompletion)}
                showLabel
                label={`${record.requirements.filter((item) => item.completed).length} of ${record.requirements.length} items`}
              />
            </div>

            <div className="border-ink-200 mt-4 border-t pt-4">
              <p className="text-ink-600 mb-2 text-xs font-medium">Documents on file</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="success">{record.documents.filter((d) => d.status === 'Verified').length} verified</Badge>
                <Badge tone="warning">{record.pendingDocumentCount} pending</Badge>
                <Badge tone={record.expiredDocumentCount ? 'danger' : 'neutral'}>
                  {record.expiredDocumentCount} expired
                </Badge>
              </div>
            </div>
          </Card>

          <div className="xl:col-span-2">
            <VerificationTimeline record={record} />
          </div>

          <Card>
            <CardHeader title="Fee summary" description="Total estimated cost to the worker." icon={<Receipt />} />
            <ul className="flex flex-col gap-2.5">
              {record.fees
                .filter((fee) => fee.amount > 0)
                .map((fee) => (
                  <li key={fee.id} className="flex items-center justify-between gap-3">
                    <span className="text-ink-600 truncate text-[13px]">{fee.type}</span>
                    <CurrencyAmount value={fee.amount} className="text-ink-800 text-[13px] font-medium" />
                  </li>
                ))}
            </ul>
            <div className="border-ink-200 mt-3 flex items-center justify-between border-t pt-3">
              <span className="text-ink-800 text-[13px] font-semibold">Total estimated</span>
              <CurrencyAmount value={record.totalEstimatedCost} className="text-ink-900 text-sm font-semibold" />
            </div>
            <Button
              variant="outline"
              size="sm"
              block
              className="mt-3"
              onClick={() => setTab('fees')}
              icon={<Receipt />}
            >
              Edit fee schedule
            </Button>
          </Card>
        </div>
      )}

      {tab === 'jobs' && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-ink-600 text-[13px]">
              {record.jobs.length} job order{record.jobs.length === 1 ? '' : 's'} ·{' '}
              {formatNumber(record.positionsAvailable)} positions still open
            </p>
            <Button variant="outline" size="sm" icon={<Pencil />} onClick={() => setFormOpen(true)}>
              Edit job order
            </Button>
          </div>
          <JobList jobs={record.jobs} />
        </div>
      )}

      {tab === 'fees' && <FeeEditor record={record} />}

      {tab === 'contract' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ContractPanel record={record} />
          </div>
          <Card>
            <CardHeader title="Renewal" icon={<CalendarClock />} />
            <DetailList
              columns={1}
              items={[
                {
                  label: 'Renewal status',
                  value: record.contract ? (
                    <RenewalStatusBadge status={record.contract.renewalStatus} />
                  ) : (
                    '—'
                  ),
                },
                { label: 'Signed on', value: record.contract?.signedAt ? dateOnly(record.contract.signedAt) : 'Not signed' },
                {
                  label: 'Days remaining',
                  value:
                    record.daysToContractExpiry === null
                      ? '—'
                      : record.daysToContractExpiry < 0
                        ? `${Math.abs(record.daysToContractExpiry)} days overdue`
                        : `${record.daysToContractExpiry} days`,
                },
                { label: 'Annual salary value', value: formatCurrency(record.salaryMaxPhp * 12, 'PHP') },
              ]}
            />
            {contractNext && (
              <div className="border-ink-200 mt-4 border-t pt-4">
                <Button
                  variant="primary"
                  block
                  icon={<ArrowRightCircle />}
                  onClick={() => void setContractStatus(employer.id, contractNext)}
                >
                  {CONTRACT_STEP_LABEL[contractNext] ?? `Move to ${contractNext}`}
                </Button>
                <p className="text-ink-500 mt-2 text-[11px] leading-relaxed">
                  Contract lifecycle: Draft → Under Review → Active. Activating stamps the signed date.
                </p>
              </div>
            )}
            {record.contract && !contractNext && (
              <div className="border-ink-200 mt-4 border-t pt-4">
                <Button variant="primary" block icon={<RefreshCcw />} onClick={() => void handleRenew()}>
                  Renew contract
                </Button>
                <p className="text-ink-500 mt-2 text-[11px] leading-relaxed">
                  Extends the current term by {record.contract.durationMonths} months and returns the
                  employer to Active — no re-approval needed.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'requirements' && <RequirementChecklist record={record} />}

      {tab === 'documents' && (
        <Card flush>
          <div className="border-ink-200 flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 className="text-ink-900 text-sm font-semibold">Documents</h2>
              <p className="text-ink-500 mt-0.5 text-xs">
                {record.documents.length} document{record.documents.length === 1 ? '' : 's'} on file for this employer.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus />}
              onClick={() => {
                setEditingDocument(null);
                setDocumentOpen(true);
              }}
            >
              Upload document
            </Button>
          </div>
          <DocumentTable
            documents={record.documents}
            onEdit={(document) => {
              setEditingDocument(document);
              setDocumentOpen(true);
            }}
            onDelete={(document) => {
              void confirm({
                title: 'Delete document',
                message: `“${document.name}” will be removed from this employer's file.`,
                confirmLabel: 'Delete document',
                destructive: true,
              }).then((confirmed) => {
                if (confirmed) removeDocument(document.id);
              });
            }}
            emptyAction={
              <Button
                variant="primary"
                icon={<Plus />}
                onClick={() => {
                  setEditingDocument(null);
                  setDocumentOpen(true);
                }}
              >
                Upload document
              </Button>
            }
          />
        </Card>
      )}

      {tab === 'notes' && <NotesPanel record={record} />}

      <EmployerFormModal open={formOpen} onClose={() => setFormOpen(false)} record={record} />
      <DocumentFormModal
        open={documentOpen}
        onClose={() => setDocumentOpen(false)}
        employerId={employer.id}
        document={editingDocument}
      />
      {dialog}
    </>
  );
}
