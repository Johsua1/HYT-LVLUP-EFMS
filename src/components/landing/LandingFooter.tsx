import { Link } from 'react-router-dom';
import { ArrowUpRight, LogIn } from 'lucide-react';
import logo from '@/images/LEVELUPLOGO.png';
import { scrollToSection } from './primitives';

const PLATFORM_LINKS = [
  { label: 'Overview', id: 'platform' },
  { label: 'Features', id: 'features' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Countries', id: 'countries' },
  { label: 'Filtering preview', id: 'explore' },
];

const SYSTEM_LINKS = [
  'Employer directory',
  'Employer comparison',
  'Fees & costs',
  'Contracts',
  'Requirements',
  'Reports',
];

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#080b10] text-white">
      <div className="lp-brand-rule absolute inset-x-0 top-0 rounded-none" aria-hidden />
      <div
        className="pointer-events-none absolute -top-24 left-1/3 h-56 w-[520px] rounded-full bg-[#0b65d8]/12 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-[#0a7f4a]/12 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-5 pt-14 pb-8 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1.1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Level Up International Manpower Services Corp."
                className="lp-logo-on-dark h-10 w-auto"
              />
              <span className="text-[12px] leading-[1.25] font-semibold text-white">
                Employer Filtering Management System
              </span>
            </div>
            <p className="mt-3 max-w-sm text-[11.5px] leading-relaxed text-white/55">
              An organized platform for discovering, filtering, comparing, and evaluating international employers.
            </p>
            <p className="mt-4 text-[10.5px] text-white/40">Level Up International Manpower Services Corp.</p>
          </div>

          <nav aria-label="Platform">
            <p className="text-[9.5px] font-semibold tracking-[0.16em] text-white/45 uppercase">Platform</p>
            <ul className="mt-3 space-y-2">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(link.id)}
                    className="text-[11.5px] text-white/55 transition-colors hover:text-[#9cc6ff]"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="System modules">
            <p className="text-[9.5px] font-semibold tracking-[0.16em] text-white/45 uppercase">System</p>
            <ul className="mt-3 space-y-2">
              {SYSTEM_LINKS.map((label) => (
                <li key={label}>
                  <Link
                    to="/login"
                    className="group inline-flex items-center gap-1 text-[11.5px] text-white/55 transition-colors hover:text-white"
                  >
                    {label}
                    <ArrowUpRight
                      className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[9.5px] font-semibold tracking-[0.16em] text-white/45 uppercase">Access</p>
            <p className="mt-3 text-[11.5px] leading-relaxed text-white/55">
              Staff accounts are created by an administrator. Access is invitation-only and all sessions are logged.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0b65d8] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#0756b8]"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden />
              Sign in to the system
            </Link>
            <p className="mt-3 text-[10px] leading-relaxed text-white/35">
              No public registration. No employer contact details are published on this page.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[10.5px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Level Up International Manpower Services Corp. All rights reserved.</p>
          <p>Illustrative sample data · Not a public job listing service.</p>
        </div>
      </div>
    </footer>
  );
}
