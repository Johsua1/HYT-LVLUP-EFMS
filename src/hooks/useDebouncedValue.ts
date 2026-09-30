import { useEffect, useState } from 'react';

/**
 * Delays propagating a rapidly changing value (search boxes, range sliders).
 * The returned value always settles on the latest input, so no keystroke is
 * lost — only the intermediate renders are skipped.
 */
export function useDebouncedValue<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
