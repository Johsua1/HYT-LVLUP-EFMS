import { Link } from 'react-router-dom';
import { ArrowRight, LogIn } from 'lucide-react';
import { Reveal, scrollToSection } from './primitives';

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="px-5 pb-20 sm:px-8 sm:pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-[#050b18] px-6 py-16 text-center text-white sm:px-10 sm:py-20">
        <div className="lp-panel-grid" aria-hidden />
        <div
          className="pointer-events-none absolute -top-28 left-1/2 h-72 w-[520px] -translate-x-1/2 rounded-full bg-[#2f7bf0]/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-10 -bottom-28 h-64 w-64 rounded-full bg-[#0a7f4a]/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden
        />

        <div className="relative">
          <Reveal>
            <span className="lp-eyebrow justify-center text-[#7fb2ff]">
              <span className="h-px w-6 bg-[#7fb2ff]/50" aria-hidden />
              Start here
            </span>
          </Reveal>
          <Reveal delay={70}>
            <h2
              id="final-cta-title"
              className="mx-auto mt-4 max-w-3xl text-[clamp(1.9rem,4.2vw,3.15rem)] leading-[1.08] font-semibold tracking-[-0.04em]"
            >
              Make employer evaluation{' '}
              <span className="lp-display text-[1.06em] text-[#7fe3b0] italic">more organized</span> and efficient.
            </h2>
          </Reveal>
          <Reveal delay={130}>
            <p className="mx-auto mt-4 max-w-xl text-[13.5px] leading-relaxed text-white/55">
              Explore a smarter way to discover, filter, and evaluate international employers through one centralized
              platform.
            </p>
          </Reveal>
          <Reveal delay={190}>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => scrollToSection('explore')}
                className="lp-cta-primary inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-[13px] font-semibold text-[#0a1322] transition-colors hover:bg-[#e9eff8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-5 text-[13px] font-medium text-white backdrop-blur transition-colors hover:border-white/25 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                Login to system
              </Link>
            </div>
          </Reveal>
          <Reveal delay={250}>
            <p className="mt-6 text-[10px] text-white/40">
              Invitation-only access · Illustrative sample data shown throughout this page.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
