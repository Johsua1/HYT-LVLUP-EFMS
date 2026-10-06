import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/** Category labels sit in a fixed-width gutter; narrow screens need a smaller
 *  gutter (with truncated labels) or the plot area collapses. */
const useWideChart = () => useMediaQuery('(min-width: 640px)');

/**
 * Thin wrappers around Recharts.
 *
 * Colours are expressed as CSS custom properties so charts follow the accent
 * theme and the dark-mode ramp without a second palette definition.
 */
/**
 * Series palette. The first four slots are the house colours — the logo's
 * royal blue and emerald, each in a deep and a light step — so the opening
 * slices of any donut or bar chart read as Level Up before the supporting
 * hues are reached.
 */
export const CHART_COLORS = [
  'var(--color-brand-600)',
  '#18b970',
  'var(--color-brand-400)',
  '#0a7f4a',
  '#0ea5e9',
  '#f59e0b',
  '#8b5cf6',
  '#f43f5e',
  '#14b8a6',
  '#64748b',
  '#a855f7',
  '#84cc16',
];

/**
 * Semantic colour per status name.
 *
 * Donut data arrives sorted by count, so positional colouring would repaint a
 * status every time the portfolio shifted. Keying on the name instead keeps
 * "Active" green and "Expired" red no matter how the slices reorder — and
 * keeps the palette anchored to the logo's blue and emerald.
 */
export const STATUS_COLORS: Record<string, string> = {
  /* Employer lifecycle */
  Active: '#0a7f4a',
  Pending: '#f59e0b',
  Inactive: '#94a3b8',
  Suspended: '#f43f5e',
  Archived: '#64748b',
  /* Contract lifecycle */
  Draft: '#94a3b8',
  'Under Review': '#0ea5e9',
  'Expiring Soon': '#f59e0b',
  Expired: '#f43f5e',
  Renewed: '#044aa9',
  /* Requirement completion */
  Complete: '#0a7f4a',
  Incomplete: '#f59e0b',
  'Missing Documents': '#f43f5e',
};

/** Resolves each category to its semantic colour, falling back to the series ramp. */
export function statusColorsFor(data: { name: string }[]): string[] {
  return data.map((entry, index) => STATUS_COLORS[entry.name] ?? CHART_COLORS[index % CHART_COLORS.length]);
}

const AXIS_TICK = { fill: 'var(--color-ink-500)', fontSize: 11 };
const GRID_STROKE = 'var(--color-ink-200)';

export interface CategoryDatum {
  name: string;
  value: number;
}

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  valueFormatter?: (value: number, name: string, row?: Record<string, unknown>) => string;
  labelFormatter?: (label: string | number) => string;
}

/** Shared tooltip so every chart in the app reads the same way. */
function ChartTooltip({ active, payload, label, valueFormatter, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="border-ink-200 shadow-raised max-w-64 rounded-lg border bg-white px-3 py-2">
      {label !== undefined && (
        <p className="text-ink-500 mb-1 text-[11px] font-semibold">
          {labelFormatter ? labelFormatter(label) : String(label)}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {payload.map((entry, index) => {
          const name = String(entry.name ?? '');
          const numeric = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0);
          return (
            <div key={`${name}-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color ?? CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-ink-600 text-[11px]">{name}</span>
              </span>
              <span className="text-ink-900 tnum text-[12px] font-semibold">
                {valueFormatter ? valueFormatter(numeric, name, entry.payload) : formatNumber(numeric)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Categorical bar chart                                              */
/* ------------------------------------------------------------------ */

export interface CategoryBarChartProps {
  data: CategoryDatum[];
  /** `horizontal` puts category labels on the y-axis — better for long names. */
  layout?: 'horizontal' | 'vertical';
  color?: string;
  valueFormatter?: (value: number, name: string, row?: Record<string, unknown>) => string;
  seriesName?: string;
  maxCategories?: number;
}

export function CategoryBarChart({
  data,
  layout = 'horizontal',
  color = CHART_COLORS[0],
  valueFormatter,
  seriesName = 'Employers',
  maxCategories,
}: CategoryBarChartProps) {
  const rows = maxCategories ? data.slice(0, maxCategories) : data;
  const horizontal = layout === 'horizontal';
  const wide = useWideChart();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={rows}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 16, bottom: 4, left: horizontal ? 4 : -12 }}
        barCategoryGap={horizontal ? '22%' : '28%'}
      >
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={wide ? 148 : 96}
              tickFormatter={(value: string) => (wide || value.length <= 16 ? value : `${value.slice(0, 15)}…`)}
            />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} height={48} angle={-18} textAnchor="end" />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
          </>
        )}
        <Tooltip
          cursor={{ fill: 'var(--color-ink-100)' }}
          content={<ChartTooltip valueFormatter={valueFormatter} />}
        />
        <Bar dataKey="value" name={seriesName} fill={color} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Donut chart                                                         */
/* ------------------------------------------------------------------ */

export interface DonutChartProps {
  data: CategoryDatum[];
  valueFormatter?: (value: number, name: string, row?: Record<string, unknown>) => string;
  centerLabel?: string;
  showLegend?: boolean;
  colors?: string[];
}

export function DonutChart({
  data,
  valueFormatter,
  centerLabel,
  showLegend = true,
  colors = CHART_COLORS,
}: DonutChartProps) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="52%"
          outerRadius="78%"
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={Math.min(64, Math.ceil(data.length / 2) * 20)}
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: 'var(--color-ink-600)', fontSize: 11 }}>{value}</span>}
          />
        )}
        {centerLabel !== undefined && (
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle">
            <tspan x="50%" dy="-0.2em" style={{ fontSize: 22, fontWeight: 600, fill: 'var(--color-ink-900)' }}>
              {total}
            </tspan>
            <tspan x="50%" dy="1.4em" style={{ fontSize: 10, fill: 'var(--color-ink-500)' }}>
              {centerLabel}
            </tspan>
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Salary / range chart                                                */
/* ------------------------------------------------------------------ */

export interface RangeDatum {
  name: string;
  min: number;
  max: number;
  average: number;
}

/**
 * Floating bars showing the salary band per country, with an average marker.
 * Recharts renders an array-valued dataKey as a floating bar.
 */
export function SalaryRangeChart({ data }: { data: RangeDatum[] }) {
  const rows = data.map((entry) => ({ ...entry, band: [entry.min, entry.max] }));
  const wide = useWideChart();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical horizontal={false} />
        <XAxis
          type="number"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => formatCurrency(value, 'PHP', { compact: true })}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={wide ? 132 : 88}
          tickFormatter={(value: string) => (wide || value.length <= 14 ? value : `${value.slice(0, 13)}…`)}
        />
        <Tooltip
          cursor={{ fill: 'var(--color-ink-100)' }}
          content={
            <ChartTooltip
              valueFormatter={(value, name) => {
                if (name === 'Monthly salary band') {
                  return `${formatCurrency(value, 'PHP')}`;
                }
                return formatCurrency(value, 'PHP');
              }}
            />
          }
        />
        <Bar dataKey="band" name="Monthly salary band" fill="var(--color-brand-400)" radius={4} maxBarSize={16} />
        <Bar dataKey="average" name="Average" fill="var(--color-brand-700)" radius={4} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Labelled list — a chart alternative when a bar chart adds nothing   */
/* ------------------------------------------------------------------ */

export function BarList({
  data,
  valueFormatter = (value: number) => formatNumber(value),
  tone = 'brand',
  emptyLabel = 'No data',
}: {
  data: CategoryDatum[];
  valueFormatter?: (value: number) => string;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'info';
  emptyLabel?: string;
}): ReactNode {
  if (!data.length) return <p className="text-ink-500 px-1 py-3 text-xs">{emptyLabel}</p>;

  const max = Math.max(...data.map((entry) => entry.value), 1);
  const barTone: Record<string, string> = {
    brand: 'bg-brand-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
  };

  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((entry) => (
        <li key={entry.name}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-ink-700 truncate text-xs">{entry.name}</span>
            <span className="text-ink-800 tnum text-xs font-semibold">{valueFormatter(entry.value)}</span>
          </div>
          <div className="bg-ink-200 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full ${barTone[tone]}`}
              style={{ width: `${Math.max(3, (entry.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
