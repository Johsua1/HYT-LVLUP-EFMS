import { CalendarClock, ListChecks } from 'lucide-react';
import type { EmployerRecord, RequirementItem } from '@/types';
import { REQUIREMENT_STATUSES } from '@/lib/constants';
import { cn, dateOnly, formatExpiryCountdown } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import { RequirementStatusBadge } from '@/components/common/StatusBadge';
import { completionTone } from '@/lib/tokens';

/* ------------------------------------------------------------------ */
/* Requirements                                                        */
/* ------------------------------------------------------------------ */

export interface RequirementChecklistProps {
  record: EmployerRecord;
  bare?: boolean;
  className?: string;
}

/**
 * Documentation checklist.
 *
 * Completion is computed from the ticked items, so the "5 / 6 complete · 83%"
 * readout, the progress bar, the employer table column and the requirement
 * filter all move together the moment a box is toggled.
 */
export function RequirementChecklist({ record, bare = false, className }: RequirementChecklistProps) {
  const { toggleRequirement, setRequirementStatus } = useAppStore();

  const completed = record.requirements.filter((item) => item.completed).length;
  const total = record.requirements.length;
  const percent = record.requirementCompletion;
  const mandatoryOutstanding = record.mandatoryOutstanding;

  const body = (
    <div className="flex flex-col gap-4">
      <div className="bg-ink-50 rounded-lg px-3.5 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-ink-900 text-sm font-semibold">
            <span className="tnum">
              {completed} / {total}
            </span>{' '}
            Complete
          </p>
          <p className="text-ink-700 tnum text-sm font-semibold">{percent}% Complete</p>
        </div>
        <ProgressBar value={percent} tone={completionTone(percent)} className="mt-2.5" />
        {mandatoryOutstanding > 0 ? (
          <p className="text-rose-600 mt-2 text-[11px] font-medium">
            {mandatoryOutstanding} mandatory requirement{mandatoryOutstanding === 1 ? '' : 's'} still outstanding.
          </p>
        ) : (
          <p className="text-emerald-600 mt-2 text-[11px] font-medium">
            All mandatory requirements are satisfied.
          </p>
        )}
      </div>

      <ul className="divide-ink-200 divide-y">
        {record.requirements.map((item: RequirementItem) => (
          <li key={item.id} className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-start sm:gap-4">
            <Checkbox
              className="flex-1"
              checked={item.completed}
              onChange={() => toggleRequirement(item.id)}
              label={
                <span className="flex flex-wrap items-center gap-2">
                  <span className={cn('text-[13px] font-medium', item.completed && 'text-ink-500 line-through')}>
                    {item.label}
                  </span>
                  {item.mandatory ? (
                    <Badge tone="danger">Mandatory</Badge>
                  ) : (
                    <Badge tone="neutral">Optional</Badge>
                  )}
                </span>
              }
              description={item.description}
            />
            <div className="flex shrink-0 items-center gap-2 pl-7 sm:pl-0">
              <RequirementStatusBadge status={item.status} />
              <Select
                aria-label={`${item.label} status`}
                className="h-8 w-40 text-[12px]"
                options={REQUIREMENT_STATUSES.map((value) => ({ value, label: value }))}
                value={item.status}
                onChange={(event) =>
                  setRequirementStatus(item.id, event.target.value as RequirementItem['status'])
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  if (bare) return <div className={className}>{body}</div>;

  return (
    <Card className={className}>
      <CardHeader
        title="Requirement checklist"
        description="Ticking an item recalculates completion across the whole application."
        icon={<ListChecks />}
      />
      {body}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Contract                                                            */
/* ------------------------------------------------------------------ */

export interface ContractPanelProps {
  record: EmployerRecord;
  bare?: boolean;
  className?: string;
}

/** Contract terms with a status and countdown derived from the end date. */
export function ContractPanel({ record, bare = false, className }: ContractPanelProps) {
  const { contract, daysToContractExpiry, employer } = record;

  if (!contract) {
    const empty = (
      <p className="text-ink-500 py-4 text-center text-xs">
        No contract is on file for {employer.companyName}. Contracts are created with the employer registration.
      </p>
    );
    if (bare) return <div className={className}>{empty}</div>;
    return (
      <Card className={className}>
        <CardHeader title="Contract" icon={<CalendarClock />} />
        {empty}
      </Card>
    );
  }

  const tone =
    daysToContractExpiry === null
      ? 'neutral'
      : daysToContractExpiry < 0
        ? 'danger'
        : daysToContractExpiry <= 30
          ? 'warning'
          : 'success';

  const body = (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'rounded-lg px-3.5 py-3',
          tone === 'danger' && 'bg-rose-50',
          tone === 'warning' && 'bg-amber-50',
          tone === 'success' && 'bg-emerald-50',
          tone === 'neutral' && 'bg-ink-50',
        )}
      >
        <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Contract window</p>
        <p className="text-ink-900 mt-1 text-sm font-semibold">
          {dateOnly(contract.startDate)} → {dateOnly(contract.endDate)}
        </p>
        <p
          className={cn(
            'mt-1 text-[13px] font-medium',
            tone === 'danger' && 'text-rose-700',
            tone === 'warning' && 'text-amber-800',
            tone === 'success' && 'text-emerald-700',
            tone === 'neutral' && 'text-ink-600',
          )}
        >
          {formatExpiryCountdown(daysToContractExpiry)}
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
        <div>
          <dt className="text-ink-500 text-[11px] font-medium tracking-wide uppercase">Contract number</dt>
          <dd className="text-ink-800 mt-1 text-sm">{contract.contractNumber}</dd>
        </div>
        <div>
          <dt className="text-ink-500 text-[11px] font-medium tracking-wide uppercase">Duration</dt>
          <dd className="text-ink-800 mt-1 text-sm">
            {contract.durationMonths} months ({Math.round(contract.durationMonths / 12)} year
            {contract.durationMonths / 12 === 1 ? '' : 's'})
          </dd>
        </div>
        <div>
          <dt className="text-ink-500 text-[11px] font-medium tracking-wide uppercase">Signed</dt>
          <dd className="text-ink-800 mt-1 text-sm">{contract.signedAt ? dateOnly(contract.signedAt) : 'Not signed'}</dd>
        </div>
        <div>
          <dt className="text-ink-500 text-[11px] font-medium tracking-wide uppercase">Working conditions</dt>
          <dd className="text-ink-800 mt-1 text-sm">{contract.workingConditions}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-ink-500 text-[11px] font-medium tracking-wide uppercase">Notes</dt>
          <dd className="text-ink-700 mt-1 text-sm leading-relaxed">{contract.notes || '—'}</dd>
        </div>
      </dl>
    </div>
  );

  if (bare) return <div className={className}>{body}</div>;

  return (
    <Card className={className}>
      <CardHeader
        title="Contract"
        description="Status and countdown are derived from the contract end date, not stored as a fixed value."
        icon={<CalendarClock />}
      />
      {body}
    </Card>
  );
}
