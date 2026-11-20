import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal, SectionHeading, useInView } from './primitives';
import { LANDING_STEPS } from './landingData';

export function HowItWorks() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 });

  return (
    <section id="how-it-works" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[#044aa9]/[0.045] blur-3xl"
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="03 — Workflow"
            title={
              <>
                From searching to smarter{' '}
                <span className="text-[#044aa9]">employer evaluation.</span>
              </>
            }
            description="Four steps, one continuous record. Every stage feeds the next, so an assessment is backed by the same employer data from start to finish."
          />
          <Reveal delay={200} className="shrink-0">
            <div className="border-lp-line inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-[10.5px] text-[#64748b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0a7f4a]" aria-hidden />
              Sample workflow · 4 stages
            </div>
          </Reveal>
        </div>

        <div ref={ref}>
          {/* Desktop timeline --------------------------------------- */}
          <div className="relative mt-16 hidden lg:block">
            <div className="absolute top-[22px] h-px bg-[#e5eaf0]" style={{ left: 22, right: 'calc(25% - 22px)' }} />
            <div
              className={cn(
                'lp-line-fill absolute top-[22px] h-px bg-gradient-to-r from-[#044aa9] via-[#0b65d8] to-[#0a7f4a]',
                inView && 'is-in',
              )}
              style={{ left: 22, right: 'calc(25% - 22px)' }}
            />

            <ol className="relative grid grid-cols-4 gap-8">
              {LANDING_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.index}>
                    <Reveal delay={index * 110}>
                      <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e8fd] bg-white font-display text-[12px] font-bold text-[#044aa9] shadow-[0_0_0_7px_#f5f7fa]">
                        {step.index}
                      </span>
                      <div className="mt-6 max-w-[240px]">
                        <span
                          className={
                            index === LANDING_STEPS.length - 1
                              ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#effdf7] text-[#0a7f4a] ring-1 ring-[#b3f0d4]'
                              : 'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef5fe] text-[#044aa9] ring-1 ring-[#d9e8fd]'
                          }
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <h3 className="text-lp-ink mt-3 text-[15px] font-semibold">{step.title}</h3>
                        <p className="text-lp-muted mt-1.5 text-[12.5px] leading-relaxed">{step.description}</p>
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Mobile timeline ---------------------------------------- */}
          <ol className="relative mt-12 ml-4 space-y-9 border-l border-[#e5eaf0] pl-8 lg:hidden">
            <span
              className={cn(
                'lp-line-fill-y absolute top-0 -left-px h-full w-px bg-gradient-to-b from-[#044aa9] via-[#0b65d8] to-[#0a7f4a]',
                inView && 'is-in',
              )}
              aria-hidden
            />
            {LANDING_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.index} className="relative">
                  <span className="absolute -left-12 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-[#d9e8fd] bg-white text-[10px] font-bold text-[#044aa9]">
                    {step.index}
                  </span>
                  <Reveal delay={index * 90}>
                    <div className="flex items-center gap-2">
                      <Icon
                        className={
                          index === LANDING_STEPS.length - 1 ? 'h-4 w-4 text-[#0a7f4a]' : 'h-4 w-4 text-[#044aa9]'
                        }
                        aria-hidden
                      />
                      <h3 className="text-lp-ink text-[15px] font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-lp-muted mt-1.5 text-[12.5px] leading-relaxed">{step.description}</p>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>

        <Reveal delay={160}>
          <div className="mt-14 flex flex-col items-start justify-between gap-4 rounded-xl border border-[#e5eaf0] bg-white px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-lp-muted text-[12px]">
              <span className="text-lp-ink font-semibold">Every stage writes to the same record.</span> Nothing has to be
              re-entered when an employer moves from discovery to review.
            </p>
            <span className="text-lp-muted inline-flex items-center gap-1.5 text-[10.5px]">
              Illustrative workflow
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
