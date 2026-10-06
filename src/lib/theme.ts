export type AccentKey = 'levelup' | 'indigo' | 'blue' | 'teal' | 'violet' | 'graphite';

export interface AccentTheme {
  key: AccentKey;
  label: string;
  description: string;
  scale: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, string>;
}

/**
 * Accent themes are applied by writing the scale onto `document.documentElement`
 * as CSS custom properties. Tailwind v4 compiles `bg-brand-600` to
 * `background-color: var(--color-brand-600)`, so the whole application
 * re-themes instantly without a rebuild or a second stylesheet.
 */
export const ACCENT_THEMES: AccentTheme[] = [
  {
    key: 'levelup',
    label: 'Level Up',
    description: 'The house blue, sampled from the Level Up wordmark',
    scale: {
      50: '#eef5fe',
      100: '#d9e8fd',
      200: '#b3d1f9',
      300: '#79acf1',
      400: '#3886f0',
      500: '#0a63dc',
      600: '#044aa9',
      700: '#053d89',
      800: '#07336f',
      900: '#072854',
      950: '#071a34',
    },
  },
  {
    key: 'indigo',
    label: 'Indigo',
    description: 'Corporate indigo-blue',
    scale: {
      50: '#eef4ff',
      100: '#dbe6fe',
      200: '#bfd3fe',
      300: '#93b4fd',
      400: '#6090fa',
      500: '#3b6bf5',
      600: '#234de3',
      700: '#1c3cc4',
      800: '#1d359e',
      900: '#1c317d',
      950: '#152051',
    },
  },
  {
    key: 'blue',
    label: 'Harbour Blue',
    description: 'Classic institutional blue',
    scale: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  },
  {
    key: 'teal',
    label: 'Teal',
    description: 'Calm, healthcare-adjacent green-blue',
    scale: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e',
    },
  },
  {
    key: 'violet',
    label: 'Violet',
    description: 'Distinctive, higher-contrast accent',
    scale: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },
  },
  {
    key: 'graphite',
    label: 'Graphite',
    description: 'Understated neutral for print-heavy use',
    scale: {
      50: '#f6f7f9',
      100: '#eceef2',
      200: '#d5dae2',
      300: '#b0b9c7',
      400: '#8593a8',
      500: '#66758d',
      600: '#515e74',
      700: '#424c5e',
      800: '#394150',
      900: '#333945',
      950: '#22262e',
    },
  },
];

export function applyAccentTheme(key: AccentKey, dark = false): void {
  const theme = ACCENT_THEMES.find((item) => item.key === key) ?? ACCENT_THEMES[0];
  const scale = dark ? darkScaleOf(theme.scale) : theme.scale;
  const root = document.documentElement;
  Object.entries(scale).forEach(([step, value]) => {
    root.style.setProperty(`--color-brand-${step}`, value);
  });
}

/**
 * Applies both appearance preferences to the document root: the `dark` class
 * that `index.css` keys its neutral ramp off, the native colour-scheme hint,
 * and the accent ramp rebuilt for the active canvas.
 */
export function applyTheme(theme: 'light' | 'dark', accent: AccentKey): void {
  const dark = theme === 'dark';
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  applyAccentTheme(accent, dark);
}

/* ------------------------------------------------------------------ */
/* Dark accent derivation                                              */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const channel = (value: number) =>
    Math.round(Math.min(255, Math.max(0, value)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** Linear blend in sRGB — accurate enough for a UI accent ramp. */
function mix(from: string, to: string, amount: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex([
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ]);
}

const DARK_SURFACE = '#0b1220';
const LIGHT_TEXT = '#ffffff';

/**
 * Rebuilds an accent ramp for a dark canvas.
 *
 * Steps 50–300 become deep tints so soft brand chips read as "tinted" rather
 * than as a light block, 400–700 brighten so accent text and focus rings stay
 * legible on a dark surface, and 800–950 darken again so pressed states keep
 * enough contrast behind white label text.
 */
function darkScaleOf(scale: AccentTheme['scale']): AccentTheme['scale'] {
  const anchor = scale[600];
  return {
    50: mix(anchor, DARK_SURFACE, 0.87),
    100: mix(anchor, DARK_SURFACE, 0.76),
    200: mix(anchor, DARK_SURFACE, 0.6),
    300: mix(anchor, DARK_SURFACE, 0.4),
    400: mix(anchor, LIGHT_TEXT, 0.16),
    500: mix(anchor, LIGHT_TEXT, 0.32),
    600: anchor,
    700: mix(anchor, LIGHT_TEXT, 0.5),
    800: mix(anchor, DARK_SURFACE, 0.3),
    900: mix(anchor, DARK_SURFACE, 0.52),
    950: mix(anchor, DARK_SURFACE, 0.74),
  };
}
