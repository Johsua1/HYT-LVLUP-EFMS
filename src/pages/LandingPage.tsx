import { useEffect, useLayoutEffect } from 'react';
import '@/components/landing/landing.css';
import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { StatsBand } from '@/components/landing/StatsBand';
import { AboutSection } from '@/components/landing/AboutSection';
import { FeaturesBento } from '@/components/landing/FeaturesBento';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { CountriesSection } from '@/components/landing/CountriesSection';
import { FilterPreview } from '@/components/landing/FilterPreview';
import { WhySection } from '@/components/landing/WhySection';
import { FinalCta } from '@/components/landing/FinalCta';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { scrollToSection } from '@/components/landing/primitives';

/**
 * Public landing page.
 *
 * This is the only screen an unauthenticated visitor can reach besides the
 * sign-in screen. It is entirely static: every number and employer shown is
 * labelled illustrative sample data, and every call to action either scrolls
 * to a section on this page or routes to the real `/login` screen.
 */
export default function LandingPage() {
  /* The landing page is a fixed canvas. If the last signed-in account saved
     the dark theme, `applyTheme` left `dark` on <html>, and index.css would
     repaint every `bg-white` surface here. Clear it before paint and restore
     it on the way out so the app itself keeps the saved preference. */
  useLayoutEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    return () => {
      if (hadDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      }
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const previousTitle = document.title;
    document.title = 'Employer Filtering Management System — Level Up International';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="lp-page min-h-screen">
      <button
        type="button"
        onClick={() => {
          const main = document.getElementById('landing-main');
          if (!main) return;
          main.focus({ preventScroll: true });
          scrollToSection('landing-main');
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#17212f] focus:shadow-lg"
      >
        Skip to content
      </button>

      <LandingNav />

      <main id="landing-main" tabIndex={-1} className="outline-none">
        <Hero />
        <StatsBand />
        <AboutSection />
        <FeaturesBento />
        <HowItWorks />
        <CountriesSection />
        <FilterPreview />
        <WhySection />
        <FinalCta />
      </main>

      <LandingFooter />
    </div>
  );
}
