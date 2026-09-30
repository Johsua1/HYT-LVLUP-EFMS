import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export interface ChartCardProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  /** Rendered when there is nothing to plot. */
  isEmpty?: boolean;
  emptyMessage?: string;
  height?: number;
  children: ReactNode;
  className?: string;
}

/**
 * Standard frame for a chart: title, optional toolbar, fixed-height plot area
 * and a built-in empty state so charts never render an axis with no series.
 */
export function ChartCard({
  title,
  description,
  actions,
  icon,
  isEmpty = false,
  emptyMessage = 'No data matches the current filters.',
  height = 280,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader title={title} description={description} actions={actions} icon={icon} />
      {/*
        Two nested boxes are doing real work here.

        `flex-1` compiles to `flex: 1 1 0%`, and in a flex column the used main
        size comes from `flex-basis` — so an inline `height` would be ignored
        and the plot area would collapse to nothing. `minHeight` keeps the
        guaranteed plot area while still letting the card stretch to match its
        row neighbours.

        But `min-height` alone leaves the box's `height` as `auto`, and
        Recharts' ResponsiveContainer sets `height: 100%` on its wrapper, which
        against an auto-height parent resolves to zero. The absolutely
        positioned inner box is what gives the chart a *definite* height to
        measure against.
      */}
      <div className="relative min-h-0 flex-1" style={{ minHeight: height }}>
        {isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <EmptyState compact title="Nothing to display" description={emptyMessage} />
          </div>
        ) : (
          <div className="absolute inset-0">{children}</div>
        )}
      </div>
    </Card>
  );
}
