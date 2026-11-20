import { useRef, type CSSProperties, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Globe2,
  LogIn,
  ReceiptText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Flag, SampleTag, scrollToSection } from './primitives';
import { SAMPLE_EMPLOYERS, durationLabel, salaryRange, type SampleEmployer } from './landingData';

type Vars = CSSProperties & {
  '--lp-depth'?: string;
  '--lp-d'?: string;
  '--lp-float-duration'?: string;
  '--lp-float-delay'?: string;
};

const HERO_ROWS = SAMPLE_EMPLOYERS.slice(0, 4);

const SALARY_ROWS = [
  { code: 'JP', label: 'Japan', value: 84, width: 45 },
  { code: 'KR', label: 'South Korea', value: 130, width: 70 },
  { code: 'AU', label: 'Australia', value: 185, width: 100 },
];

/** Wireframe globe — the international motif behind the product panel. */
function GlobeMark() {
  return (
    <svg viewBox="0 0 480 480" className="lp-globe hidden lg:block" aria-hidden>
      <defs>
        <linearGradient id="lp-globe-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b65d8" />
          <stop offset="55%" stopColor="#4e90e8" />
          <stop offset="100%" stopColor="#33d68c" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#lp-globe-line)" strokeWidth="1.1">
        <circle cx="240" cy="240" r="196" />
        <ellipse cx="240" cy="240" rx="196" ry="72" />
        <ellipse cx="240" cy="240" rx="196" ry="134" />
        <ellipse cx="240" cy="240" rx="72" ry="196" />
        <ellipse cx="240" cy="240" rx="134" ry="196" />
        <line x1="44" y1="240" x2="436" y2="240" />
      </g>
      <g fill="#33d68c">
        <circle cx="148" cy="182" r="3.4" />
        <circle cx="292" cy="140" r="2.8" />
        <circle cx="334" cy="268" r="3.2" />
        <circle cx="204" cy="330" r="2.6" />
      </g>
      <g fill="#4e90e8">
        <circle cx="120" cy="268" r="2.6" />
        <circle cx="262" cy="212" r="3.4" />
        <circle cx="360" cy="196" r="2.4" />
      </g>
      <g stroke="url(#lp-globe-line)" strokeWidth="1" fill="none" strokeDasharray="3 5" opacity="0.7">
        <path d="M148 182 Q232 150 292 140" />
        <path d="M262 212 Q312 236 334 268" />
        <path d="M120 268 Q168 306 204 330" />
      </g>
    </svg>
  );
}

function DiscoveryRow({ employer }: { employer: SampleEmployer }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5">
      <Flag code={employer.code} className="h-7 w-10" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-[11.5px] font-semibold whitespace-nowrap text-[#17212f]">{employer.country}</p>
          {employer.verification === 'Verified' ? (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#0a7f4a]" aria-label="Verified sample record" />
          ) : (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" aria-label="Under review" />
          )}
        </div>
        <p className="truncate text-[10px] text-[#64748b]">
          {employer.industry} · {employer.position}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] font-semibold text-[#17212f] tabular-nums">
          {salaryRange(employer.salaryMin, employer.salaryMax)}
        </p>
        <p className="text-[9.5px] text-[#64748b]">
          {durationLabel(employer.durationMonths)} · {employer.accommodation === 'Provided' ? 'Housing' : 'No housing'}
        </p>
      </div>
    </div>
  );
}

function VerificationCard() {
  return (
    <div className="lp-glass-light w-[196px] rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[9.5px] font-semibold tracking-[0.12em] text-[#64748b] uppercase">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0a7f4a]" aria-hidden />
          Verification
        </span>
        <SampleTag />
      </div>
      <p className="mt-2 text-[12px] font-semibold text-[#17212f]">Documents complete</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e6edf6]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0a7f4a] to-[#33d68c]"
          style={{ width: '90%' }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[9.5px] text-[#64748b]">
        <span>9 of 10 requirements</span>
        <span className="font-semibold text-[#0a7f4a]">90%</span>
      </div>
    </div>
  );
}

function SalaryCard() {
  return (
    <div className="lp-glass w-[224px] rounded-xl p-3.5 text-white">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9.5px] font-semibold tracking-[0.14em] text-white/55 uppercase">
          Salary comparison
        </span>
        <span className="text-[9px] text-white/45">PHP / mo</span>
      </div>
      <div className="mt-3 space-y-2.5">
        {SALARY_ROWS.map((row) => (
          <div key={row.code}>
            <div className="flex items-center justify-between text-[9.5px]">
              <span className="text-white/65">{row.label}</span>
              <span className="font-semibold text-white/85 tabular-nums">₱{row.value}k</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0b65d8] to-[#33d68c]"
                style={{ width: `${row.width}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const visualRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const node = visualRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    node.style.setProperty('--lp-px', x.toFixed(3));
    node.style.setProperty('--lp-py', y.toFixed(3));
  };

  const resetPointer = () => {
    const node = visualRef.current;
    if (!node) return;
    node.style.setProperty('--lp-px', '0');
    node.style.setProperty('--lp-py', '0');
  };

  return (
    <section className="lp-hero relative overflow-hidden pt-32 pb-24 sm:pb-28 lg:pt-36 lg:pb-32">
      <div className="lp-hero-grid" aria-hidden />
      <div className="lp-hero-glow lp-hero-glow--blue" aria-hidden />
      <div className="lp-hero-glow lp-hero-glow--mint" aria-hidden />
      <div className="lp-hero-ring lp-hero-ring--one" aria-hidden />
      <div className="lp-hero-ring lp-hero-ring--two" aria-hidden />
      <div className="lp-hero-arc" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.02fr_1fr] lg:gap-12 xl:gap-16">
        {/* Copy -------------------------------------------------------- */}
        <div className="max-w-xl">
          <div className="lp-rise" style={{ '--lp-d': '0ms' } as Vars}>
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-medium text-white/75 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#33d68c] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#33d68c]" />
              </span>
              Employer Filtering Management System
              <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
              <span className="hidden text-[#7fe3b0] sm:inline">Level Up International</span>
            </span>
          </div>

          <h1
            className="lp-rise mt-6 text-[clamp(2.35rem,4.3vw,3.5rem)] leading-[1.04] font-bold tracking-[-0.045em] text-white"
            style={{ '--lp-d': '80ms' } as Vars}
          >
            Find the{' '}
            <span className="lp-display bg-gradient-to-r from-[#5fe0a4] via-[#33d68c] to-[#1fae6f] bg-clip-text text-transparent">
              right employers.
            </span>
            <span className="mt-2.5 block text-[0.8em] leading-[1.14] font-semibold tracking-[-0.035em] text-white/90">
              Make smarter employment decisions.
            </span>
          </h1>

          <p
            className="lp-rise mt-6 max-w-xl text-[15px] leading-[1.75] text-white/62 sm:text-[15.5px]"
            style={{ '--lp-d': '170ms' } as Vars}
          >
            Discover, filter and compare international employers in one centralized platform. Evaluate job
            opportunities, salaries, processing fees, contracts, benefits and requirements to make informed decisions
            with confidence.
          </p>

          <div
            className="lp-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ '--lp-d': '250ms' } as Vars}
          >
            <button
              type="button"
              onClick={() => scrollToSection('explore')}
              className="lp-cta-primary group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0b65d8] px-5 text-[13.5px] font-semibold text-white shadow-[0_16px_36px_-16px_rgba(11,101,216,0.95)] transition-colors hover:bg-[#0756b8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fb2ff]"
            >
              Explore employers
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </button>
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/16 bg-white/[0.05] px-5 text-[13.5px] font-medium text-white backdrop-blur transition-colors hover:border-[#33d68c]/45 hover:bg-white/[0.09] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <LogIn className="h-4 w-4 text-[#7fe3b0]" aria-hidden />
              Access dashboard
            </Link>
          </div>

          <ul
            className="lp-rise mt-8 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[11px] text-white/55"
            style={{ '--lp-d': '330ms' } as Vars}
          >
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#7fe3b0]" aria-hidden />
              Invitation-only access
            </li>
            <li className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#7fb2ff]" aria-hidden />
              Illustrative sample data
            </li>
            <li className="flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-[#7fb2ff]" aria-hidden />
              10 destinations represented
            </li>
          </ul>
        </div>

        {/* Product composition ---------------------------------------- */}
        <div
          ref={visualRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={resetPointer}
          className="relative mx-auto w-full max-w-[560px] lg:max-w-none"
        >
          <GlobeMark />
          <div
            className="absolute -inset-10 -z-10 rounded-full bg-[#0b65d8]/12 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute inset-x-7 top-7 bottom-0 rotate-[2.4deg] rounded-2xl border border-white/10 bg-white/[0.05]"
            aria-hidden
          />

          <div className="lp-panel lp-panel-in relative z-10 overflow-hidden rounded-2xl p-4 text-[#17212f] sm:p-5">
            <div
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#044aa9] via-[#0b65d8] to-[#0a7f4a]"
              aria-hidden
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9.5px] font-semibold tracking-[0.18em] text-[#044aa9] uppercase">
                  Employer discovery
                </p>
                <p className="mt-1 text-[15px] font-bold tracking-[-0.015em]">Compare before you commit</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#f1f5f9] px-2 py-1 text-[10px] font-medium text-[#64748b]">
                <SlidersHorizontal className="h-3 w-3" aria-hidden />
                Filters
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#e5eaf0] bg-[#f8fafd] px-2.5 py-2">
              <Search className="h-3.5 w-3.5 text-[#64748b]" aria-hidden />
              <span className="text-[11.5px] text-[#64748b]">Search employers, positions, countries</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {['All employers', 'Manufacturing', 'Healthcare', 'Hospitality', 'Verified'].map((chip, index) => (
                <span
                  key={chip}
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium',
                    index === 0
                      ? 'bg-[#044aa9] text-white'
                      : 'bg-[#f1f5f9] text-[#64748b] ring-1 ring-[#e5eaf0]',
                  )}
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-2 divide-y divide-[#eef2f8]">
              {HERO_ROWS.map((employer) => (
                <DiscoveryRow key={employer.id} employer={employer} />
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-[#f8fafd] px-2.5 py-2">
              <span className="text-[9.5px] text-[#64748b]">Showing 4 of 10 sample employers</span>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-[#044aa9]">
                View all
                <ArrowRight className="h-3 w-3" aria-hidden />
              </span>
            </div>
          </div>

          {/* Floating layer */}
          <div
            className="lp-parallax lp-fade absolute -bottom-24 right-0 z-20 hidden lg:block"
            style={{ '--lp-depth': '16px', '--lp-d': '900ms' } as Vars}
          >
            <div className="lp-float" style={{ '--lp-float-duration': '8.5s' } as Vars}>
              <VerificationCard />
            </div>
          </div>

          <div
            className="lp-parallax lp-fade absolute -top-12 left-2 z-20 hidden lg:block"
            style={{ '--lp-depth': '22px', '--lp-d': '1050ms' } as Vars}
          >
            <div className="lp-float" style={{ '--lp-float-duration': '9.5s', '--lp-float-delay': '-2s' } as Vars}>
              <div className="lp-glass-light flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5">
                <div className="flex -space-x-1.5">
                  {['JP', 'KR', 'AE', 'AU'].map((code) => (
                    <span key={code} className="rounded-[5px] ring-2 ring-white">
                      <Flag code={code} className="h-5 w-7" />
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-semibold text-[#17212f]">10 countries</span>
                <span className="text-[9px] text-[#64748b]">in the dataset</span>
              </div>
            </div>
          </div>

          <div
            className="lp-parallax lp-fade absolute -bottom-36 -left-9 z-20 hidden lg:block"
            style={{ '--lp-depth': '20px', '--lp-d': '1150ms' } as Vars}
          >
            <div className="lp-float" style={{ '--lp-float-duration': '7.5s', '--lp-float-delay': '-4s' } as Vars}>
              <SalaryCard />
            </div>
          </div>

          <div
            className="lp-parallax lp-fade absolute -top-12 right-4 z-20 hidden lg:block"
            style={{ '--lp-depth': '26px', '--lp-d': '1250ms' } as Vars}
          >
            <div className="lp-float" style={{ '--lp-float-duration': '8s', '--lp-float-delay': '-1s' } as Vars}>
              <div className="lp-glass-light flex items-center gap-2 rounded-lg px-2.5 py-2">
                <ReceiptText className="h-3.5 w-3.5 text-[#044aa9]" aria-hidden />
                <div>
                  <p className="text-[8.5px] text-[#64748b]">Est. processing fee</p>
                  <p className="text-[11px] font-semibold text-[#17212f] tabular-nums">₱18,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-14 hidden max-w-7xl px-8 lg:block">
        <div className="flex items-center gap-3 text-[10px] tracking-[0.18em] text-white/35 uppercase">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#33d68c]/70" aria-hidden />
          Illustrative sample records · not live employer listings
        </div>
      </div>
    </section>
  );
}
