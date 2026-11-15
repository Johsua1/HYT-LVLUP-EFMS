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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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
          ? 'lp-nav-scrolled border-lp-line bg-[#f5f7fb]/92 shadow-[0_18px_40px_-34px_rgba(10,19,34,0.65)] backdrop-blur-xl'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7fb2ff]"
          aria-label="Employer Filtering Management System — back to top"
        >
          <img
            src={logo}
            alt="Level Up International Manpower Services Corp."
            className={cn(
              'h-7 w-auto transition-[transform,filter] duration-300 group-hover:-translate-y-0.5',
              !solid && 'brightness-[1.8]',
            )}
          />
          <span className="hidden sm:block">
            <span
              className={cn(
                'block text-[11px] leading-none font-bold tracking-[0.16em] uppercase transition-colors',
                solid ? 'text-lp-ink' : 'text-white',
              )}
            >
              EFMS
            </span>
            <span
              className={cn(
                'mt-1 block text-[10px] leading-none transition-colors',
                solid ? 'text-lp-muted' : 'text-white/55',
              )}
            >
              Employer Filtering System
            </span>
          </span>
        </Link>

        <nav aria-label="Landing page" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => go(link.id)}
              className="lp-nav-link text-[13px] font-medium"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className={cn(
              'hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors sm:inline-flex',
              solid ? 'text-lp-muted hover:bg-[#eef2f8] hover:text-lp-ink' : 'text-white/75 hover:bg-white/10 hover:text-white',
            )}
          >
            <LogIn className="h-3.5 w-3.5" aria-hidden />
            Sign in
          </Link>

          <button
            type="button"
            onClick={() => go('explore')}
            className={cn(
              'lp-cta-primary hidden items-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors sm:inline-flex',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              solid
                ? 'bg-lp-brand text-white hover:bg-[#053d89] focus-visible:outline-[#044aa9]'
                : 'bg-white text-[#0a1322] hover:bg-[#e9eff8] focus-visible:outline-white',
            )}
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
              'inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors lg:hidden',
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
          className="lp-menu border-lp-line bg-lp-surface absolute inset-x-3 top-[calc(100%+8px)] rounded-xl border p-3 shadow-[0_30px_70px_-30px_rgba(10,19,34,0.45)] lg:hidden"
        >
          <nav aria-label="Landing page (mobile)" className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => go(link.id)}
                className="text-lp-ink hover:bg-lp-paper flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium"
              >
                {link.label}
                <ArrowRight className="text-lp-muted h-3.5 w-3.5" aria-hidden />
              </button>
            ))}
          </nav>
          <div className="border-lp-line mt-2 flex flex-col gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => go('explore')}
              className="bg-lp-brand hover:bg-lp-brand/90 inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white"
            >
              Explore employers
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <Link
              to="/login"
              className="border-lp-line text-lp-ink hover:bg-lp-paper inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium"
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
