import { useState } from 'react';
import {
  BriefcaseBusiness,
  ChevronDown,
  Clock,
  Home,
  Plane,
  ShieldPlus,
  Sun,
  Utensils,
  Users,
} from 'lucide-react';
import type { Benefits, JobOrder } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { JobStatusBadge } from '@/components/common/StatusBadge';
import { DurationText, JobSalary } from '@/components/common/ValueText';

function benefitRows(benefits: Benefits) {
  return [
    { label: 'Accommodation', value: benefits.accommodation, icon: <Home /> },
    { label: 'Transportation', value: benefits.transportation, icon: <BriefcaseBusiness /> },
    { label: 'Food allowance', value: benefits.foodAllowance, icon: <Utensils /> },
    { label: 'Health insurance', value: benefits.healthInsurance ? 'Provided' : 'Not provided', icon: <ShieldPlus /> },
    { label: 'Overtime pay', value: benefits.overtimePay ? 'Available' : 'Not available', icon: <Clock /> },
    { label: 'Annual leave', value: benefits.annualLeave, icon: <Sun /> },
    { label: 'Airfare', value: benefits.airfare, icon: <Plane /> },
  ];
}

function BenefitBadge({ value }: { value: string }) {
  const positive = ['Provided', 'Available', 'Employer Paid', 'Shared'].includes(value);
  const neutral = ['Allowance', 'Limited'].includes(value);
  return (
    <Badge tone={positive ? 'success' : neutral ? 'warning' : 'neutral'}>{value}</Badge>
  );
}

/**
 * Job opportunities attached to an employer.
 *
 * Each job order expands in place so the list stays scannable when an employer
 * has several openings, without pushing the user into a separate page.
 */
export function JobList({ jobs }: { jobs: JobOrder[] }) {
  const [expanded, setExpanded] = useState<string[]>(jobs.length === 1 ? [jobs[0].id] : []);

  const toggle = (id: string) =>
    setExpanded((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );

  if (!jobs.length) {
    return (
      <Card>
        <EmptyState
          compact
          title="No job orders"
          description="This employer has no active job orders on file."
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {jobs.map((job) => {
        const open = expanded.includes(job.id);
        const remaining = Math.max(0, job.workersNeeded - job.workersDeployed);

        return (
          <Card key={job.id} flush>
            <button
              type="button"
              onClick={() => toggle(job.id)}
              aria-expanded={open}
              className="hover:bg-ink-50 flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors"
            >
              <span className="bg-brand-50 text-brand-700 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <BriefcaseBusiness className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-ink-900 text-[13px] font-semibold">{job.position}</p>
                  <JobStatusBadge status={job.status} />
                  <Badge tone="neutral">{job.reference}</Badge>
                </div>
                <p className="text-ink-500 mt-0.5 text-[11px]">
                  {job.jobCategory} · {job.employmentType} · {job.workingHours}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <JobSalary job={job} className="text-ink-800 text-[13px]" compact />
                  <span className="text-ink-600 inline-flex items-center gap-1.5 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    <span className="tnum font-semibold">{remaining}</span> of {job.workersNeeded} slots open
                  </span>
                  <DurationText months={job.contractDurationMonths} className="text-ink-600" />
                </div>
              </div>

              <ChevronDown
                className={cn('text-ink-400 mt-1 h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
              />
            </button>

            {open && (
              <div className="border-ink-200 border-t px-4 py-4">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
                  <div>
                    <h4 className="text-ink-500 mb-2 text-[11px] font-semibold tracking-wide uppercase">
                      Working terms
                    </h4>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      <div>
                        <dt className="text-ink-500 text-[11px]">Working hours</dt>
                        <dd className="text-ink-800 text-[13px]">{job.workingHours}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-500 text-[11px]">Overtime</dt>
                        <dd className="mt-0.5">
                          <BenefitBadge value={job.overtime} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-500 text-[11px]">Contract duration</dt>
                        <dd className="text-ink-800 text-[13px]">
                          {job.contractDurationMonths} months
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-500 text-[11px]">Employment type</dt>
                        <dd className="text-ink-800 text-[13px]">{job.employmentType}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-500 text-[11px]">Workers needed</dt>
                        <dd className="text-ink-800 tnum text-[13px]">{job.workersNeeded}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-500 text-[11px]">Already deployed</dt>
                        <dd className="text-ink-800 tnum text-[13px]">{job.workersDeployed}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-ink-500 mb-2 text-[11px] font-semibold tracking-wide uppercase">
                      Benefits package
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {benefitRows(job.benefits).map((row) => (
                        <li key={row.label} className="flex items-center justify-between gap-3">
                          <span className="text-ink-600 inline-flex items-center gap-2 text-[13px]">
                            <span className="text-ink-400 [&>svg]:h-3.5 [&>svg]:w-3.5">{row.icon}</span>
                            {row.label}
                          </span>
                          <BenefitBadge value={row.value} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {job.requirements.length > 0 && (
                  <div className="border-ink-200 mt-4 border-t pt-3.5">
                    <h4 className="text-ink-500 mb-2 text-[11px] font-semibold tracking-wide uppercase">
                      Applicant requirements
                    </h4>
                    <ul className="flex flex-wrap gap-1.5">
                      {job.requirements.map((requirement) => (
                        <li key={requirement}>
                          <Badge tone="neutral">{requirement}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
