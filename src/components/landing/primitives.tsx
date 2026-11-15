import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Viewport helpers                                                    */
/* ------------------------------------------------------------------ */

export function useInView<T extends Element>(
  options: { threshold?: number; rootMargin?: string; once?: boolean } = {},
) {
  const { threshold = 0.18, rootMargin = '0px 0px -8% 0px', once = true } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollToSection(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
}

/* ------------------------------------------------------------------ */
/* Scroll reveal                                                       */
/* ------------------------------------------------------------------ */

type RevealStyle = CSSProperties & {
  '--lp-reveal-delay'?: string;
  '--lp-reveal-y'?: string;
};

export function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.12 });
  return (
    <div
      ref={ref}
      className={cn('lp-reveal', inView && 'is-in', className)}
      style={{ '--lp-reveal-delay': `${delay}ms`, '--lp-reveal-y': `${y}px` } as RevealStyle}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Animated counter                                                    */
/* ------------------------------------------------------------------ */

export function Counter({
  value,
  suffix = '',
  duration = 1500,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>({
    threshold: 0.1,
    rootMargin: '0px 0px 12% 0px',
  });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                 */
/* ------------------------------------------------------------------ */

export function SampleTag({ tone = 'light', className }: { tone?: 'light' | 'dark'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
        tone === 'light'
          ? 'bg-[#eef2f8] text-[#5a6b82] ring-1 ring-[#e2e8f1]'
          : 'bg-white/8 text-white/60 ring-1 ring-white/12',
        className,
      )}
    >
      <span
        className={cn('h-1 w-1 rounded-full', tone === 'light' ? 'bg-[#94a3b8]' : 'bg-white/40')}
        aria-hidden
      />
      Sample
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = 'light',
  align = 'left',
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: 'light' | 'dark';
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col',
        align === 'center' ? 'items-center text-center' : 'items-start',
        className,
      )}
    >
      <Reveal>
        <span
          className={cn(
            'lp-eyebrow',
            tone === 'light' ? 'text-[#044aa9]' : 'text-[#7fb2ff]',
          )}
        >
          <span
            className={cn('h-px w-6', tone === 'light' ? 'bg-[#044aa9]/40' : 'bg-[#7fb2ff]/50')}
            aria-hidden
          />
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={70}>
        <h2
          className={cn(
            'mt-4 max-w-3xl text-[clamp(1.85rem,4vw,3rem)] leading-[1.08] font-semibold tracking-[-0.03em]',
            tone === 'light' ? 'text-[#0a1322]' : 'text-white',
          )}
        >
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal delay={130}>
          <p
            className={cn(
              'mt-4 max-w-2xl text-[15px] leading-relaxed',
              tone === 'light' ? 'text-[#586a82]' : 'text-white/62',
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Country flags — inline SVG so they render identically on Windows,   */
/* where the emoji flag glyphs fall back to two-letter codes.          */
/* ------------------------------------------------------------------ */

const FLAG_NAMES: Record<string, string> = {
  JP: 'Japan',
  KR: 'South Korea',
  SG: 'Singapore',
  AE: 'United Arab Emirates',
  AU: 'Australia',
  CA: 'Canada',
  DE: 'Germany',
  QA: 'Qatar',
  NZ: 'New Zealand',
  SE: 'Sweden',
};

function UnionJack() {
  return (
    <g>
      <rect width="12" height="8" fill="#012169" />
      <path d="M0 0 L12 8 M12 0 L0 8" stroke="#fff" strokeWidth="1.7" />
      <path d="M0 0 L12 8 M12 0 L0 8" stroke="#C8102E" strokeWidth="0.8" />
      <path d="M6 0 V8 M0 4 H12" stroke="#fff" strokeWidth="2.6" />
      <path d="M6 0 V8 M0 4 H12" stroke="#C8102E" strokeWidth="1.4" />
    </g>
  );
}

function FlagArt({ code }: { code: string }) {
  switch (code) {
    case 'JP':
      return (
        <>
          <rect width="24" height="16" fill="#fff" />
          <circle cx="12" cy="8" r="4.4" fill="#BC002D" />
        </>
      );
    case 'KR':
      return (
        <>
          <rect width="24" height="16" fill="#fff" />
          <circle cx="12" cy="8" r="3.6" fill="#CD2E3A" />
          <path
            d="M8.4 8a3.6 3.6 0 0 0 7.2 0 1.8 1.8 0 0 1-3.6 0 1.8 1.8 0 0 0-3.6 0Z"
            fill="#0047A0"
          />
          <g stroke="#111" strokeWidth="0.55">
            <path d="M4.2 4.4h2.1M4.2 5.2h2.1M4.2 6h2.1" />
            <path d="M17.7 10h2.1M17.7 10.8h2.1M17.7 11.6h2.1" />
            <path d="M17.7 4.4h2.1M17.7 5.2h2.1M17.7 6h2.1" />
            <path d="M4.2 10h2.1M4.2 10.8h2.1M4.2 11.6h2.1" />
          </g>
        </>
      );
    case 'SG':
      return (
        <>
          <rect width="24" height="8" fill="#EF3340" />
          <rect y="8" width="24" height="8" fill="#fff" />
          <circle cx="7" cy="8" r="3" fill="#fff" />
          <circle cx="8.4" cy="8" r="2.9" fill="#EF3340" />
          <g fill="#fff">
            <circle cx="11.1" cy="6.1" r="0.62" />
            <circle cx="13.1" cy="7.1" r="0.62" />
            <circle cx="12.5" cy="9.2" r="0.62" />
            <circle cx="10.4" cy="9.4" r="0.62" />
            <circle cx="9.7" cy="7.3" r="0.62" />
          </g>
        </>
      );
    case 'AE':
      return (
        <>
          <rect x="6" width="18" height="5.33" fill="#00843D" />
          <rect x="6" y="5.33" width="18" height="5.34" fill="#fff" />
          <rect x="6" y="10.67" width="18" height="5.33" fill="#111" />
          <rect width="6" height="16" fill="#EF3340" />
        </>
      );
    case 'AU':
      return (
        <>
          <rect width="24" height="16" fill="#00247D" />
          <UnionJack />
          <g fill="#fff">
            <circle cx="17.4" cy="4" r="0.8" />
            <circle cx="20.3" cy="7.4" r="0.8" />
            <circle cx="16.6" cy="11.6" r="0.8" />
            <circle cx="21.4" cy="12.4" r="0.8" />
            <circle cx="19" cy="9.6" r="0.55" />
            <circle cx="6.4" cy="13.4" r="0.7" />
          </g>
        </>
      );
    case 'CA':
      return (
        <>
          <rect width="24" height="16" fill="#fff" />
          <rect width="6" height="16" fill="#D80621" />
          <rect x="18" width="6" height="16" fill="#D80621" />
          <path
            d="M12 3.1l.85 1.9 1.35-1-.5 2.15 2-.3-1.3 1.55 1.75.8-1.9.8.35 1.4-2-.55.05 2.25-1.15-1.1-.8 1.3-.8-1.3-1.15 1.1.05-2.25-2 .55.35-1.4-1.9-.8 1.75-.8-1.3-1.55 2 .3-.5-2.15 1.35 1z"
            fill="#D80621"
          />
        </>
      );
    case 'DE':
      return (
        <>
          <rect width="24" height="5.33" fill="#111" />
          <rect y="5.33" width="24" height="5.34" fill="#DD0000" />
          <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
        </>
      );
    case 'QA':
      return (
        <>
          <rect width="24" height="16" fill="#fff" />
          <path
            d="M7 0h17v16H7l1.6-1.6L7 12.8l1.6-1.6L7 9.6l1.6-1.6L7 6.4l1.6-1.6L7 3.2 8.6 1.6 7 0Z"
            fill="#8A1538"
          />
        </>
      );
    case 'NZ':
      return (
        <>
          <rect width="24" height="16" fill="#00247D" />
          <UnionJack />
          <g fill="#C8102E" stroke="#fff" strokeWidth="0.35">
            <circle cx="17.4" cy="5.2" r="0.85" />
            <circle cx="20.4" cy="8.6" r="0.85" />
            <circle cx="16.6" cy="12" r="0.85" />
            <circle cx="21.2" cy="13.2" r="0.85" />
          </g>
        </>
      );
    case 'SE':
      return (
        <>
          <rect width="24" height="16" fill="#006AA7" />
          <rect x="7" width="3" height="16" fill="#FECC02" />
          <rect y="6.5" width="24" height="3" fill="#FECC02" />
        </>
      );
    default:
      return <rect width="24" height="16" fill="#cbd5e1" />;
  }
}

export function Flag({
  code,
  className,
  label,
}: {
  code: string;
  className?: string;
  label?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 overflow-hidden rounded-[4px] ring-1 ring-[#0a1322]/10',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 16"
        className="block h-full w-full"
        role={label === false ? 'presentation' : 'img'}
        aria-label={label === false ? undefined : FLAG_NAMES[code] ?? code}
        aria-hidden={label === false ? true : undefined}
      >
        <FlagArt code={code} />
      </svg>
    </span>
  );
}
