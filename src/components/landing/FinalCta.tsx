import { Link } from 'react-router-dom';
import { ArrowRight, LogIn } from 'lucide-react';
import logo from '@/images/LEVELUPLOGO.png';
import { Reveal, scrollToSection } from './primitives';

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="px-5 pb-20 sm:px-8 sm:pb-24">
      <div className="lp-dark-tile relative mx-auto max-w-6xl overflow-hidden rounded-[28px] px-6 py-16 text-center text-white sm:px-10 sm:py-20">
        <div className="lp-panel-grid" aria-hidden />
        <div
          className="pointer-events-none absolute -top-28 left-1/2 h-72 w-[520px] -translate-x-1/2 rounded-full bg-[#0b65d8]/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-10 -bottom-28 h-64 w-64 rounded-full bg-[#0a7f4a]/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          aria-hidden
        />

        <div className="relative">
          <Reveal>
            <img
              src={logo}
              alt="Level Up International Manpower Services Corp."
              className="lp-logo-on-dark mx-auto block h-14 w-auto"
            />
          </Reveal>
          <Reveal delay={40}>
            <span className="lp-eyebrow mt-6 justify-center text-[#9cc6ff]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#33d68c]" aria-hidden />
              Start here
            </span>
          </Reveal>
          <Reveal delay={70}>
            <h2
              id="final-cta-title"
              className="mx-auto mt-4 max-w-3xl text-[clamp(1.9rem,4.2vw,3.15rem)] leading-[1.08] font-bold tracking-[-0.04em]"
            >
              Make employer evaluation{' '}
              <span className="bg-gradient-to-r from-[#8ff0bf] to-[#33d68c] bg-clip-text text-transparent">
                more organized
              </span>{' '}
              and efficient.
            </h2>
          </Reveal>
          <Reveal delay={130}>
            <p className="mx-auto mt-4 max-w-xl text-[13.5px] leading-relaxed text-white/60">
              Explore a smarter way to discover, filter, and evaluate international employers through one centralized
              platform.
            </p>
          </Reveal>
          <Reveal delay={190}>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => scrollToSection('explore')}
                className="lp-cta-primary inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0b65d8] px-5 text-[13px] font-semibold text-white shadow-[0_14px_30px_-16px_rgba(11,101,216,0.95)] transition-colors hover:bg-[#0756b8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fb2ff]"
              >
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/16 bg-white/[0.05] px-5 text-[13px] font-medium text-white backdrop-blur transition-colors hover:border-[#33d68c]/45 hover:bg-white/[0.09] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <LogIn className="h-4 w-4 text-[#7fe3b0]" aria-hidden />
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
