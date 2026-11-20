import { Counter, SampleTag } from './primitives';
import { LANDING_STATS } from './landingData';
import { cn } from '@/lib/utils';

export function StatsBand() {
  return (
    <section aria-labelledby="landing-stats-title" className="relative z-20 mx-auto -mt-14 w-full max-w-6xl px-5 sm:px-8">
      <div className="border-lp-line relative overflow-hidden rounded-2xl border bg-white p-6 shadow-[0_30px_70px_-45px_rgba(8,11,16,0.55)] sm:p-8">
        <div className="lp-brand-rule absolute inset-x-0 top-0 rounded-none" aria-hidden />

        <div className="border-lp-line flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="landing-stats-title"
            className="text-lp-muted text-[10.5px] font-semibold tracking-[0.18em] uppercase"
          >
            Platform at a glance
          </h2>
          <p className="text-lp-muted flex flex-wrap items-center gap-2 text-[11px]">
            <SampleTag />
            Illustrative demo dataset — not live employer records.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 pt-6 sm:grid-cols-4 sm:gap-x-0 sm:gap-y-0">
          {LANDING_STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={cn('sm:px-6', index === 0 && 'sm:pl-0', index > 0 && 'sm:border-l sm:border-[#e5eaf0]')}
            >
              <dd className="text-lp-ink font-display text-[clamp(1.9rem,3.4vw,2.6rem)] leading-none font-bold tracking-[-0.045em]">
                <Counter value={stat.value} suffix={stat.suffix} />
              </dd>
              <dt className="text-lp-ink mt-2 text-[12.5px] font-semibold">{stat.label}</dt>
              <p className="text-lp-muted mt-1 text-[10.5px] leading-relaxed">{stat.detail}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
