import { ArrowRight, BadgeCheck, Check, Clock, FileSignature, ListChecks, ReceiptText, ShieldCheck } from 'lucide-react';
import { Reveal, SectionHeading, SampleTag, scrollToSection } from './primitives';

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'One record per employer',
    body: 'Company details, contacts, verification and documents stay together.',
  },
  {
    icon: ReceiptText,
    title: 'Costs you can actually compare',
    body: 'Processing, placement, visa and medical fees are itemised, not buried.',
  },
  {
    icon: FileSignature,
    title: 'Contracts and requirements tracked',
    body: 'Duration, expiry and outstanding documents are visible at a glance.',
  },
];

const FEE_ROWS = [
  { label: 'Processing', value: '₱18,000' },
  { label: 'Placement', value: '₱12,000' },
  { label: 'Visa', value: '₱8,500' },
  { label: 'Medical', value: '₱4,200' },
  { label: 'Documentation', value: '₱4,500' },
];

const REQUIREMENTS = [
  { label: 'Company registration', done: true },
  { label: 'Job order', done: true },
  { label: 'Employment contract', done: true },
  { label: 'Insurance documents', done: false },
  { label: 'Medical certificate', done: false },
];

export function AboutSection() {
  return (
    <section id="platform" className="relative py-20 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="01 — The platform"
            title={
              <>
                Everything you need to evaluate{' '}
                <span className="text-[#0a7f4a]">overseas employers.</span>
              </>
            }
            description="Managing international employer information can be complicated. This platform brings essential employer details into one organized workspace, making it easier to discover opportunities, review requirements, compare costs, and evaluate employment conditions."
          />

          <div className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={180 + index * 70}>
                  <div className="flex gap-3.5">
                    <span
                      className={
                        index % 2 === 0
                          ? 'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef5fe] text-[#044aa9] ring-1 ring-[#d9e8fd]'
                          : 'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#effdf7] text-[#0a7f4a] ring-1 ring-[#b3f0d4]'
                      }
                    >
                      <Icon className="h-[17px] w-[17px]" aria-hidden />
                    </span>
                    <div>
                      <p className="text-lp-ink text-[13.5px] font-semibold">{item.title}</p>
                      <p className="text-lp-muted mt-1 text-[12.5px] leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={420}>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="group mt-8 inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#044aa9] transition-colors hover:text-[#053d89]"
            >
              See how the workflow fits together
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </button>
          </Reveal>
        </div>

        {/* Interface preview ------------------------------------------ */}
        <Reveal delay={140} y={28} className="relative">
          <div
            className="lp-dotgrid pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10 opacity-50 [mask-image:radial-gradient(65%_60%_at_50%_45%,#000,transparent)]"
            aria-hidden
          />
          <div className="pointer-events-none absolute -top-10 -right-6 -z-10 h-44 w-44 rounded-full bg-[#0a7f4a]/10 blur-3xl" aria-hidden />

          <div className="relative mx-auto max-w-[540px] overflow-hidden rounded-2xl border border-[#e5eaf0] bg-white shadow-[0_40px_90px_-48px_rgba(8,11,16,0.55)]">
            <div className="lp-brand-rule absolute inset-x-0 top-0 rounded-none" aria-hidden />
            <div className="flex items-center gap-2 border-b border-[#e5eaf0] px-4 py-3">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-[#e5eaf0]" />
                <span className="h-2 w-2 rounded-full bg-[#e5eaf0]" />
                <span className="h-2 w-2 rounded-full bg-[#e5eaf0]" />
              </span>
              <span className="text-lp-muted ml-2 rounded-md bg-[#f5f7fa] px-2 py-1 text-[9.5px]">
                efms / employer-record
              </span>
              <span className="ml-auto">
                <SampleTag />
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold"
                  style={{ backgroundColor: '#e7f0fe', color: '#044aa9' }}
                  aria-hidden
                >
                  MF
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lp-ink truncate text-[13.5px] font-semibold">Manufacturing Employer</p>
                  <p className="text-lp-muted mt-0.5 text-[10.5px]">Aichi, Japan · Manufacturing · 1,000+ employees</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#effdf7] px-2 py-0.5 text-[9px] font-semibold text-[#0a7f4a] ring-1 ring-[#b3f0d4]">
                  <BadgeCheck className="h-3 w-3" aria-hidden />
                  Verified
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#e5eaf0] p-3">
                  <p className="text-lp-muted flex items-center gap-1.5 text-[9px] font-semibold tracking-[0.12em] uppercase">
                    <ReceiptText className="h-3 w-3" aria-hidden />
                    Fee breakdown
                  </p>
                  <dl className="mt-2.5 space-y-1.5">
                    {FEE_ROWS.map((fee) => (
                      <div key={fee.label} className="flex items-center justify-between gap-2 text-[10.5px]">
                        <dt className="text-lp-muted">{fee.label}</dt>
                        <dd className="text-lp-ink font-medium tabular-nums">{fee.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-2.5 flex items-center justify-between border-t border-[#eef2f8] pt-2 text-[10.5px]">
                    <span className="text-lp-ink font-semibold">Estimated total</span>
                    <span className="text-lp-ink font-semibold tabular-nums">₱47,200</span>
                  </div>
                </div>

                <div className="rounded-lg border border-[#e5eaf0] p-3">
                  <p className="text-lp-muted flex items-center gap-1.5 text-[9px] font-semibold tracking-[0.12em] uppercase">
                    <ListChecks className="h-3 w-3" aria-hidden />
                    Requirements
                  </p>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#eef2f8]">
                    <div className="h-full rounded-full bg-[#044aa9]" style={{ width: '60%' }} />
                  </div>
                  <p className="text-lp-muted mt-1.5 text-[9.5px]">3 of 5 mandatory documents complete</p>
                  <ul className="mt-2.5 space-y-1.5">
                    {REQUIREMENTS.map((item) => (
                      <li key={item.label} className="flex items-center gap-1.5 text-[10px]">
                        {item.done ? (
                          <Check className="h-3 w-3 shrink-0 text-[#0a7f4a]" aria-hidden />
                        ) : (
                          <Clock className="h-3 w-3 shrink-0 text-[#d97706]" aria-hidden />
                        )}
                        <span className={item.done ? 'text-lp-muted' : 'text-lp-ink font-medium'}>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f8fafd] px-3 py-2">
                <span className="text-lp-muted flex items-center gap-1.5 text-[9.5px]">
                  <FileSignature className="h-3 w-3" aria-hidden />
                  Contract active · 36 months
                </span>
                <span className="text-[9.5px] font-semibold text-[#0a7f4a]">Renewal not due</span>
              </div>
            </div>
          </div>

          <div className="lp-glass-light absolute -top-5 -left-4 hidden items-center gap-2 rounded-lg px-2.5 py-2 sm:flex">
            <ReceiptText className="h-3.5 w-3.5 text-[#044aa9]" aria-hidden />
            <span className="text-lp-ink text-[10px] font-semibold">Fee transparency</span>
          </div>
          <div className="lp-glass-light absolute -right-3 -bottom-5 hidden items-center gap-2 rounded-lg px-2.5 py-2 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0a7f4a]" aria-hidden />
            <span className="text-lp-ink text-[10px] font-semibold">Requirements tracked</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
