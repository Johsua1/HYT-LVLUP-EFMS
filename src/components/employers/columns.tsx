import { Link } from 'react-router-dom';
import { Heart, Scale } from 'lucide-react';
import type { EmployerRecord, TableColumn } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { IconButton } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  ContractStatusBadge,
  EmployerStatusBadge,
  VerificationBadge,
} from '@/components/common/StatusBadge';
import { CurrencyAmount, ExpiryCountdown, RelativeTimeText, SalaryRange } from '@/components/common/ValueText';
import { EmployerActions } from './EmployerActions';
import { completionTone } from '@/lib/tokens';
import { effectiveContractStatus } from '@/lib/selectors';
import { useAppStore } from '@/store/AppStore';

/** Shortlist and comparison toggles, available straight from the row. */
function QuickActions({ record }: { record: EmployerRecord }) {
  const { isShortlisted, toggleShortlist, isComparing, toggleComparison } = useAppStore();
  const shortlisted = isShortlisted(record.employer.id);
  const comparing = isComparing(record.employer.id);

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip content={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}>
        <IconButton
          size="sm"
          label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
          active={shortlisted}
          onClick={() => toggleShortlist(record.employer.id)}
        >
          <Heart className={cn('h-3.5 w-3.5', shortlisted && 'fill-current')} />
        </IconButton>
      </Tooltip>
      <Tooltip content={comparing ? 'Remove from comparison' : 'Add to comparison'}>
        <IconButton
          size="sm"
          label={comparing ? 'Remove from comparison' : 'Add to comparison'}
          active={comparing}
          onClick={() => toggleComparison(record.employer.id)}
        >
          <Scale className="h-3.5 w-3.5" />
        </IconButton>
      </Tooltip>
    </div>
  );
}

export interface EmployerColumnHandlers {
  onEdit: (record: EmployerRecord) => void;
  onArchive: (record: EmployerRecord) => void;
  onRestore: (record: EmployerRecord) => void;
  onDelete: (record: EmployerRecord) => void;
}

/**
 * Column definitions for the employer database.
 *
 * Kept out of the page component so the same table can be reused by the
 * filtering workspace and any future export view without copying cell markup.
 */
export function buildEmployerColumns(handlers: EmployerColumnHandlers): TableColumn<EmployerRecord>[] {
  return [
    {
      key: 'company',
      header: 'Company',
      locked: true,
      sortable: true,
      sortKey: 'name',
      width: '20rem',
      mobileLabel: 'Company',
      render: (record) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <CompanyLogo initials={record.employer.logoInitials} hue={record.employer.logoHue} size="sm" square />
          <div className="min-w-0">
            <Link
              to={`/employers/${record.employer.id}`}
              className="text-ink-900 hover:text-brand-700 block truncate text-[13px] font-semibold"
            >
              {record.employer.companyName}
            </Link>
            <p className="text-ink-500 truncate text-[11px]">
              {record.employer.city} · {record.employer.registrationNumber}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'country',
      header: 'Country',
      sortable: true,
      sortKey: 'country',
      defaultVisible: true,
      render: (record) => (
        <div className="flex items-center gap-1.5">
          <Badge tone="neutral">{record.employer.countryCode}</Badge>
          <span className="text-ink-700 truncate text-[13px]">{record.employer.country}</span>
        </div>
      ),
    },
    {
      key: 'industry',
      header: 'Industry',
      defaultVisible: true,
      render: (record) => <span className="text-ink-700 text-[13px]">{record.employer.industry}</span>,
    },
    {
      key: 'positions',
      header: 'Jobs',
      align: 'center',
      defaultVisible: true,
      sortable: true,
      sortValue: (record) => record.positionsAvailable,
      render: (record) => (
        <div className="text-center">
          <p className="text-ink-900 tnum text-[13px] font-semibold">{record.positionsAvailable}</p>
          <p className="text-ink-500 truncate text-[10px]">{record.primaryJob?.position ?? 'No job order'}</p>
        </div>
      ),
    },
    {
      key: 'salary',
      header: 'Salary / month',
      align: 'right',
      defaultVisible: true,
      sortable: true,
      sortKey: 'salary',
      render: (record) => (
        <SalaryRange
          minPhp={record.salaryMinPhp}
          maxPhp={record.salaryMaxPhp}
          minLocal={record.primaryJob?.salaryMinLocal ?? 0}
          maxLocal={record.primaryJob?.salaryMaxLocal ?? 0}
          currency={record.primaryJob?.currency ?? 'PHP'}
          className="text-ink-800 items-end text-[13px]"
          compact
        />
      ),
    },
    {
      key: 'fees',
      header: 'Total fees',
      align: 'right',
      defaultVisible: true,
      sortable: true,
      sortKey: 'fee',
      render: (record) => (
        <CurrencyAmount value={record.totalEstimatedCost} className="text-ink-800 text-[13px] font-medium" />
      ),
    },
    {
      key: 'contract',
      header: 'Contract',
      defaultVisible: true,
      sortable: true,
      sortKey: 'contract',
      render: (record) => (
        <div className="flex flex-col gap-1">
          <ContractStatusBadge status={effectiveContractStatus(record)} />
          <ExpiryCountdown days={record.daysToContractExpiry} />
        </div>
      ),
    },
    {
      key: 'requirements',
      header: 'Requirements',
      defaultVisible: true,
      width: '9rem',
      sortable: true,
      sortKey: 'requirements',
      render: (record) => (
        <div className="min-w-28">
          <ProgressBar
            value={record.requirementCompletion}
            tone={completionTone(record.requirementCompletion)}
            size="sm"
          />
          <p className="text-ink-500 tnum mt-1 text-[10px]">
            {record.requirements.filter((item) => item.completed).length}/{record.requirements.length} complete
            {record.mandatoryOutstanding > 0 && (
              <span className="text-rose-600 font-medium"> · {record.mandatoryOutstanding} missing</span>
            )}
          </p>
        </div>
      ),
    },
    {
      key: 'verification',
      header: 'Verification',
      defaultVisible: false,
      render: (record) => <VerificationBadge status={record.employer.verification} />,
    },
    {
      key: 'status',
      header: 'Status',
      defaultVisible: true,
      sortable: true,
      sortValue: (record) => record.employer.status,
      render: (record) => <EmployerStatusBadge status={record.employer.status} />,
    },
    {
      key: 'updated',
      header: 'Updated',
      defaultVisible: true,
      sortable: true,
      sortKey: 'updated',
      render: (record) => <RelativeTimeText iso={record.employer.updatedAt} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      locked: true,
      align: 'right',
      width: '8.5rem',
      render: (record) => (
        <div className="flex items-center justify-end gap-1">
          <QuickActions record={record} />
          <EmployerActions
            record={record}
            onEdit={() => handlers.onEdit(record)}
            onArchive={() => handlers.onArchive(record)}
            onRestore={() => handlers.onRestore(record)}
            onDelete={() => handlers.onDelete(record)}
          />
        </div>
      ),
    },
  ];
}
