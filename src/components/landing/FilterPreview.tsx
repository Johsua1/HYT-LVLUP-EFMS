import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, RotateCcw, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Flag, Reveal, SectionHeading, SampleTag } from './primitives';
import {
  FILTER_COUNTRIES,
  FILTER_DURATIONS,
  FILTER_INDUSTRIES,
  FILTER_POSITIONS,
  SAMPLE_EMPLOYERS,
  durationLabel,
  php,
} from './landingData';

type RangeVars = CSSProperties & { '--lp-fill'?: string };

const SALARY_MIN = 20000;
const SALARY_MAX = 180000;
const FEE_MIN = 8000;
const FEE_MAX = 40000;

function FilterLabel({ children, value }: { children: ReactNode; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[9.5px] font-semibold tracking-[0.14em] text-[#586a82] uppercase">{children}</span>
      {value ? <span className="text-[10.5px] font-semibold text-[#0a1322] tabular-nums">{value}</span> : null}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
}) {
  return (
    <label className="block">
      <span className="text-[9.5px] font-semibold tracking-[0.14em] text-[#586a82] uppercase">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="lp-select mt-1.5 h-9 w-full rounded-lg border border-[#e2e8f1] bg-white pl-2.5 text-[11.5px] text-[#0a1322] outline-none transition-colors focus:border-[#044aa9] focus:ring-2 focus:ring-[#044aa9]/12"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterPreview() {
  const [country, setCountry] = useState<string | null>(null);
  const [industry, setIndustry] = useState('');
  const [position, setPosition] = useState('');
  const [minSalary, setMinSalary] = useState(SALARY_MIN);
  const [maxFee, setMaxFee] = useState(FEE_MAX);
  const [duration, setDuration] = useState<number | null>(null);
  const [housingOnly, setHousingOnly] = useState(false);
  const [status, setStatus] = useState<'Any' | 'Active' | 'Pending'>('Any');

  const activeCount = [
    country,
    industry,
    position,
    duration,
    housingOnly,
    status !== 'Any',
    minSalary !== SALARY_MIN,
    maxFee !== FEE_MAX,
  ].filter(Boolean).length;

  const reset = () => {
    setCountry(null);
    setIndustry('');
    setPosition('');
    setMinSalary(SALARY_MIN);
    setMaxFee(FEE_MAX);
    setDuration(null);
    setHousingOnly(false);
    setStatus('Any');
  };

  const results = useMemo(
    () =>
      SAMPLE_EMPLOYERS.filter(
        (employer) =>
          (!country || employer.country === country) &&
          (!industry || employer.industry === industry) &&
          (!position || employer.position === position) &&
          employer.salaryMin >= minSalary &&
          employer.fee <= maxFee &&
          (!duration || employer.durationMonths === duration) &&
          (!housingOnly || employer.accommodation === 'Provided') &&
          (status === 'Any' || employer.status === status),
      ),
    [country, industry, position, minSalary, maxFee, duration, housingOnly, status],
  );

  const signature = `${country}|${industry}|${position}|${minSalary}|${maxFee}|${duration}|${housingOnly}|${status}`;
  const salaryFill = ((minSalary - SALARY_MIN) / (SALARY_MAX - SALARY_MIN)) * 100;
  const feeFill = ((maxFee - FEE_MIN) / (FEE_MAX - FEE_MIN)) * 100;

  return (
    <section id="explore" className="relative py-20 sm:py-24 lg:py-28">
      <div
        className="lp-dotgrid pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-40 [mask-image:linear-gradient(to_bottom,#000,transparent)]"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="05 — Interactive preview"
          title={
            <>
              Your criteria. Your search.{' '}
              <span className="lp-display text-[1.06em] text-[#044aa9] italic">Better comparisons.</span>
            </>
          }
          description="This is a working preview of the filtering workspace. Change a filter and the sample results update immediately — the same logic the full system applies to real employer records."
        />

        <Reveal delay={120} className="mt-10">
          <div className="overflow-hidden rounded-2xl border border-[#dde5f0] bg-white shadow-[0_40px_90px_-55px_rgba(10,19,34,0.5)]">
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
              {/* Filters -------------------------------------------- */}
              <div className="min-w-0 border-b border-[#e2e8f1] bg-[#f8fafd] p-4 sm:p-5 lg:border-r lg:border-b-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0a1322]">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#044aa9]" aria-hidden />
                    Filters
                    {activeCount > 0 ? (
                      <span className="rounded-full bg-[#044aa9] px-1.5 py-0.5 text-[8.5px] font-bold text-white">
                        {activeCount}
                      </span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={reset}
                    className="text-lp-muted inline-flex items-center gap-1 text-[10px] font-medium transition-colors hover:text-[#044aa9]"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden />
                    Reset
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <FilterLabel>Country</FilterLabel>
                    <div className="mt-1.5 max-h-[136px] overflow-y-auto pr-1">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCountry(null)}
                          aria-pressed={country === null}
                          className={cn(
                            'col-span-2 rounded-md px-2 py-1.5 text-left text-[10px] font-medium transition-colors',
                            country === null
                              ? 'bg-[#044aa9] text-white'
                              : 'bg-white text-[#586a82] ring-1 ring-[#e2e8f1] hover:bg-[#eef5fe]',
                          )}
                        >
                          All countries
                        </button>
                        {FILTER_COUNTRIES.map((name) => {
                          const code = SAMPLE_EMPLOYERS.find((employer) => employer.country === name)?.code ?? '';
                          const selected = country === name;
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setCountry(selected ? null : name)}
                              aria-pressed={selected}
                              className={cn(
                                'flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-[9.5px] font-medium transition-colors',
                                selected
                                  ? 'bg-[#044aa9] text-white'
                                  : 'bg-white text-[#586a82] ring-1 ring-[#e2e8f1] hover:bg-[#eef5fe]',
                              )}
                            >
                              <Flag code={code} className="h-3.5 w-5" />
                              <span className="truncate">{name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <Select
                    label="Industry"
                    value={industry}
                    onChange={setIndustry}
                    options={FILTER_INDUSTRIES}
                    allLabel="All industries"
                  />
                  <Select
                    label="Position"
                    value={position}
                    onChange={setPosition}
                    options={FILTER_POSITIONS}
                    allLabel="All positions"
                  />

                  <div>
                    <FilterLabel value={php(minSalary)}>Minimum salary</FilterLabel>
                    <input
                      type="range"
                      min={SALARY_MIN}
                      max={SALARY_MAX}
                      step={5000}
                      value={minSalary}
                      onChange={(event) => setMinSalary(Number(event.target.value))}
                      aria-label="Minimum monthly salary in PHP"
                      aria-valuetext={php(minSalary)}
                      className="lp-range mt-2"
                      style={{ '--lp-fill': `${salaryFill}%` } as RangeVars}
                    />
                    <div className="mt-1 flex justify-between text-[8.5px] text-[#64748b]">
                      <span>₱20k</span>
                      <span>₱180k</span>
                    </div>
                  </div>

                  <div>
                    <FilterLabel value={php(maxFee)}>Max processing fee</FilterLabel>
                    <input
                      type="range"
                      min={FEE_MIN}
                      max={FEE_MAX}
                      step={1000}
                      value={maxFee}
                      onChange={(event) => setMaxFee(Number(event.target.value))}
                      aria-label="Maximum processing fee in PHP"
                      aria-valuetext={php(maxFee)}
                      className="lp-range mt-2"
                      style={{ '--lp-fill': `${feeFill}%` } as RangeVars}
                    />
                    <div className="mt-1 flex justify-between text-[8.5px] text-[#64748b]">
                      <span>₱8k</span>
                      <span>₱40k</span>
                    </div>
                  </div>

                  <div>
                    <FilterLabel>Contract duration</FilterLabel>
                    <div className="mt-1.5 grid grid-cols-3 gap-1">
                      {[{ value: null, label: 'Any' }, ...FILTER_DURATIONS.map((months) => ({ value: months, label: durationLabel(months) }))].map(
                        (option) => (
                          <button
                            key={String(option.value)}
                            type="button"
                            onClick={() => setDuration(option.value)}
                            aria-pressed={duration === option.value}
                            className={cn(
                              'rounded-md px-1 py-1.5 text-[9.5px] font-medium transition-colors',
                              duration === option.value
                                ? 'bg-[#044aa9] text-white'
                                : 'bg-white text-[#586a82] ring-1 ring-[#e2e8f1] hover:bg-[#eef5fe]',
                            )}
                          >
                            {option.label}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={housingOnly}
                    onClick={() => setHousingOnly((value) => !value)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#e2e8f1] bg-white px-2.5 py-2 text-left"
                  >
                    <span className="text-[10px] font-medium text-[#586a82]">Housing provided only</span>
                    <span
                      className={cn(
                        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                        housingOnly ? 'bg-[#044aa9]' : 'bg-[#cbd5e1]',
                      )}
                      aria-hidden
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                          housingOnly ? 'translate-x-[18px]' : 'translate-x-0.5',
                        )}
                      />
                    </span>
                  </button>

                  <div>
                    <FilterLabel>Employer status</FilterLabel>
                    <div className="mt-1.5 grid grid-cols-3 gap-1">
                      {(['Any', 'Active', 'Pending'] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setStatus(option)}
                          aria-pressed={status === option}
                          className={cn(
                            'rounded-md px-1 py-1.5 text-[9.5px] font-medium transition-colors',
                            status === option
                              ? 'bg-[#044aa9] text-white'
                              : 'bg-white text-[#586a82] ring-1 ring-[#e2e8f1] hover:bg-[#eef5fe]',
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Results -------------------------------------------- */}
              <div className="min-w-0 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11.5px] text-[#586a82]" aria-live="polite">
                    <span className="font-semibold text-[#0a1322] tabular-nums">{results.length}</span>{' '}
                    {results.length === 1 ? 'sample employer' : 'sample employers'} match
                  </p>
                  <div className="flex items-center gap-2">
                    <SampleTag />
                    <span className="text-[9.5px] text-[#64748b]">Illustrative preview</span>
                  </div>
                </div>

                {results.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {results.map((employer, index) => (
                      <article
                        key={`${employer.id}-${signature}`}
                        className="lp-result flex flex-col rounded-xl border border-[#e2e8f1] bg-white p-4 transition-colors hover:border-[#044aa9]/30"
                        style={{ animationDelay: `${index * 45}ms` }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Flag code={employer.code} className="h-7 w-10" />
                            <div className="min-w-0">
                              <p className="text-[8px] font-semibold tracking-[0.12em] text-[#64748b] uppercase">
                                {employer.country}
                              </p>
                              <p className="text-lp-ink truncate text-[12px] font-semibold">{employer.title}</p>
                            </div>
                          </div>
                          <SampleTag />
                        </div>

                        <div className="mt-3">
                          <p className="text-lp-ink text-[16px] font-semibold tracking-[-0.02em] tabular-nums">
                            {php(employer.salaryMin)} – {php(employer.salaryMax)}
                          </p>
                          <p className="mt-0.5 text-[9px] text-[#64748b]">Estimated monthly · PHP equivalent</p>
                        </div>

                        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#eef2f8] pt-3">
                          <div>
                            <dt className="text-[8px] font-semibold tracking-[0.1em] text-[#64748b] uppercase">
                              Position
                            </dt>
                            <dd className="text-lp-ink mt-0.5 text-[10px] font-medium">{employer.position}</dd>
                          </div>
                          <div>
                            <dt className="text-[8px] font-semibold tracking-[0.1em] text-[#64748b] uppercase">
                              Contract
                            </dt>
                            <dd className="text-lp-ink mt-0.5 text-[10px] font-medium">
                              {durationLabel(employer.durationMonths)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[8px] font-semibold tracking-[0.1em] text-[#64748b] uppercase">
                              Processing fee
                            </dt>
                            <dd className="text-lp-ink mt-0.5 text-[10px] font-medium tabular-nums">
                              {php(employer.fee)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[8px] font-semibold tracking-[0.1em] text-[#64748b] uppercase">
                              Housing
                            </dt>
                            <dd className="text-lp-ink mt-0.5 text-[10px] font-medium">{employer.accommodation}</dd>
                          </div>
                        </dl>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold ring-1',
                              employer.verification === 'Verified'
                                ? 'bg-[#effdf7] text-[#0a7f4a] ring-[#b3f0d4]'
                                : 'bg-[#fffbeb] text-[#b45309] ring-[#fde68a]',
                            )}
                          >
                            {employer.verification === 'Verified' ? (
                              <BadgeCheck className="h-2.5 w-2.5" aria-hidden />
                            ) : (
                              <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                            )}
                            {employer.verification}
                          </span>
                          <span className="rounded-full bg-[#f1f5fb] px-1.5 py-0.5 text-[8.5px] font-medium text-[#586a82] ring-1 ring-[#e2e8f1]">
                            {employer.status}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d7e0ec] bg-[#f8fafd] px-6 py-14 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#64748b] ring-1 ring-[#e2e8f1]">
                      <Search className="h-4 w-4" aria-hidden />
                    </span>
                    <p className="text-lp-ink mt-3 text-[13px] font-semibold">No sample employers match these filters.</p>
                    <p className="text-lp-muted mt-1 max-w-xs text-[11px] leading-relaxed">
                      Widen the salary or fee range, or clear a filter to see the full sample dataset.
                    </p>
                    <button
                      type="button"
                      onClick={reset}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#044aa9] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#053d89]"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden />
                      Reset filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl bg-[#050b18] px-5 py-5 text-white sm:flex-row sm:items-center sm:px-6">
            <div>
              <p className="text-[13px] font-semibold">Explore employer filtering in the full workspace.</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/50">
                Sign in with an administrator-issued account. Access is invitation-only.
              </p>
            </div>
            <Link
              to="/login"
              className="lp-cta-primary inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-[12px] font-semibold text-[#0a1322] transition-colors hover:bg-[#e9eff8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore employer filtering
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
