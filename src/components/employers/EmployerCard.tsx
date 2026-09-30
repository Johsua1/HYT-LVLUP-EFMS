import { Link } from 'react-router-dom';
import { Heart, MapPin, Scale, Users } from 'lucide-react';
import type { EmployerRecord } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { IconButton } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tooltip } from '@/components/ui/Tooltip';
import { EmployerStatusBadge, VerificationBadge } from '@/components/common/StatusBadge';
import { CurrencyAmount, ExpiryCountdown, SalaryRange } from '@/components/common/ValueText';
import { completionTone } from '@/lib/tokens';
import { useAppStore } from '@/store/AppStore';

export interface EmployerCardProps {
  record: EmployerRecord;
  /** Hides the quick actions — used when the card is a table row's mobile twin. */
  hideActions?: boolean;
  className?: string;
}

/**
 * Card presentation of an employer, used by the card view toggle and by the
 * mobile layout of the employer list.
 */
export function EmployerCard({ record, hideActions = false, className }: EmployerCardProps) {
  const { employer, primaryJob } = record;
  const { isShortlisted, toggleShortlist, isComparing, toggleComparison } = useAppStore();

  const shortlisted = isShortlisted(employer.id);
  const comparing = isComparing(employer.id);

  return (
    <div
      className={cn(
        'border-ink-200 shadow-card rounded-card hover:border-brand-300 border bg-white p-4 transition-colors',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo initials={employer.logoInitials} hue={employer.logoHue} size="lg" square />

        <div className="min-w-0 flex-1">
          <Link
            to={`/employers/${employer.id}`}
            className="text-ink-900 hover:text-brand-700 line-clamp-2 text-sm font-semibold"
          >
            {employer.companyName}
          </Link>
          <p className="text-ink-500 mt-0.5 flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {employer.city}, {employer.country}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <EmployerStatusBadge status={employer.status} />
            <VerificationBadge status={employer.verification} />
          </div>
        </div>

        {!hideActions && (
          <div className="flex shrink-0 items-center gap-1">
            <Tooltip content={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}>
              <IconButton
                size="sm"
                label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                active={shortlisted}
                onClick={() => toggleShortlist(employer.id)}
              >
                <Heart className={cn('h-4 w-4', shortlisted && 'fill-current')} />
              </IconButton>
            </Tooltip>
            <Tooltip content={comparing ? 'Remove from comparison' : 'Add to comparison'}>
              <IconButton
                size="sm"
                label={comparing ? 'Remove from comparison' : 'Add to comparison'}
                active={comparing}
                onClick={() => toggleComparison(employer.id)}
              >
                <Scale className="h-4 w-4" />
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>

      <dl className="border-ink-200 mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3.5">
        <div className="min-w-0">
          <dt className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Monthly salary</dt>
          <dd className="mt-0.5">
            <SalaryRange
              minPhp={record.salaryMinPhp}
              maxPhp={record.salaryMaxPhp}
              minLocal={primaryJob?.salaryMinLocal ?? 0}
              maxLocal={primaryJob?.salaryMaxLocal ?? 0}
              currency={primaryJob?.currency ?? 'PHP'}
              className="text-ink-800 text-[13px]"
            />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Total fees</dt>
          <dd className="mt-0.5">
            <CurrencyAmount value={record.totalEstimatedCost} className="text-ink-800 text-[13px] font-medium" />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Industry</dt>
          <dd className="text-ink-800 mt-0.5 truncate text-[13px]">{employer.industry}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Contract</dt>
          <dd className="mt-0.5">
            <ExpiryCountdown days={record.daysToContractExpiry} />
          </dd>
        </div>
      </dl>

      <div className="mt-3.5 flex items-center justify-between gap-3">
        <span className="text-ink-500 inline-flex items-center gap-1.5 text-xs">
          <Users className="h-3.5 w-3.5" />
          <span className="tnum text-ink-800 font-semibold">{record.positionsAvailable}</span>
          <span>positions open</span>
        </span>
        {record.openJobOrders > 0 && (
          <Badge tone="info">
            {record.openJobOrders} job order{record.openJobOrders === 1 ? '' : 's'}
          </Badge>
        )}
      </div>

      <div className="mt-3">
        <ProgressBar
          value={record.requirementCompletion}
          tone={completionTone(record.requirementCompletion)}
          size="sm"
          label="Requirements"
          showLabel
        />
      </div>
    </div>
  );
}
