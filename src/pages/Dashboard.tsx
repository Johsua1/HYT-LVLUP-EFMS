import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CircleCheckBig,
  FileWarning,
  Filter,
  Plus,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import type { FilterState } from '@/types';
import { EMPTY_FILTERS } from '@/lib/constants';
import { computeDashboardMetrics, deriveFilterOptions } from '@/lib/selectors';
import { filterAndSort } from '@/lib/filters';
import { compactNumber, formatCurrency, formatNumber, relativeTime } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { ChartCard } from '@/components/common/ChartCard';
import { BarList, CategoryBarChart, DonutChart, statusColorsFor } from '@/components/charts/Charts';
import { ActivityTypeBadge, EmployerStatusBadge, VerificationBadge } from '@/components/common/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { UserAvatar } from '@/components/ui/CompanyLogo';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MultiSelect } from '@/components/common/MultiSelect';
import { Toolbar, ToolbarGroup } from '@/components/common/Toolbar';
import { EmployerFormModal } from '@/components/employers/EmployerFormModal';

/**
 * Portfolio dashboard.
 *
 * Every figure is derived from the employer records rather than hard-coded, so
 * adding an employer, archiving one or ticking a requirement immediately moves
 * the statistics and the charts.
 */
export default function DashboardPage() {
  const { records, activity } = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const [scope, setScope] = useState<FilterState>({ ...EMPTY_FILTERS });

  const options = useMemo(() => deriveFilterOptions(records), [records]);

  const scoped = useMemo(() => filterAndSort(records, scope), [records, scope]);
  const metrics = useMemo(() => computeDashboardMetrics(scoped), [scoped]);

  const incomplete = scoped.filter((record) => record.requirementCompletion < 100);
  const recentActivity = activity.slice(0, 9);

  const scopeActive =
    scope.country.length + scope.industry.length + scope.employerStatus.length + scope.verification.length > 0;

  const clearScope = () => setScope({ ...EMPTY_FILTERS });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Portfolio health across every registered overseas employer: verification progress, contract exposure, fee levels and documentation completeness."
        actions={
          <>
            <Button variant="outline" icon={<Filter />} onClick={() => setScope({ ...EMPTY_FILTERS })} disabled={!scopeActive}>
              Clear scope
            </Button>
            <Button variant="primary" icon={<Plus />} onClick={() => setFormOpen(true)}>
              Add employer
            </Button>
          </>
        }
      />

      {/* Scope selector — charts below react to these three criteria */}
      <Card flush className="mb-4">
        <Toolbar className="border-b-0">
          <ToolbarGroup grow>
            <MultiSelect
              label="Country"
              options={options.countries.map((value) => ({ value, label: value }))}
              value={scope.country}
              onChange={(value) => setScope((current) => ({ ...current, country: value }))}
              placeholder="All countries"
            />
            <MultiSelect
              label="Industry"
              options={options.industries.map((value) => ({ value, label: value }))}
              value={scope.industry}
              onChange={(value) => setScope((current) => ({ ...current, industry: value }))}
              placeholder="All industries"
            />
            <MultiSelect
              label="Status"
              options={['Active', 'Pending', 'Inactive', 'Suspended', 'Archived'].map((value) => ({
                value,
                label: value,
              }))}
              value={scope.employerStatus}
              onChange={(value) => setScope((current) => ({ ...current, employerStatus: value }))}
              placeholder="All statuses"
            />
          </ToolbarGroup>
          <p className="text-ink-500 shrink-0 text-xs">
            {scopeActive ? (
              <>
                Showing <span className="text-ink-800 tnum font-semibold">{scoped.length}</span> of {records.length}{' '}
                employers
              </>
            ) : (
              <>Showing all {records.length} employers</>
            )}
          </p>
        </Toolbar>
      </Card>

      {/* Statistics */}
      <section aria-label="Key statistics" className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total employers"
          value={formatNumber(metrics.totalEmployers)}
          icon={<Building2 />}
          tone="brand"
          hint={`${metrics.countriesCovered} countries`}
          to="/employers"
        />
        <StatCard
          label="Active employers"
          value={formatNumber(metrics.activeEmployers)}
          icon={<TrendingUp />}
          tone="success"
          hint={`${formatNumber(metrics.totalPositionsAvailable)} positions open`}
          to="/employers"
        />
        <StatCard
          label="Verified employers"
          value={formatNumber(metrics.verifiedEmployers)}
          icon={<ShieldCheck />}
          tone="info"
          hint="Cleared for deployment"
          to="/employers"
        />
        <StatCard
          label="Pending verification"
          value={formatNumber(metrics.pendingVerification)}
          icon={<CircleCheckBig />}
          tone="warning"
          hint="Awaiting review"
          to="/employers"
        />
        <StatCard
          label="Expiring contracts"
          value={formatNumber(metrics.expiringContracts)}
          icon={<CalendarClock />}
          tone="warning"
          hint={`${metrics.expiredContracts} already expired`}
          to="/contracts"
        />
        <StatCard
          label="Incomplete requirements"
          value={formatNumber(incomplete.length)}
          icon={<FileWarning />}
          tone={incomplete.length > 0 ? 'danger' : 'success'}
          hint={`${metrics.requirementCompletionAvg}% average completion`}
          to="/requirements"
        />
      </section>

      {/* Charts */}
      <section aria-label="Portfolio charts" className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Employers by country"
          description="Distribution of the employer portfolio across destination markets."
          isEmpty={metrics.employersByCountry.length === 0}
          height={300}
        >
          <CategoryBarChart data={metrics.employersByCountry} seriesName="Employers" />
        </ChartCard>

        <ChartCard
          title="Employers by industry"
          description="Sector concentration — useful when balancing the deployment pipeline."
          isEmpty={metrics.employersByIndustry.length === 0}
          height={300}
        >
          <CategoryBarChart data={metrics.employersByIndustry} color="var(--color-brand-400)" seriesName="Employers" />
        </ChartCard>

        <ChartCard
          title="Employer status"
          description="Lifecycle state of every employer in scope."
          isEmpty={metrics.statusDistribution.length === 0}
          height={280}
        >
          <DonutChart data={metrics.statusDistribution} centerLabel="employers" />
        </ChartCard>

        <ChartCard
          title="Contract status"
          description="Contract status is derived from end dates, so this chart moves on its own as time passes."
          isEmpty={metrics.contractStatusDistribution.length === 0}
          height={280}
        >
          <DonutChart
            data={metrics.contractStatusDistribution}
            colors={statusColorsFor(metrics.contractStatusDistribution)}
            centerLabel="contracts"
          />
        </ChartCard>

        <ChartCard
          title="Requirement completion"
          description="How many employers have a fully complete documentation checklist."
          isEmpty={metrics.requirementDistribution.length === 0}
          height={280}
        >
          <DonutChart
            data={metrics.requirementDistribution}
            colors={statusColorsFor(metrics.requirementDistribution)}
            centerLabel="employers"
          />
        </ChartCard>

        <ChartCard
          title="Average monthly salary by country"
          description="Highest monthly salary band recorded per destination."
          isEmpty={metrics.salaryByCountry.length === 0}
          height={280}
        >
          <div className="h-full overflow-y-auto pr-1">
            <BarList
              data={metrics.salaryByCountry.map((entry) => ({ name: entry.name, value: entry.average }))}
              valueFormatter={(value) => formatCurrency(value, 'PHP', { compact: true })}
            />
          </div>
        </ChartCard>
      </section>

      {/* Secondary metrics + activity */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader
            title="Portfolio value"
            description="Indicative annual salary value of active employers."
            icon={<TrendingUp />}
          />
          <dl className="flex flex-col gap-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-600 text-xs">Active annual salary value</dt>
              <dd className="text-ink-900 tnum text-sm font-semibold">
                {formatCurrency(metrics.activeContractValuePhp, 'PHP', { compact: true })}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-600 text-xs">Average processing fee</dt>
              <dd className="text-ink-900 tnum text-sm font-semibold">
                {formatCurrency(metrics.averageProcessingFee)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-600 text-xs">Average total cost to worker</dt>
              <dd className="text-ink-900 tnum text-sm font-semibold">
                {formatCurrency(metrics.averageTotalCost)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-600 text-xs">Positions available</dt>
              <dd className="text-ink-900 tnum text-sm font-semibold">
                {formatNumber(metrics.totalPositionsAvailable)}
              </dd>
            </div>
          </dl>

          <div className="border-ink-200 mt-4 border-t pt-4">
            <p className="text-ink-600 mb-2 text-xs font-medium">Average requirement completion</p>
            <ProgressBar value={metrics.requirementCompletionAvg} showLabel label="All employers in scope" />
          </div>
        </Card>

        <Card flush className="xl:col-span-2">
          <div className="border-ink-200 flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 className="text-ink-900 text-sm font-semibold">Recent activity</h2>
              <p className="text-ink-500 mt-0.5 text-xs">
                Latest actions recorded in the workspace, newest first.
              </p>
            </div>
            <Link to="/reports" className="text-brand-700 hover:text-brand-800 text-xs font-medium">
              View reports
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Actions you take — adding employers, updating fees, ticking requirements — are recorded here."
              compact
            />
          ) : (
            <ul className="divide-ink-200 divide-y">
              {recentActivity.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
                  <UserAvatar initials={entry.userInitials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-ink-800 text-[13px] leading-snug">
                      <span className="font-semibold">{entry.user}</span> {entry.action}
                      {entry.employerId ? (
                        <>
                          {' — '}
                          <Link
                            to={`/employers/${entry.employerId}`}
                            className="text-brand-700 hover:underline"
                          >
                            {entry.employerName}
                          </Link>
                        </>
                      ) : (
                        <span className="text-ink-500"> — {entry.employerName}</span>
                      )}
                    </p>
                    {entry.detail && (
                      <p className="text-ink-500 mt-0.5 line-clamp-2 text-xs leading-relaxed">{entry.detail}</p>
                    )}
                    <p className="text-ink-400 mt-1 text-[10px]">{relativeTime(entry.timestamp)}</p>
                  </div>
                  <ActivityTypeBadge actionType={entry.actionType} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Employers needing attention */}
      <section className="mt-4">
        <Card flush>
          <div className="border-ink-200 flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500 h-4 w-4" />
              <div>
                <h2 className="text-ink-900 text-sm font-semibold">Employers needing attention</h2>
                <p className="text-ink-500 mt-0.5 text-xs">
                  Incomplete documentation, unverified status or a contract close to expiry.
                </p>
              </div>
            </div>
            <Link to="/filter" className="text-brand-700 hover:text-brand-800 text-xs font-medium">
              Open filtering
            </Link>
          </div>

          <ul className="divide-ink-200 divide-y">
            {scoped
              .filter(
                (record) =>
                  record.requirementCompletion < 100 ||
                  record.employer.verification !== 'Verified' ||
                  (record.daysToContractExpiry !== null && record.daysToContractExpiry <= 45),
              )
              .slice(0, 6)
              .map((record) => (
                <li key={record.employer.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Link
                    to={`/employers/${record.employer.id}`}
                    className="text-ink-900 hover:text-brand-700 min-w-0 flex-1 truncate text-[13px] font-semibold"
                  >
                    {record.employer.companyName}
                  </Link>
                  <EmployerStatusBadge status={record.employer.status} />
                  <VerificationBadge status={record.employer.verification} />
                  <span className="text-ink-500 w-full text-xs sm:w-40">
                    {record.positionsAvailable} positions · {compactNumber(record.requirementCompletion)}% complete
                  </span>
                  {record.mandatoryOutstanding > 0 && (
                    <span className="text-rose-600 text-xs font-medium">
                      {record.mandatoryOutstanding} mandatory missing
                    </span>
                  )}
                </li>
              ))}
            {scoped.length === 0 && (
              <li>
                <EmptyState
                  compact
                  title="Nothing in scope"
                  description="No employers match the current dashboard scope."
                />
              </li>
            )}
          </ul>
        </Card>
      </section>

      <EmployerFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
