import type { CSSProperties } from 'react';
import { ArrowUpRight, BadgeCheck, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal, SectionHeading, SampleTag } from './primitives';
import { LANDING_FEATURES, php, type LandingFeature } from './landingData';

type VisualKind = NonNullable<LandingFeature['visual']>;

const LAYOUT: Record<string, string> = {
  filtering: 'md:col-span-2 lg:col-span-8',
  directory: 'md:col-span-1 lg:col-span-4',
  comparison: 'md:col-span-1 lg:col-span-6',
  fees: 'md:col-span-1 lg:col-span-6',
  contracts: 'md:col-span-1 lg:col-span-4',
  requirements: 'md:col-span-1 lg:col-span-4',
  verification: 'md:col-span-1 lg:col-span-4',
  reports: 'md:col-span-2 lg:col-span-12',
};

const TONE: Record<string, string> = {
  filtering: 'bg-[#eef5fe] text-[#044aa9] ring-[#d9e8fd]',
  directory: 'bg-[#effdf7] text-[#0a7f4a] ring-[#b3f0d4]',
  comparison: 'bg-[#eef5fe] text-[#044aa9] ring-[#d9e8fd]',
  fees: 'bg-[#effdf7] text-[#0a7f4a] ring-[#b3f0d4]',
  contracts: 'bg-[#fffbeb] text-[#b45309] ring-[#fde68a]',
  requirements: 'bg-[#eef5fe] text-[#044aa9] ring-[#d9e8fd]',
  verification: 'bg-[#effdf7] text-[#0a7f4a] ring-[#b3f0d4]',
  reports: 'bg-[#eef5fe] text-[#044aa9] ring-[#d9e8fd]',
};

function FlagRow({ code, label, meta }: { code: string; label: string; meta: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 ring-1 ring-[#eef2f8]">
      <span className="text-[9px] font-semibold text-[#64748b]">{code}</span>
      <span className="text-lp-ink flex-1 truncate text-[9.5px] font-medium">{label}</span>
      <span className="text-lp-muted text-[8.5px]">{meta}</span>
    </div>
  );
}

function FilterVisual() {
  return (
    <div className="rounded-lg border border-[#eef2f8] bg-[#f8fafd] p-3">
      <div className="flex flex-wrap gap-1.5">
        {['Manufacturing', '2–3 years', 'Housing'].map((chip, index) => (
          <span
            key={chip}
            className={cn(
              'rounded-full px-2 py-1 text-[9.5px] font-medium',
              index === 0 ? 'bg-[#044aa9] text-white' : 'bg-white text-[#586a82] ring-1 ring-[#e2e8f1]',
            )}
          >
            {chip}
          </span>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {[
          { code: 'JP', label: 'Japan · Manufacturing', value: '₱68k–₱84k' },
          { code: 'DE', label: 'Germany · Manufacturing', value: '₱135k–₱166k' },
          { code: 'SE', label: 'Sweden · Manufacturing', value: '₱151k–₱178k' },
        ].map((row) => (
          <div key={row.code} className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 ring-1 ring-[#eef2f8]">
            <span className="text-[9px] font-semibold text-[#64748b]">{row.code}</span>
            <span className="text-lp-ink flex-1 truncate text-[9.5px] font-medium">{row.label}</span>
            <span className="text-lp-ink text-[9px] font-semibold tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
      <p className="text-lp-muted mt-2 text-[8.5px]">3 of 10 sample employers match these filters.</p>
    </div>
  );
}

function DirectoryVisual() {
  return (
    <div className="space-y-1.5">
      <FlagRow code="JP" label="Japan" meta="Manufacturing" />
      <FlagRow code="KR" label="South Korea" meta="Marine" />
      <FlagRow code="AE" label="United Arab Emirates" meta="Hospitality" />
      <FlagRow code="SG" label="Singapore" meta="Engineering" />
      <FlagRow code="DE" label="Germany" meta="Manufacturing" />
    </div>
  );
}

function ComparisonVisual() {
  return (
    <div className="rounded-lg border border-[#eef2f8] bg-[#f8fafd] p-3">
      <div className="flex items-end justify-between gap-3">
        {[
          { code: 'JP', height: 38, value: '₱84k' },
          { code: 'KR', height: 62, value: '₱130k' },
          { code: 'AU', height: 88, value: '₱185k' },
        ].map((bar) => (
          <div key={bar.code} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-lp-ink text-[8.5px] font-semibold tabular-nums">{bar.value}</span>
            <div className="flex h-[96px] w-full items-end">
              <div
                className="w-full rounded-t-[3px] bg-gradient-to-t from-[#044aa9] to-[#4a90f5]"
                style={{ height: `${bar.height}%` }}
              />
            </div>
            <span className="text-lp-muted text-[8.5px] font-medium">{bar.code}</span>
          </div>
        ))}
      </div>
      <p className="text-lp-muted mt-2 border-t border-[#eef2f8] pt-2 text-[8.5px]">Monthly salary ceiling, PHP</p>
    </div>
  );
}

function FeesVisual() {
  return (
    <div className="rounded-lg border border-[#eef2f8] bg-[#f8fafd] p-3">
      <div className="flex items-center justify-between gap-2 text-[8.5px] font-semibold tracking-[0.12em] text-[#64748b] uppercase">
        <span>Fee breakdown</span>
        <span>PHP</span>
      </div>
      <div className="mt-2 space-y-1.5">
        {[
          { label: 'Processing fee', value: 18000 },
          { label: 'Placement fee', value: 12000 },
          { label: 'Visa', value: 8500 },
          { label: 'Medical', value: 4200 },
          { label: 'Documentation', value: 4500 },
        ].map((fee) => (
          <div key={fee.label} className="flex items-center justify-between gap-2 text-[10px]">
            <span className="text-lp-muted">{fee.label}</span>
            <span className="text-lp-ink font-medium tabular-nums">{php(fee.value)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#e2e8f1] pt-2 text-[10.5px]">
        <span className="text-lp-ink font-semibold">Estimated total</span>
        <span className="text-lp-ink font-semibold tabular-nums">₱47,200</span>
      </div>
    </div>
  );
}

function ContractVisual() {
  return (
    <div>
      <div className="flex items-center justify-between text-[9.5px]">
        <span className="text-lp-ink font-medium">36-month contract</span>
        <span className="text-[#0a7f4a] font-semibold">Active</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#eef2f8]">
        <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#0a7f4a] to-[#33d68c]" />
      </div>
      <div className="text-lp-muted mt-1.5 flex justify-between text-[8.5px]">
        <span>Started</span>
        <span>14 months remaining</span>
      </div>
    </div>
  );
}

function RequirementsVisual() {
  return (
    <div className="space-y-1.5">
      {[
        { label: 'Company registration', done: true },
        { label: 'Job order', done: true },
        { label: 'Insurance documents', done: false },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-[9.5px]">
          {item.done ? (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#effdf7] text-[#0a7f4a] ring-1 ring-[#b3f0d4]">
              <Check className="h-2.5 w-2.5" aria-hidden />
            </span>
          ) : (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#fffbeb] text-[#b45309] ring-1 ring-[#fde68a]">
              <Clock className="h-2.5 w-2.5" aria-hidden />
            </span>
          )}
          <span className={item.done ? 'text-lp-muted' : 'text-lp-ink font-medium'}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function VerificationVisual() {
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        <div className="w-[70%] bg-[#0a7f4a]" />
        <div className="w-[30%] bg-[#f59e0b]" />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[8.5px]">
        <span className="text-lp-muted flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0a7f4a]" aria-hidden />7 verified
        </span>
        <span className="text-lp-muted flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" aria-hidden />3 under review
        </span>
      </div>
    </div>
  );
}

function ReportsVisual() {
  const bars = [52, 74, 38, 88, 61, 45, 79];
  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-3">
        {bars.map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-[74px] w-full items-end">
              <div
                className="w-full rounded-t-[3px] bg-gradient-to-t from-[#044aa9]/75 to-[#4a90f5]"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-lp-muted text-[8px]">
              {['Mfg', 'Hosp', 'Health', 'Eng', 'Agri', 'Food', 'Marine'][index]}
            </span>
          </div>
        ))}
      </div>
      <div className="text-lp-muted mt-2 flex items-center justify-between border-t border-[#eef2f8] pt-2 text-[8.5px]">
        <span>Sample employers by industry</span>
        <span className="font-semibold text-[#044aa9]">7 of 12 categories represented</span>
      </div>
    </div>
  );
}

function FeatureVisual({ kind }: { kind: VisualKind }) {
  switch (kind) {
    case 'filter':
      return <FilterVisual />;
    case 'directory':
      return <DirectoryVisual />;
    case 'compare':
      return <ComparisonVisual />;
    case 'fees':
      return <FeesVisual />;
    case 'contract':
      return <ContractVisual />;
    case 'requirements':
      return <RequirementsVisual />;
    case 'verification':
      return <VerificationVisual />;
    case 'reports':
      return <ReportsVisual />;
    default:
      return null;
  }
}

export function FeaturesBento() {
  return (
    <section id="features" className="relative border-y border-[#e6ebf3] bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="02 — Capabilities"
            title={
              <>
                A complete employer{' '}
                <span className="lp-display text-[1.06em] text-[#0a7f4a] italic">evaluation workspace.</span>
              </>
            }
            description="Eight connected capabilities cover the full path from discovery to a documented, comparable assessment."
          />
          <Reveal delay={200} className="shrink-0">
            <div className="border-lp-line flex items-center gap-2 rounded-lg border bg-[#f8fafd] px-3 py-2">
              <SampleTag />
              <span className="text-lp-muted text-[10.5px]">Illustrative screens</span>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-12">
          {LANDING_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            const large = feature.key === 'filtering';
            const reports = feature.key === 'reports';
            return (
              <Reveal key={feature.key} delay={index * 45} className={cn('h-full', LAYOUT[feature.key])}>
                <article
                  className={cn(
                    'lp-bento group flex h-full flex-col rounded-xl border border-[#e2e8f1] bg-white p-5 transition-colors duration-300 hover:border-[#044aa9]/25 sm:p-6',
                    large && 'lg:p-7',
                    reports && 'lg:flex-row lg:items-end lg:gap-10',
                  )}
                  style={{ '--lp-bento-glow': feature.glow } as CSSProperties}
                >
                  <div className={cn(reports && 'lg:w-[36%] lg:shrink-0')}>
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          'lp-bento-icon inline-flex h-10 w-10 items-center justify-center rounded-lg ring-1',
                          TONE[feature.key],
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <ArrowUpRight
                        className="lp-bento-arrow mt-1 h-4 w-4 text-[#044aa9]"
                        aria-hidden
                      />
                    </div>

                    <h3
                      className={cn(
                        'text-lp-ink mt-5 font-semibold tracking-[-0.015em]',
                        large ? 'text-[18px] sm:text-[20px]' : 'text-[14.5px]',
                      )}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={cn(
                        'text-lp-muted mt-1.5 leading-relaxed',
                        large ? 'max-w-md text-[13px]' : 'text-[12.5px]',
                      )}
                    >
                      {feature.description}
                    </p>
                  </div>

                  {feature.visual ? (
                    <div
                      className={cn(
                        'mt-auto',
                        large ? 'pt-6' : 'pt-5',
                        reports && 'lg:mt-0 lg:flex-1 lg:pt-0',
                      )}
                    >
                      <FeatureVisual kind={feature.visual} />
                    </div>
                  ) : null}
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={120}>
          <p className="text-lp-muted mt-6 flex flex-wrap items-center gap-2 text-[10.5px]">
            <BadgeCheck className="h-3.5 w-3.5 text-[#0a7f4a]" aria-hidden />
            Interface previews use the same fields the system records for every employer.
            <span className="text-lp-muted/70">Values shown are sample data.</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
