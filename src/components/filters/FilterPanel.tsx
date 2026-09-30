import { RotateCcw, Users, X } from 'lucide-react';
import type { FilterState } from '@/types';
import {
  ANNUAL_LEAVE_OPTIONS,
  AIRFARE_OPTIONS,
  CONTRACT_STATUSES,
  CONTRACT_DURATION_OPTIONS,
  COUNTRIES,
  EMPLOYER_STATUSES,
  EMPLOYMENT_TYPES,
  INDUSTRIES,
  OVERTIME_OPTIONS,
  POSITIONS,
  PROVISION_LEVELS,
  REQUIREMENT_STATUSES,
  VERIFICATION_STATUSES,
  WORKING_HOURS,
} from '@/lib/constants';
import type { FilterOptions } from '@/lib/selectors';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { MaxAmountInput, NumberRangeInput, SearchBar } from '@/components/ui/Input';
import { RangeSlider } from '@/components/ui/RangeSlider';
import {
  CheckboxGroup,
  FeeBandPicker,
  FilterSection,
  ToggleChips,
} from './FilterControls';

/* ------------------------------------------------------------------ */
/* Bounds & quick presets                                              */
/* ------------------------------------------------------------------ */

const SALARY_FLOOR = 0;
const SALARY_CEILING = 200_000;
const SALARY_STEP = 5_000;
const SALARY_BANDS = [20_000, 30_000, 50_000, 75_000, 100_000];

const PROCESSING_FEE_BANDS = [
  { value: 30_000, label: 'Below ₱30,000' },
  { value: 50_000, label: '₱30,000 – ₱50,000' },
  { value: 100_000, label: '₱50,000 – ₱100,000' },
];

const TOTAL_COST_BANDS = [
  { value: 40_000, label: 'Under ₱40,000' },
  { value: 75_000, label: 'Under ₱75,000' },
  { value: 120_000, label: 'Under ₱120,000' },
];

const toOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

const count = (values: unknown[]) => values.length;
const numericCount = (values: (number | null)[]) => values.filter((value) => value !== null).length;

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export interface FilterPanelProps {
  filters: FilterState;
  /** Live patch — every change immediately re-runs the match. */
  onChange: (patch: Partial<FilterState>) => void;
  onClearAll: () => void;
  onReset: () => void;
  options: FilterOptions;
  resultCount: number;
  totalCount: number;
  /** Rendered above the sections (used by the mobile drawer for its actions). */
  header?: React.ReactNode;
}

/**
 * The advanced filtering workspace.
 *
 * All six groups write into a single `FilterState`, which means any combination
 * of criteria narrows the same result set — the "Japan AND Manufacturing AND
 * ≥ ₱50,000 AND accommodation provided" case is simply four independent
 * predicates applied together in `lib/filters.ts`.
 */
export function FilterPanel({
  filters,
  onChange,
  onClearAll,
  onReset,
  options,
  resultCount,
  totalCount,
  header,
}: FilterPanelProps) {
  const countryOptions = COUNTRIES.filter((country) => options.countries.includes(country.value)).map(
    (country) => ({ value: country.value, label: country.label, hint: country.hint }),
  );

  const industryOptions = INDUSTRIES.filter((industry) => options.industries.includes(industry)).map(
    (industry) => ({ value: industry, label: industry }),
  );

  const positionOptions = POSITIONS.filter((position) => options.positions.includes(position)).map(
    (position) => ({ value: position, label: position }),
  );

  const salaryMin = filters.salaryMin ?? SALARY_FLOOR;
  const salaryMax = filters.salaryMax ?? SALARY_CEILING;

  const activeCounts = {
    basic:
      count(filters.country) +
      count(filters.city) +
      count(filters.industry) +
      count(filters.jobCategory) +
      count(filters.position) +
      count(filters.employerStatus) +
      count(filters.verification),
    employment:
      numericCount([filters.salaryMin, filters.salaryMax]) +
      count(filters.contractDuration) +
      count(filters.employmentType) +
      count(filters.workingHours) +
      count(filters.overtime),
    financial: numericCount([
      filters.processingFeeMax,
      filters.placementFeeMax,
      filters.visaFeeMax,
      filters.medicalFeeMax,
      filters.documentationFeeMax,
      filters.totalCostMax,
    ]),
    benefits:
      count(filters.accommodation) +
      count(filters.transportation) +
      count(filters.foodAllowance) +
      count(filters.healthInsurance) +
      count(filters.overtimePay) +
      count(filters.annualLeave) +
      count(filters.airfare),
    contract: count(filters.contractStatus),
    requirements: count(filters.requirementStatus),
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {header}

      {/* Live result counter */}
      <div className="border-ink-200 bg-ink-50 shrink-0 border-b px-4 py-2.5">
        <p className="text-ink-700 flex items-center gap-2 text-[13px]">
          <Users className="text-ink-400 h-3.5 w-3.5" />
          <span>
            <span className="tnum text-brand-700 font-semibold">{resultCount}</span>
            <span className="text-ink-500"> of {totalCount} employers match</span>
          </span>
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {/* Search ---------------------------------------------------- */}
        <div className="py-3">
          <SearchBar
            value={filters.search}
            onValueChange={(value) => onChange({ search: value })}
            placeholder="Search company, position, contact…"
            aria-label="Search employers within filters"
          />
        </div>

        {/* Basic ----------------------------------------------------- */}
        <FilterSection
          title="Location & profile"
          activeCount={activeCounts.basic}
          onClear={() =>
            onChange({
              country: [],
              city: [],
              industry: [],
              jobCategory: [],
              position: [],
              employerStatus: [],
              verification: [],
            })
          }
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Country</p>
              <CheckboxGroup
                options={countryOptions}
                value={filters.country}
                onChange={(value) => onChange({ country: value })}
                columns={2}
                scrollAfter={8}
              />
            </div>

            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Industry</p>
              <CheckboxGroup
                options={industryOptions}
                value={filters.industry}
                onChange={(value) => onChange({ industry: value })}
                columns={2}
                scrollAfter={8}
              />
            </div>

            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Position</p>
              <CheckboxGroup
                options={positionOptions}
                value={filters.position}
                onChange={(value) => onChange({ position: value })}
                columns={2}
                scrollAfter={8}
              />
            </div>

            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Employer status</p>
              <ToggleChips
                options={toOptions(EMPLOYER_STATUSES)}
                value={filters.employerStatus}
                onChange={(value) => onChange({ employerStatus: value })}
              />
            </div>

            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Verification</p>
              <ToggleChips
                options={toOptions(VERIFICATION_STATUSES)}
                value={filters.verification}
                onChange={(value) => onChange({ verification: value })}
              />
            </div>
          </div>
        </FilterSection>

        {/* Employment ------------------------------------------------ */}
        <FilterSection
          title="Salary & employment"
          activeCount={activeCounts.employment}
          onClear={() =>
            onChange({
              salaryMin: null,
              salaryMax: null,
              contractDuration: [],
              employmentType: [],
              workingHours: [],
              overtime: [],
            })
          }
        >
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="text-ink-700 text-xs font-medium">Monthly salary (PHP)</p>
                <p className="text-ink-800 tnum text-xs font-semibold">
                  {formatCurrency(salaryMin, 'PHP', { compact: true })} –{' '}
                  {salaryMax >= SALARY_CEILING
                    ? `${formatCurrency(SALARY_CEILING, 'PHP', { compact: true })}+`
                    : formatCurrency(salaryMax, 'PHP', { compact: true })}
                </p>
              </div>
              <RangeSlider
                min={SALARY_FLOOR}
                max={SALARY_CEILING}
                step={SALARY_STEP}
                value={[salaryMin, salaryMax]}
                ariaLabel="Monthly salary"
                formatValue={(value) => formatCurrency(value, 'PHP')}
                onChange={([lower, upper]) =>
                  onChange({
                    salaryMin: lower <= SALARY_FLOOR ? null : lower,
                    salaryMax: upper >= SALARY_CEILING ? null : upper,
                  })
                }
              />
              <div className="mt-3">
                <p className="text-ink-500 mb-1.5 text-[11px]">Quick minimum</p>
                <ToggleChips
                  options={SALARY_BANDS.map((band) => ({
                    value: String(band),
                    label: `₱${band / 1000}k+`,
                  }))}
                  value={filters.salaryMin !== null ? [String(filters.salaryMin)] : []}
                  onChange={(value) =>
                    onChange({ salaryMin: value.length ? Number(value[value.length - 1]) : null })
                  }
                />
              </div>
              <div className="mt-3">
                <NumberRangeInput
                  label="Exact range"
                  min={filters.salaryMin}
                  max={filters.salaryMax}
                  prefix="₱"
                  onMinChange={(value) => onChange({ salaryMin: value })}
                  onMaxChange={(value) => onChange({ salaryMax: value })}
                />
              </div>
            </div>

            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Contract duration</p>
              <ToggleChips
                options={CONTRACT_DURATION_OPTIONS.map((option) => ({
                  value: String(option.value),
                  label: option.label,
                }))}
                value={filters.contractDuration.map(String)}
                onChange={(value) => onChange({ contractDuration: value.map(Number) })}
              />
            </div>

            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Employment type</p>
              <ToggleChips
                options={toOptions(EMPLOYMENT_TYPES)}
                value={filters.employmentType}
                onChange={(value) => onChange({ employmentType: value })}
              />
            </div>

            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Working hours</p>
              <ToggleChips
                options={toOptions(WORKING_HOURS)}
                value={filters.workingHours}
                onChange={(value) => onChange({ workingHours: value })}
              />
            </div>

            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Overtime</p>
              <ToggleChips
                options={toOptions(OVERTIME_OPTIONS)}
                value={filters.overtime}
                onChange={(value) => onChange({ overtime: value })}
              />
            </div>
          </div>
        </FilterSection>

        {/* Financial ------------------------------------------------- */}
        <FilterSection
          title="Processing fees"
          description="Fee filters are upper bounds — a selected band shows employers at or below that amount."
          activeCount={activeCounts.financial}
          onClear={() =>
            onChange({
              processingFeeMax: null,
              placementFeeMax: null,
              visaFeeMax: null,
              medicalFeeMax: null,
              documentationFeeMax: null,
              totalCostMax: null,
            })
          }
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Processing fee bands</p>
              <FeeBandPicker
                value={filters.processingFeeMax}
                onChange={(value) => onChange({ processingFeeMax: value })}
                bands={[...PROCESSING_FEE_BANDS, { value: null, label: '₱100,000+' }]}
              />
            </div>

            <MaxAmountInput
              label="Processing fee up to"
              value={filters.processingFeeMax}
              onChange={(value) => onChange({ processingFeeMax: value })}
            />
            <MaxAmountInput
              label="Placement fee up to"
              value={filters.placementFeeMax}
              onChange={(value) => onChange({ placementFeeMax: value })}
            />
            <MaxAmountInput
              label="Visa fee up to"
              value={filters.visaFeeMax}
              onChange={(value) => onChange({ visaFeeMax: value })}
            />
            <MaxAmountInput
              label="Medical fee up to"
              value={filters.medicalFeeMax}
              onChange={(value) => onChange({ medicalFeeMax: value })}
            />
            <MaxAmountInput
              label="Documentation fee up to"
              value={filters.documentationFeeMax}
              onChange={(value) => onChange({ documentationFeeMax: value })}
            />

            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Total estimated cost</p>
              <FeeBandPicker
                value={filters.totalCostMax}
                onChange={(value) => onChange({ totalCostMax: value })}
                bands={[...TOTAL_COST_BANDS, { value: null, label: 'Any' }]}
              />
            </div>
          </div>
        </FilterSection>

        {/* Benefits -------------------------------------------------- */}
        <FilterSection
          title="Benefits"
          activeCount={activeCounts.benefits}
          onClear={() =>
            onChange({
              accommodation: [],
              transportation: [],
              foodAllowance: [],
              healthInsurance: [],
              overtimePay: [],
              annualLeave: [],
              airfare: [],
            })
          }
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Accommodation</p>
              <CheckboxGroup
                options={toOptions(PROVISION_LEVELS)}
                value={filters.accommodation}
                onChange={(value) => onChange({ accommodation: value })}
                columns={2}
              />
            </div>
            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Transportation</p>
              <CheckboxGroup
                options={toOptions(PROVISION_LEVELS)}
                value={filters.transportation}
                onChange={(value) => onChange({ transportation: value })}
                columns={2}
              />
            </div>
            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Food allowance</p>
              <CheckboxGroup
                options={toOptions(PROVISION_LEVELS)}
                value={filters.foodAllowance}
                onChange={(value) => onChange({ foodAllowance: value })}
                columns={2}
              />
            </div>
            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Included benefits</p>
              <div className="flex flex-col gap-1.5">
                <CheckboxGroup
                  options={[{ value: 'Yes', label: 'Health insurance' }]}
                  value={filters.healthInsurance}
                  onChange={(value) => onChange({ healthInsurance: value })}
                />
                <CheckboxGroup
                  options={[{ value: 'Yes', label: 'Overtime pay' }]}
                  value={filters.overtimePay}
                  onChange={(value) => onChange({ overtimePay: value })}
                />
              </div>
            </div>
            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Annual leave</p>
              <ToggleChips
                options={(options.annualLeave.length ? options.annualLeave : [...ANNUAL_LEAVE_OPTIONS]).map(
                  (value) => ({ value, label: value }),
                )}
                value={filters.annualLeave}
                onChange={(value) => onChange({ annualLeave: value })}
              />
            </div>
            <div>
              <p className="text-ink-700 mb-1.5 text-xs font-medium">Airfare</p>
              <ToggleChips
                options={toOptions(AIRFARE_OPTIONS)}
                value={filters.airfare}
                onChange={(value) => onChange({ airfare: value })}
              />
            </div>
          </div>
        </FilterSection>

        {/* Contract -------------------------------------------------- */}
        <FilterSection
          title="Contract status"
          activeCount={activeCounts.contract}
          onClear={() => onChange({ contractStatus: [] })}
        >
          <ToggleChips
            options={toOptions(CONTRACT_STATUSES)}
            value={filters.contractStatus}
            onChange={(value) => onChange({ contractStatus: value })}
          />
        </FilterSection>

        {/* Requirements ---------------------------------------------- */}
        <FilterSection
          title="Requirement status"
          activeCount={activeCounts.requirements}
          onClear={() => onChange({ requirementStatus: [] })}
        >
          <CheckboxGroup
            options={toOptions(REQUIREMENT_STATUSES)}
            value={filters.requirementStatus}
            onChange={(value) => onChange({ requirementStatus: value })}
          />
        </FilterSection>

        {/* Panel actions --------------------------------------------- */}
        <div className="border-ink-200 sticky bottom-0 -mx-4 mt-2 flex items-center gap-2 border-t bg-white px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw />}
            onClick={onReset}
            className="flex-1"
            title="Discard unapplied changes and restore the last applied filter set"
          >
            Reset
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<X />}
            onClick={onClearAll}
            className="flex-1"
            title="Remove every filter value"
          >
            Clear all
          </Button>
        </div>
      </div>
    </div>
  );
}
