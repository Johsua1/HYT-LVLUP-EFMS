import { ArrowRight, Layers, ShieldCheck } from 'lucide-react';
import { Reveal, SectionHeading, scrollToSection } from './primitives';
import { LANDING_BENEFITS } from './landingData';

export function WhySection() {
  return (
    <section id="why" className="border-t border-[#e6ebf3] bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            eyebrow="06 — Why it matters"
            title={
              <>
                Less scattered.{' '}
                <span className="lp-display text-[1.06em] text-[#0a7f4a] italic">More informed.</span>
              </>
            }
            description="Employer evaluation breaks down when the information lives in different files, messages and spreadsheets. EFMS keeps the whole picture in one place so decisions are made on evidence, not memory."
          />

          <Reveal delay={180}>
            <div className="mt-8 rounded-xl border border-[#e2e8f1] bg-[#f8fafd] p-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#044aa9] ring-1 ring-[#d9e8fd]">
                <Layers className="h-[17px] w-[17px]" aria-hidden />
              </span>
              <p className="text-lp-ink mt-3 text-[14px] leading-relaxed font-semibold">
                The same employer record follows the opportunity from first discovery to contract renewal.
              </p>
              <p className="text-lp-muted mt-1.5 text-[11.5px] leading-relaxed">
                No re-entering details, no mismatched versions, no guessing which spreadsheet is current.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#e2e8f1] pt-4">
                {[
                  { value: '10', label: 'Sample employers' },
                  { value: '7', label: 'Fee categories' },
                  { value: '12', label: 'Industries' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-lp-ink text-[18px] leading-none font-semibold tracking-[-0.03em]">{item.value}</p>
                    <p className="text-lp-muted mt-1 text-[9.5px] leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <button
              type="button"
              onClick={() => scrollToSection('explore')}
              className="group mt-6 inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#044aa9] transition-colors hover:text-[#053d89]"
            >
              Try the filtering preview
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </button>
          </Reveal>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {LANDING_BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Reveal key={benefit.title} delay={index * 55} className="h-full">
                <div className="group flex h-full gap-3 rounded-xl border border-[#e2e8f1] bg-white p-4 transition-colors duration-300 hover:border-[#044aa9]/25 hover:bg-[#f8fafd]">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef5fe] text-[#044aa9] ring-1 ring-[#d9e8fd] transition-transform duration-300 group-hover:-translate-y-0.5">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-lp-ink text-[12.5px] leading-snug font-semibold">{benefit.title}</p>
                    <p className="text-lp-muted mt-1 text-[11px] leading-relaxed">{benefit.description}</p>
                    {index === LANDING_BENEFITS.length - 1 ? (
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                        {['One record', 'Admin + staff', 'Status tracked'].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-[#f1f5fb] px-1.5 py-1 text-[9px] font-medium text-[#586a82]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            );
          })}

          <Reveal delay={420} className="h-full">
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl bg-[#050b18] p-4 text-white">
              <div
                className="pointer-events-none absolute -top-10 -right-8 h-32 w-32 rounded-full bg-[#0a7f4a]/30 blur-3xl"
                aria-hidden
              />
              <div className="relative">
                <ShieldCheck className="h-4 w-4 text-[#7fe3b0]" aria-hidden />
                <p className="mt-3 text-[12.5px] leading-snug font-semibold">Invitation-only workspace</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-white/55">
                  Staff accounts are created by an administrator. Ask your team lead for access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => scrollToSection('explore')}
                className="relative mt-4 inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-[#7fe3b0] transition-colors hover:text-white"
              >
                See the preview
                <ArrowRight className="h-3 w-3" aria-hidden />
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
