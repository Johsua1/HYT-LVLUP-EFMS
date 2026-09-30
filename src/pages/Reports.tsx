import { useMemo, useState } from 'react';
import { BarChart3, Download, Filter, RotateCcw } from 'lucide-react';
import type { FilterState } from '@/types';
import { EMPTY_FILTERS, FEE_TYPES } from '@/lib/constants';
import { computeDashboardMetrics, deriveFilterOptions, effectiveContractStatus } from '@/lib/selectors';
import { filterAndSort } from '@/lib/filters';
import { downloadFile, formatCurrency, formatNumber, toCsv } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Toolbar, ToolbarGroup } from '@/components/common/Toolbar';
import { ChartCard } from '@/components/common/ChartCard';
import { MultiSelect } from '@/components/common/MultiSelect';
import { BarList, CategoryBarChart, DonutChart, statusColorsFor } from '@/components/charts/Charts';
import { StatCard } from '@/components/common/StatCard';

const SALARY_BANDS = [
  { label: 'Under ₱25,000', min: 0, max: 25_000 },
  { label: '₱25,000 – ₱50,000', min: 25_000, max: 50_000 },
  { label: '₱50,000 – ₱75,000', min: 50_000, max: 75_000 },
  { label: '₱75,000 – ₱100,000', min: 75_000, max: 100_000 },
  { label: '₱100,000+', min: 100_000, max: Number.POSITIVE_INFINITY },
];

/**
 * Reports.
 *
 * The same `FilterState` engine that powers employer filtering drives these
 * charts, so a report is simply "the filtering workspace, visualised". Country,
 * industry and status are the dimensions staff slice by most often.
 */
export default function ReportsPage() {
  const { records, toast } = useAppStore();
  const [scope, setScope] = useState<FilterState>({ ...EMPTY_FILTERS });

  const options = useMemo(() => deriveFilterOptions(records), [records]);
  const scoped = useMemo(() => filterAndSort(records, scope), [records, scope]);
  const metrics = useMemo(() => computeDashboardMetrics(scoped), [scoped]);

  const scopeActive =
    scope.country.length + scope.industry.length + scope.employerStatus.length + scope.verification.length > 0;

  const salaryDistribution = useMemo(
    () =>
      SALARY_BANDS.map((band) => ({
        name: band.label,
        value: scoped.filter(
          (record) => record.salaryMaxPhp >= band.min && record.salaryMaxPhp < band.max,
        ).length,
      })).filter((entry) => entry.value > 0),
    [scoped],
  );

  const feeDistribution = useMemo(
    () =>
      FEE_TYPES.map((type) => ({
        name: type,
        value: Math.round(
          scoped.reduce((sum, record) => sum + record.feeTotals[type], 0) / Math.max(1, scoped.length),
        ),
      })).filter((entry) => entry.value > 0),
    [scoped],
  );

  const contractValue = scoped.reduce((sum, record) => sum + record.salaryMaxPhp * 12, 0);

  const handleExport = () => {
    const csv = toCsv(
      scoped.map((record) => ({
        Company: record.employer.companyName,
        Country: record.employer.country,
        City: record.employer.city,
        Industry: record.employer.industry,
        Position: record.primaryJob?.position ?? '',
        'Salary min (PHP)': record.salaryMinPhp,
        'Salary max (PHP)': record.salaryMaxPhp,
        'Total fees (PHP)': record.totalEstimatedCost,
        'Requirement completion (%)': record.requirementCompletion,
        'Contract status': String(effectiveContractStatus(record)),
        'Employer status': record.employer.status,
        Verification: record.employer.verification,
      })),
    );
    downloadFile(`efms-report-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast({
      title: 'Report exported',
      description: `${scoped.length} employer records downloaded as CSV.`,
      variant: 'success',
    });
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Portfolio analytics sliced by country, industry and status. Every chart recalculates from the employer records — nothing is precomputed."
        actions={
          <>
            <Button
              variant="outline"
              icon={<RotateCcw />}
              onClick={() => setScope({ ...EMPTY_FILTERS })}
              disabled={!scopeActive}
            >
              Clear scope
            </Button>
            <Button variant="primary" icon={<Download />} onClick={handleExport} disabled={scoped.length === 0}>
              Export report
            </Button>
          </>
        }
      />

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
            <MultiSelect
              label="Verification"
              options={['Verified', 'Under Review', 'Pending', 'Requires Revision', 'Rejected', 'On Hold'].map(
                (value) => ({ value, label: value }),
              )}
              value={scope.verification}
              onChange={(value) => setScope((current) => ({ ...current, verification: value }))}
              placeholder="All verification states"
            />
          </ToolbarGroup>
          <Badge tone={scopeActive ? 'brand' : 'neutral'}>
            {scopeActive ? `${scoped.length} of ${records.length} employers` : `All ${records.length} employers`}
          </Badge>
        </Toolbar>
      </Card>

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Employers in scope" value={formatNumber(scoped.length)} icon={<Filter />} tone="brand" />
        <StatCard
          label="Countries covered"
          value={formatNumber(metrics.countriesCovered)}
          icon={<BarChart3 />}
          tone="info"
        />
        <StatCard
          label="Average total cost"
          value={formatCurrency(metrics.averageTotalCost)}
          icon={<BarChart3 />}
          tone="warning"
          hint="Per worker"
        />
        <StatCard
          label="Annual salary value"
          value={formatCurrency(contractValue, 'PHP', { compact: true })}
          icon={<BarChart3 />}
          tone="success"
          hint="Sum of top-of-band salaries"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Employers by country"
          description="Where the portfolio is concentrated."
          isEmpty={metrics.employersByCountry.length === 0}
          height={300}
        >
          <CategoryBarChart data={metrics.employersByCountry} seriesName="Employers" />
        </ChartCard>

        <ChartCard
          title="Employers by industry"
          description="Sector spread across the selected employers."
          isEmpty={metrics.employersByIndustry.length === 0}
          height={300}
        >
          <CategoryBarChart data={metrics.employersByIndustry} color="var(--color-brand-400)" seriesName="Employers" />
        </ChartCard>

        <ChartCard
          title="Salary distribution"
          description="Employers grouped by the top of their monthly salary band."
          isEmpty={salaryDistribution.length === 0}
          height={300}
        >
          <CategoryBarChart data={salaryDistribution} color="var(--color-brand-400)" seriesName="Employers" />
        </ChartCard>

        <ChartCard
          title="Fee distribution"
          description="Average fee per line item across the employers in scope."
          isEmpty={feeDistribution.length === 0}
          height={300}
        >
          <div className="h-full overflow-y-auto pr-1">
            <BarList
              data={feeDistribution}
              valueFormatter={(value) => formatCurrency(value, 'PHP', { compact: true })}
              tone="warning"
            />
          </div>
        </ChartCard>

        <ChartCard
          title="Contract status"
          description="Derived from contract end dates."
          isEmpty={metrics.contractStatusDistribution.length === 0}
          height={300}
        >
          <DonutChart
            data={metrics.contractStatusDistribution}
            colors={statusColorsFor(metrics.contractStatusDistribution)}
            centerLabel="contracts"
          />
        </ChartCard>

        <ChartCard
          title="Employer status"
          description="Lifecycle distribution of the employers in scope."
          isEmpty={metrics.statusDistribution.length === 0}
          height={300}
        >
          <DonutChart data={metrics.statusDistribution} centerLabel="employers" />
        </ChartCard>

        <ChartCard
          title="Requirement completion"
          description="How many employers have a fully complete checklist."
          isEmpty={metrics.requirementDistribution.length === 0}
          height={300}
        >
          <DonutChart
            data={metrics.requirementDistribution}
            colors={statusColorsFor(metrics.requirementDistribution)}
            centerLabel="employers"
          />
        </ChartCard>

        <ChartCard
          title="Salary band by country"
          description="Average top-of-band monthly salary per destination."
          isEmpty={metrics.salaryByCountry.length === 0}
          height={300}
        >
          <div className="h-full overflow-y-auto pr-1">
            <BarList
              data={metrics.salaryByCountry.map((entry) => ({ name: entry.name, value: entry.average }))}
              valueFormatter={(value) => formatCurrency(value, 'PHP', { compact: true })}
              tone="success"
            />
          </div>
        </ChartCard>
      </section>

      <Card className="mt-4">
        <CardHeader
          title="Summary metrics"
          description="Key figures for the employers currently in scope."
          icon={<BarChart3 />}
        />
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
          <dl className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-600 text-[13px]">Verified employers</dt>
              <dd className="text-ink-900 tnum text-sm font-semibold">{metrics.verifiedEmployers}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-600 text-[13px]">Pending verification</dt>
              <dd className="text-ink-900 tnum text-sm font-semibold">{metrics.pendingVerification}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-600 text-[13px]">Expiring contracts</dt>
              <dd className="text-ink-900 tnum text-sm font-semibold">{metrics.expiringContracts}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-600 text-[13px]">Expired contracts</dt>
              <dd className="text-ink-900 tnum text-sm font-semibold">{metrics.expiredContracts}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-600 text-[13px]">Positions available</dt>
              <dd className="text-ink-900 tnum text-sm font-semibold">{metrics.totalPositionsAvailable}</dd>
            </div>
          </dl>
          <div>
            <p className="text-ink-600 mb-2 text-[13px] font-medium">Average requirement completion</p>
            <ProgressBar value={metrics.requirementCompletionAvg} showLabel label="Employers in scope" />
            <div className="mt-4">
              <p className="text-ink-600 mb-2 text-[13px] font-medium">Average processing fee</p>
              <p className="text-ink-900 tnum text-sm font-semibold">
                {formatCurrency(metrics.averageProcessingFee)}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
