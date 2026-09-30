import type {
  ActivityActionType,
  ContractStatus,
  DocumentStatus,
  EmployerStatus,
  JobStatus,
  NotificationCategory,
  PaymentStatus,
  RenewalStatus,
  RequirementStatus,
  VerificationStatus,
} from '@/types';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import {
  ACTIVITY_LABEL,
  ACTIVITY_TONE,
  CONTRACT_STATUS_TONE,
  DOCUMENT_STATUS_TONE,
  EMPLOYER_STATUS_TONE,
  JOB_STATUS_TONE,
  NOTIFICATION_TONE,
  PAYMENT_STATUS_TONE,
  RENEWAL_STATUS_TONE,
  REQUIREMENT_STATUS_TONE,
  SEVERITY_TONE,
  VERIFICATION_TONE,
} from '@/lib/tokens';

/**
 * Status badges resolve their colour from `src/lib/tokens.ts` so a given status
 * reads identically in a table, a detail panel and a chart legend.
 */

type BaseProps = Omit<BadgeProps, 'children' | 'tone'>;

export function EmployerStatusBadge({ status, ...rest }: { status: EmployerStatus } & BaseProps) {
  return (
    <Badge tone={EMPLOYER_STATUS_TONE[status]} dot {...rest}>
      {status}
    </Badge>
  );
}

export function VerificationBadge({ status, ...rest }: { status: VerificationStatus } & BaseProps) {
  return (
    <Badge tone={VERIFICATION_TONE[status]} dot {...rest}>
      {status}
    </Badge>
  );
}

export function ContractStatusBadge({ status, ...rest }: { status: ContractStatus | 'None' } & BaseProps) {
  if (status === 'None') {
    return (
      <Badge tone="neutral" {...rest}>
        No contract
      </Badge>
    );
  }
  return (
    <Badge tone={CONTRACT_STATUS_TONE[status]} dot {...rest}>
      {status}
    </Badge>
  );
}

export function RenewalStatusBadge({ status, ...rest }: { status: RenewalStatus } & BaseProps) {
  return (
    <Badge tone={RENEWAL_STATUS_TONE[status]} {...rest}>
      {status}
    </Badge>
  );
}

export function JobStatusBadge({ status, ...rest }: { status: JobStatus } & BaseProps) {
  return (
    <Badge tone={JOB_STATUS_TONE[status]} dot {...rest}>
      {status}
    </Badge>
  );
}

export function RequirementStatusBadge({ status, ...rest }: { status: RequirementStatus } & BaseProps) {
  return (
    <Badge tone={REQUIREMENT_STATUS_TONE[status]} dot {...rest}>
      {status}
    </Badge>
  );
}

export function DocumentStatusBadge({ status, ...rest }: { status: DocumentStatus } & BaseProps) {
  return (
    <Badge tone={DOCUMENT_STATUS_TONE[status]} dot {...rest}>
      {status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, ...rest }: { status: PaymentStatus } & BaseProps) {
  return (
    <Badge tone={PAYMENT_STATUS_TONE[status]} {...rest}>
      {status}
    </Badge>
  );
}

export function NotificationCategoryBadge({
  category,
  ...rest
}: { category: NotificationCategory } & BaseProps) {
  return (
    <Badge tone={NOTIFICATION_TONE[category]} {...rest}>
      {category}
    </Badge>
  );
}

export function ActivityTypeBadge({
  actionType,
  ...rest
}: { actionType: ActivityActionType } & BaseProps) {
  return (
    <Badge tone={ACTIVITY_TONE[actionType]} {...rest}>
      {ACTIVITY_LABEL[actionType]}
    </Badge>
  );
}

export function SeverityDot({ severity }: { severity: 'info' | 'warning' | 'critical' | 'success' }) {
  const tone = SEVERITY_TONE[severity];
  const colour: Record<string, string> = {
    info: 'bg-sky-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    success: 'bg-emerald-500',
    neutral: 'bg-ink-400',
    brand: 'bg-brand-500',
  };
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${colour[tone]}`}
      title={severity}
      aria-hidden
    />
  );
}
