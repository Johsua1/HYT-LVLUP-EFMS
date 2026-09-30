import { CURRENCIES } from './constants';

/* ------------------------------------------------------------------ */
/* Class names                                                         */
/* ------------------------------------------------------------------ */

type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Tiny `clsx` — keeps the dependency list short. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  const walk = (value: ClassValue) => {
    if (!value) return;
    if (Array.isArray(value)) value.forEach(walk);
    else out.push(String(value));
  };
  values.forEach(walk);
  return out.join(' ');
}

/* ------------------------------------------------------------------ */
/* Numbers & currency                                                  */
/* ------------------------------------------------------------------ */

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatCurrency(
  value: number,
  currency = 'PHP',
  options: { compact?: boolean; showCode?: boolean } = {},
): string {
  const meta = CURRENCIES[currency];
  const symbol = meta?.symbol ?? '';
  const rounded = Math.round(value);
  const body = options.compact
    ? compactNumber(rounded)
    : formatNumber(rounded);
  return `${symbol}${body}${options.showCode ? ` ${currency}` : ''}`;
}

export function compactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`;
  return formatNumber(value);
}

export function formatSalaryRange(
  min: number,
  max: number,
  currency: string,
  options: { compact?: boolean } = {},
): string {
  if (min === max) return formatCurrency(min, currency, options);
  return `${formatCurrency(min, currency, options)} – ${formatCurrency(max, currency, options)}`;
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatFileSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${Math.round(kb)} KB`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function sum(values: number[]): number {
  return values.reduce((total, v) => total + v, 0);
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/**
 * All mock data is authored relative to a frozen "today" so that the
 * prototype renders identical, reviewable states on any machine.
 * Swap `TODAY` for `new Date()` when wiring a real backend.
 */
export const TODAY = new Date('2026-09-30T09:00:00Z');

export function daysFromToday(iso: string): number {
  const target = new Date(iso);
  const diff = target.getTime() - TODAY.getTime();
  return Math.ceil(diff / 86_400_000);
}

/** ISO date string offset from the frozen today — used by the mock dataset. */
export function isoOffset(days: number, hours = 0): string {
  const d = new Date(TODAY.getTime() + days * 86_400_000 + hours * 3_600_000);
  return d.toISOString();
}

export function dateOnly(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function relativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - TODAY.getTime();
  const abs = Math.abs(diffMs);
  const future = diffMs > 0;

  const units: [number, string][] = [
    [60_000, 'minute'],
    [3_600_000, 'hour'],
    [86_400_000, 'day'],
    [604_800_000, 'week'],
    [2_592_000_000, 'month'],
    [31_536_000_000, 'year'],
  ];

  if (abs < 60_000) return 'just now';

  let value = 1;
  let unit = 'minute';
  for (let i = 0; i < units.length; i += 1) {
    const [ms, name] = units[i];
    if (abs >= ms) {
      value = Math.floor(abs / ms);
      unit = name;
      const next = units[i + 1];
      if (next && abs >= next[0]) continue;
      break;
    }
  }
  const plural = value === 1 ? '' : 's';
  return future ? `in ${value} ${unit}${plural}` : `${value} ${unit}${plural} ago`;
}

export function formatExpiryCountdown(days: number | null): string {
  if (days === null) return 'No contract';
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return 'Expires today';
  return `Expires in ${days} day${days === 1 ? '' : 's'}`;
}

export function formatDuration(months: number): string {
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  return `${months} months`;
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function groupCount<T>(items: T[], keyFn: (item: T) => string): { name: string; value: number }[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function sortByKey<T>(items: T[], keyFn: (item: T) => string | number, dir: 'asc' | 'desc' = 'asc'): T[] {
  return [...items].sort((a, b) => {
    const ka = keyFn(a);
    const kb = keyFn(b);
    if (ka === kb) return 0;
    const result = ka > kb ? 1 : -1;
    return dir === 'asc' ? result : -result;
  });
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Deterministic PRNG so generated mock data is stable across reloads. */
export function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function pick<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

export function pickMany<T>(items: readonly T[], count: number, rng: () => number): T[] {
  const pool = [...items];
  const out: T[] = [];
  for (let i = 0; i < count && pool.length; i += 1) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, delay = 250) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Triggers a real file download — used by the export/print UI affordances. */
export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function toCsv(rows: Record<string, string | number>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n');
}
