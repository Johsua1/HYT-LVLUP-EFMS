import type {
  ActivityActionType,
  BadgeTone,
  ContractStatus,
  DocumentStatus,
  EmployerStatus,
  FeeType,
  JobStatus,
  NotificationCategory,
  PaymentStatus,
  RenewalStatus,
  RequirementStatus,
  VerificationStatus,
} from '@/types';

/**
 * Single source of truth for status colour semantics.
 * Every badge in the application resolves its tone from here so a status
 * always reads the same colour on every screen.
 */

export type { BadgeTone };

export const EMPLOYER_STATUS_TONE: Record<EmployerStatus, BadgeTone> = {
  Active: 'success',
  Pending: 'warning',
  Inactive: 'neutral',
  Suspended: 'danger',
  Archived: 'neutral',
};

export const VERIFICATION_TONE: Record<VerificationStatus, BadgeTone> = {
  Verified: 'success',
  'Under Review': 'info',
  Pending: 'warning',
  'Requires Revision': 'warning',
  Rejected: 'danger',
  'On Hold': 'neutral',
};

export const CONTRACT_STATUS_TONE: Record<ContractStatus, BadgeTone> = {
  Draft: 'neutral',
  'Under Review': 'info',
  Active: 'success',
  'Expiring Soon': 'warning',
  Expired: 'danger',
  Renewed: 'brand',
};

export const RENEWAL_STATUS_TONE: Record<RenewalStatus, BadgeTone> = {
  'Not Started': 'neutral',
  'Renewal Pending': 'warning',
  Renewed: 'success',
  'Not Renewable': 'danger',
};

export const JOB_STATUS_TONE: Record<JobStatus, BadgeTone> = {
  Open: 'success',
  Filled: 'brand',
  'On Hold': 'warning',
  Closed: 'neutral',
  Cancelled: 'danger',
};

export const REQUIREMENT_STATUS_TONE: Record<RequirementStatus, BadgeTone> = {
  Complete: 'success',
  Incomplete: 'warning',
  'Under Review': 'info',
  'Missing Documents': 'danger',
};

export const DOCUMENT_STATUS_TONE: Record<DocumentStatus, BadgeTone> = {
  Verified: 'success',
  'Pending Review': 'warning',
  Rejected: 'danger',
  Expired: 'danger',
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, BadgeTone> = {
  Paid: 'success',
  Pending: 'warning',
  Included: 'info',
  Waived: 'neutral',
  'Not Applicable': 'neutral',
};

export const NOTIFICATION_TONE: Record<NotificationCategory, BadgeTone> = {
  Contract: 'warning',
  Document: 'info',
  Verification: 'brand',
  Fee: 'success',
  Requirement: 'warning',
  Employer: 'info',
  System: 'neutral',
};

export const SEVERITY_TONE: Record<'info' | 'warning' | 'critical' | 'success', BadgeTone> = {
  info: 'info',
  warning: 'warning',
  critical: 'danger',
  success: 'success',
};

export const ACTIVITY_TONE: Record<ActivityActionType, BadgeTone> = {
  created: 'success',
  updated: 'info',
  verified: 'success',
  rejected: 'danger',
  shortlisted: 'brand',
  removed: 'warning',
  'status-changed': 'warning',
  uploaded: 'info',
  exported: 'neutral',
};

export const ACTIVITY_LABEL: Record<ActivityActionType, string> = {
  created: 'Created',
  updated: 'Updated',
  verified: 'Verified',
  rejected: 'Rejected',
  shortlisted: 'Shortlisted',
  removed: 'Removed',
  'status-changed': 'Status changed',
  uploaded: 'Uploaded',
  exported: 'Exported',
};

/** Fee lines are grouped into three families so the breakdown is scannable. */
export const FEE_GROUP: Record<FeeType, 'Agency' | 'Government' | 'Employer'> = {
  'Processing Fee': 'Agency',
  'Placement Fee': 'Agency',
  'Visa Fee': 'Government',
  'Medical Fee': 'Government',
  'Documentation Fee': 'Government',
  Insurance: 'Employer',
  'Other Fees': 'Agency',
};

/** Completion percentage -> tone, shared by progress bars across the app. */
export function completionTone(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 90) return 'success';
  if (percent >= 60) return 'warning';
  return 'danger';
}

export function contractExpiryTone(days: number | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (days === null) return 'neutral';
  if (days < 0) return 'danger';
  if (days <= 30) return 'warning';
  return 'success';
}
