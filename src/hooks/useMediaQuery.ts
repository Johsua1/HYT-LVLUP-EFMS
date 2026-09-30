import { useEffect, useState } from 'react';

function readMatch(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

/** Subscribes to a CSS media query so layout decisions can be made in JS. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => readMatch(query));

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);

    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Tailwind's `md` breakpoint — the point where tables replace mobile cards. */
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)');

/** Tailwind's `lg` breakpoint — the point where the sidebar is persistent. */
export const useIsWide = () => useMediaQuery('(min-width: 1024px)');
