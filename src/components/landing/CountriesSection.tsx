import { ArrowUpRight, Globe2 } from 'lucide-react';
import { Flag, Reveal, SectionHeading, SampleTag } from './primitives';
import { LANDING_COUNTRIES, OTHER_COUNTRIES } from './landingData';

export function CountriesSection() {
  return (
    <section id="countries" className="border-y border-[#e6ebf3] bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="04 — Destinations"
            title={
              <>
                International employers, one{' '}
                <span className="lp-display text-[1.06em] text-[#0a7f4a] italic">standard of review.</span>
              </>
            }
            description="Filter by destination and compare opportunities across ten countries in the sample dataset. Each card shows the industries and sample roles represented in that market."
          />
          <Reveal delay={180} className="shrink-0">
            <div className="flex items-center gap-2">
              <SampleTag />
              <span className="text-lp-muted text-[10.5px]">Not active job listings</span>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {LANDING_COUNTRIES.map((country, index) => (
            <Reveal key={country.code} delay={index * 55} className="h-full">
              <article className="lp-country flex h-full flex-col rounded-xl border border-[#e2e8f1] bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <Flag code={country.code} className="lp-country-flag h-9 w-[52px]" />
                  <ArrowUpRight className="lp-country-arrow mt-1 h-4 w-4 text-[#044aa9]" aria-hidden />
                </div>

                <h3 className="text-lp-ink mt-4 text-[14px] font-semibold tracking-[-0.01em]">{country.name}</h3>
                <p className="text-lp-muted mt-0.5 text-[10.5px]">{country.note}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {country.industries.map((industry) => (
                    <span
                      key={industry}
                      className="rounded-full bg-[#f1f5fb] px-2 py-0.5 text-[9.5px] font-medium text-[#586a82] ring-1 ring-[#e2e8f1]"
                    >
                      {industry}
                    </span>
                  ))}
                </div>

                <div className="mt-auto border-t border-[#eef2f8] pt-3.5">
                  <p className="text-[8.5px] font-semibold tracking-[0.14em] text-[#64748b] uppercase">Sample roles</p>
                  <p className="text-lp-muted mt-1 text-[10.5px] leading-relaxed">{country.positions.join(' · ')}</p>
                </div>
              </article>
            </Reveal>
          ))}

          <Reveal delay={420} className="h-full">
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl bg-[#050b18] p-5 text-white">
              <div
                className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-[#2f7bf0]/25 blur-3xl"
                aria-hidden
              />
              <div className="relative">
                <p className="flex items-center gap-1.5 text-[8.5px] font-semibold tracking-[0.16em] text-white/55 uppercase">
                  <Globe2 className="h-3 w-3" aria-hidden />
                  Also in the dataset
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {OTHER_COUNTRIES.map((country) => (
                    <span
                      key={country}
                      className="rounded-full bg-white/[0.07] px-2 py-1 text-[10px] text-white/75 ring-1 ring-white/10"
                    >
                      {country}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative mt-6">
                <p className="text-[30px] leading-none font-semibold tracking-[-0.045em]">10</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-white/55">
                  destinations in the sample dataset, each with its own industry and role mix.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
