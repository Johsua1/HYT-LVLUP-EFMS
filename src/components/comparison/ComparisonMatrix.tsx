import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Crown, ExternalLink, X } from 'lucide-react';
import type { Benefits, EmployerRecord } from '@/types';
import { cn, dateOnly } from '@/lib/utils';
import { effectiveContractStatus } from '@/lib/selectors';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tooltip } from '@/components/ui/Tooltip';
import { ContractStatusBadge, EmployerStatusBadge, VerificationBadge } from '@/components/common/StatusBadge';
import { CurrencyAmount, ExpiryCountdown, SalaryRange } from '@/components/common/ValueText';
import { completionTone } from '@/lib/tokens';

interface ComparisonRow {
  label: string;
  render: (record: EmployerRecord) => React.ReactNode;
  /** Ids that should be flagged as the strongest value on this row. */
  best?: (records: EmployerRecord[]) => string[];
}

interface ComparisonSection {
  title: string;
  rows: ComparisonRow[];
}

const provisionTone = (value: string) =>
  value === 'Provided' || value === 'Available' || value === 'Employer Paid'
    ? 'success'
    : value === 'Allowance' || value === 'Limited' || value === 'Shared'
      ? 'warning'
      : 'neutral';

const benefitText = (record: EmployerRecord, key: keyof Benefits): string => {
  const benefits = record.benefits;
  if (!benefits) return '—';
  const value = benefits[key];
  if (typeof value === 'boolean') return value ? 'Provided' : 'Not provided';
  return String(value);
};

const maxOf = (records: EmployerRecord[], pick: (record: EmployerRecord) => number) => {
  const values = records.map(pick);
  const max = Math.max(...values);
  return records.filter((record) => pick(record) === max && max > 0).map((record) => record.employer.id);
};

const minOf = (records: EmployerRecord[], pick: (record: EmployerRecord) => number) => {
  const candidates = records.filter((record) => pick(record) > 0);
  if (!candidates.length) return [];
  const min = Math.min(...candidates.map(pick));
  return candidates.filter((record) => pick(record) === min).map((record) => record.employer.id);
};

const SECTIONS: ComparisonSection[] = [
  {
    title: 'Company',
    rows: [
      {
        label: 'Country',
        render: (record) => (
          <span className="text-ink-800 text-[13px]">
            {record.employer.country}
            <span className="text-ink-500 block text-[11px]">{record.employer.city}</span>
          </span>
        ),
      },
      { label: 'Industry', render: (record) => <span className="text-ink-800 text-[13px]">{record.employer.industry}</span> },
      { label: 'Verification', render: (record) => <VerificationBadge status={record.employer.verification} /> },
      { label: 'Employer status', render: (record) => <EmployerStatusBadge status={record.employer.status} /> },
      {
        label: 'Company size',
        render: (record) => <span className="text-ink-700 text-[13px]">{record.employer.companySize}</span>,
      },
    ],
  },
  {
    title: 'Job',
    rows: [
      {
        label: 'Position',
        render: (record) => (
          <span className="text-ink-800 text-[13px] font-medium">{record.primaryJob?.position ?? '—'}</span>
        ),
      },
      {
        label: 'Monthly salary',
        best: (records) => maxOf(records, (record) => record.salaryMaxPhp),
        render: (record) => (
          <SalaryRange
            minPhp={record.salaryMinPhp}
            maxPhp={record.salaryMaxPhp}
            minLocal={record.primaryJob?.salaryMinLocal ?? 0}
            maxLocal={record.primaryJob?.salaryMaxLocal ?? 0}
            currency={record.primaryJob?.currency ?? 'PHP'}
            className="text-ink-800 text-[13px]"
            compact
          />
        ),
      },
      {
        label: 'Contract duration',
        best: (records) => maxOf(records, (record) => record.contract?.durationMonths ?? 0),
        render: (record) =>
          record.contract ? (
            <span className="text-ink-800 text-[13px]">
              {record.contract.durationMonths} months
              <span className="text-ink-500 block text-[11px]">
                {dateOnly(record.contract.startDate)} → {dateOnly(record.contract.endDate)}
              </span>
            </span>
          ) : (
            <span className="text-ink-400 text-[13px]">—</span>
          ),
      },
      {
        label: 'Contract status',
        render: (record) => (
          <div className="flex flex-col gap-1">
            <ContractStatusBadge status={effectiveContractStatus(record)} />
            <ExpiryCountdown days={record.daysToContractExpiry} />
          </div>
        ),
      },
      {
        label: 'Working hours',
        render: (record) => (
          <span className="text-ink-800 text-[13px]">
            {record.primaryJob?.workingHours ?? '—'}
            <span className="text-ink-500 block text-[11px]">
              Overtime: {record.primaryJob?.overtime ?? '—'}
            </span>
          </span>
        ),
      },
      {
        label: 'Positions available',
        render: (record) => (
          <span className="text-ink-800 tnum text-[13px] font-medium">{record.positionsAvailable}</span>
        ),
      },
    ],
  },
  {
    title: 'Financial',
    rows: [
      {
        label: 'Processing fee',
        best: (records) => minOf(records, (record) => record.feeTotals['Processing Fee']),
        render: (record) => (
          <CurrencyAmount value={record.feeTotals['Processing Fee']} className="text-ink-800 text-[13px]" />
        ),
      },
      {
        label: 'Placement fee',
        best: (records) => minOf(records, (record) => record.feeTotals['Placement Fee']),
        render: (record) => (
          <CurrencyAmount value={record.feeTotals['Placement Fee']} className="text-ink-800 text-[13px]" />
        ),
      },
      {
        label: 'Visa fee',
        best: (records) => minOf(records, (record) => record.feeTotals['Visa Fee']),
        render: (record) => (
          <CurrencyAmount value={record.feeTotals['Visa Fee']} className="text-ink-800 text-[13px]" />
        ),
      },
      {
        label: 'Medical & documentation',
        render: (record) => (
          <CurrencyAmount
            value={record.feeTotals['Medical Fee'] + record.feeTotals['Documentation Fee']}
            className="text-ink-800 text-[13px]"
          />
        ),
      },
      {
        label: 'Total fees to worker',
        best: (records) => minOf(records, (record) => record.totalEstimatedCost),
        render: (record) => (
          <CurrencyAmount value={record.totalEstimatedCost} className="text-ink-900 text-[13px] font-semibold" />
        ),
      },
    ],
  },
  {
    title: 'Benefits',
    rows: [
      {
        label: 'Accommodation',
        render: (record) => (
          <Badge tone={provisionTone(benefitText(record, 'accommodation'))}>
            {benefitText(record, 'accommodation')}
          </Badge>
        ),
      },
      {
        label: 'Transportation',
        render: (record) => (
          <Badge tone={provisionTone(benefitText(record, 'transportation'))}>
            {benefitText(record, 'transportation')}
          </Badge>
        ),
      },
      {
        label: 'Food allowance',
        render: (record) => (
          <Badge tone={provisionTone(benefitText(record, 'foodAllowance'))}>
            {benefitText(record, 'foodAllowance')}
          </Badge>
        ),
      },
      {
        label: 'Health insurance',
        render: (record) => (
          <Badge tone={record.benefits?.healthInsurance ? 'success' : 'neutral'}>
            {benefitText(record, 'healthInsurance')}
          </Badge>
        ),
      },
      {
        label: 'Overtime pay',
        render: (record) => (
          <Badge tone={record.benefits?.overtimePay ? 'success' : 'neutral'}>
            {benefitText(record, 'overtimePay')}
          </Badge>
        ),
      },
      {
        label: 'Annual leave',
        render: (record) => <span className="text-ink-800 text-[13px]">{benefitText(record, 'annualLeave')}</span>,
      },
      {
        label: 'Airfare',
        render: (record) => (
          <Badge tone={provisionTone(benefitText(record, 'airfare'))}>{benefitText(record, 'airfare')}</Badge>
        ),
      },
    ],
  },
  {
    title: 'Requirements',
    rows: [
      {
        label: 'Completion',
        best: (records) => maxOf(records, (record) => record.requirementCompletion),
        render: (record) => (
          <div className="min-w-32">
            <ProgressBar
              value={record.requirementCompletion}
              tone={completionTone(record.requirementCompletion)}
              size="sm"
            />
            <p className="text-ink-600 tnum mt-1 text-[11px] font-medium">
              {record.requirements.filter((item) => item.completed).length}/{record.requirements.length} ·{' '}
              {record.requirementCompletion}%
            </p>
          </div>
        ),
      },
      {
        label: 'Mandatory outstanding',
        render: (record) =>
          record.mandatoryOutstanding > 0 ? (
            <Badge tone="danger">{record.mandatoryOutstanding} missing</Badge>
          ) : (
            <Badge tone="success">None</Badge>
          ),
      },
      {
        label: 'Documents on file',
        render: (record) => (
          <span className="text-ink-800 text-[13px]">
            {record.documents.length}
            {record.expiredDocumentCount > 0 && (
              <span className="text-rose-600 block text-[11px]">
                {record.expiredDocumentCount} expired
              </span>
            )}
          </span>
        ),
      },
    ],
  },
];

export interface ComparisonMatrixProps {
  records: EmployerRecord[];
  onRemove: (id: string) => void;
}

/**
 * Side-by-side employer evaluation.
 *
 * The criteria column is sticky so the reader never loses the row label while
 * scrolling horizontally — essential on tablets and phones where two employers
 * already exceed the viewport width.
 */
export function ComparisonMatrix({ records, onRemove }: ComparisonMatrixProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-left">
        <thead>
          <tr>
            <th
              scope="col"
              className="bg-ink-50 border-ink-200 sticky left-0 z-20 w-44 border-b border-r px-3 py-3 text-[11px] font-semibold tracking-wider uppercase"
            >
              <span className="text-ink-500">Criteria</span>
            </th>
            {records.map((record) => (
              <th
                key={record.employer.id}
                scope="col"
                className="bg-ink-50 border-ink-200 min-w-56 border-b px-3 py-3 align-top"
              >
                <div className="flex items-start gap-2.5">
                  <CompanyLogo
                    initials={record.employer.logoInitials}
                    hue={record.employer.logoHue}
                    size="sm"
                    square
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/employers/${record.employer.id}`}
                      className="text-ink-900 hover:text-brand-700 line-clamp-2 text-[13px] font-semibold"
                    >
                      {record.employer.companyName}
                    </Link>
                    <p className="text-ink-500 mt-0.5 text-[11px]">
                      {record.employer.city}, {record.employer.country}
                    </p>
                  </div>
                  <Tooltip content="Remove from comparison">
                    <IconButton
                      size="sm"
                      label={`Remove ${record.employer.companyName} from comparison`}
                      onClick={() => onRemove(record.employer.id)}
                      className="hover:bg-rose-50 hover:text-rose-600"
                    >
                      <X />
                    </IconButton>
                  </Tooltip>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Link
                    to={`/employers/${record.employer.id}`}
                    className="border-ink-300 text-ink-700 hover:bg-ink-50 inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open profile
                  </Link>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {SECTIONS.map((section) => (
            <Fragment key={section.title}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={records.length + 1}
                  className="bg-ink-100 border-ink-200 border-b px-3 py-1.5 text-left text-[11px] font-semibold tracking-wider uppercase"
                >
                  <span className="text-ink-600">{section.title}</span>
                </th>
              </tr>
              {section.rows.map((row) => {
                const bestIds = row.best ? row.best(records) : [];
                return (
                  <tr key={`${section.title}-${row.label}`} className="border-ink-200/80 border-b last:border-b-0">
                    <th
                      scope="row"
                      className="bg-white border-ink-200 sticky left-0 z-10 border-r px-3 py-2.5 align-top text-[12px] font-medium"
                    >
                      <span className="text-ink-600">{row.label}</span>
                    </th>
                    {records.map((record) => {
                      const isBest = bestIds.includes(record.employer.id);
                      return (
                        <td
                          key={record.employer.id}
                          className={cn('px-3 py-2.5 align-top', isBest && 'bg-emerald-50/60')}
                        >
                          <div className="flex items-start gap-1.5">
                            {isBest && (
                              <Tooltip content="Best value in this comparison">
                                <span className="mt-0.5 shrink-0">
                                  <Crown className="text-emerald-600 h-3.5 w-3.5" />
                                </span>
                              </Tooltip>
                            )}
                            <div className="min-w-0">{row.render(record)}</div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
