import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LogIn, Menu, X } from 'lucide-react';
import logo from '@/images/LEVELUPLOGO.png';
import { cn } from '@/lib/utils';
import { scrollToSection } from './primitives';

const NAV_LINKS = [
  { id: 'platform', label: 'Platform' },
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'countries', label: 'Countries' },
  { id: 'explore', label: 'Filtering preview' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);

      /* Lightweight scroll-spy: the active item is the last section whose
         top edge has passed the header. */
      let current: string | null = null;
      for (const link of NAV_LINKS) {
        const node = document.getElementById(link.id);
        if (!node) continue;
        if (node.getBoundingClientRect().top <= 140) current = link.id;
      }
      /* Past the last tracked section (why / CTA / footer) nothing is active. */
      if (window.scrollY + window.innerHeight > document.documentElement.scrollHeight - 320) current = null;
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const solid = scrolled || open;

  const go = (id: string) => {
    setOpen(false);
    scrollToSection(id);
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300',
        solid
          ? 'lp-nav-scrolled border-lp-line bg-[#f5f7fa]/92 shadow-[0_18px_40px_-34px_rgba(8,11,16,0.65)] backdrop-blur-xl'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0b65d8]"
          aria-label="Level Up International Manpower Services Corp. — back to top"
        >
          <img
            src={logo}
            alt="Level Up International Manpower Services Corp."
            className={cn(
              'h-10 w-auto transition-transform duration-300 group-hover:-translate-y-0.5 sm:h-11',
              !solid && 'lp-logo-on-dark',
            )}
          />
          <span
            className={cn(
              'max-w-[150px] text-[9.5px] leading-[1.32] font-semibold tracking-[0.005em] text-balance transition-colors md:max-w-none md:text-[10.5px]',
              solid ? 'text-lp-ink' : 'text-white/90',
            )}
          >
            Employer Filtering Management System
          </span>
        </Link>

        <nav aria-label="Landing page" className="hidden items-center gap-6 xl:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => go(link.id)}
              data-active={active === link.id}
              aria-current={active === link.id ? 'true' : undefined}
              className="lp-nav-link text-[13px] font-medium whitespace-nowrap"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className={cn(
              'hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors sm:inline-flex',
              solid
                ? 'text-lp-muted hover:bg-[#eef2f8] hover:text-lp-ink'
                : 'text-white/75 hover:bg-white/10 hover:text-white',
            )}
          >
            <LogIn className="h-3.5 w-3.5" aria-hidden />
            Sign in
          </Link>

          <button
            type="button"
            onClick={() => go('explore')}
            className="lp-cta-primary hidden items-center gap-1.5 rounded-lg bg-[#0b65d8] px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap text-white shadow-[0_10px_24px_-14px_rgba(11,101,216,0.9)] transition-colors hover:bg-[#044aa9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b65d8] sm:inline-flex"
          >
            Explore employers
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors xl:hidden',
              solid ? 'text-lp-ink hover:bg-[#eef2f8]' : 'text-white hover:bg-white/10',
            )}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="landing-mobile-menu"
          className="lp-menu border-lp-line bg-lp-surface absolute inset-x-3 top-[calc(100%+8px)] rounded-xl border p-3 shadow-[0_30px_70px_-30px_rgba(8,11,16,0.45)] xl:hidden"
        >
          <nav aria-label="Landing page (mobile)" className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => go(link.id)}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  active === link.id
                    ? 'bg-[#eef5fe] text-[#044aa9]'
                    : 'text-lp-ink hover:bg-lp-paper',
                )}
              >
                {link.label}
                <ArrowRight
                  className={cn('h-3.5 w-3.5', active === link.id ? 'text-[#044aa9]' : 'text-lp-muted')}
                  aria-hidden
                />
              </button>
            ))}
          </nav>
          <div className="border-lp-line mt-2 flex flex-col gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => go('explore')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0b65d8] text-sm font-semibold text-white transition-colors hover:bg-[#044aa9]"
            >
              Explore employers
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <Link
              to="/login"
              className="border-lp-line text-lp-ink hover:bg-lp-paper inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in to the system
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
