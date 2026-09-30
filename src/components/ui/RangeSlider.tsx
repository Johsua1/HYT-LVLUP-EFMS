import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  /** `[lower, upper]` bounds. */
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  ariaLabel: string;
  className?: string;
}

const percentOf = (value: number, min: number, max: number) =>
  max === min ? 0 : ((value - min) / (max - min)) * 100;

/**
 * Dual-thumb range control built from two native range inputs.
 *
 * Native inputs give us keyboard support, touch behaviour and screen-reader
 * semantics without a pointer-event state machine. The inputs are transparent
 * and only their thumbs accept pointer events (see `.range-input` in
 * `index.css`), so both thumbs remain independently draggable.
 */
export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue,
  ariaLabel,
  className,
}: RangeSliderProps) {
  const id = useId();
  const [lower, upper] = value;
  const lowerPercent = percentOf(lower, min, max);
  const upperPercent = percentOf(upper, min, max);

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-4">
        <div className="bg-ink-200 absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full" />
        <div
          className="bg-brand-600 absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
          style={{ left: `${lowerPercent}%`, width: `${Math.max(0, upperPercent - lowerPercent)}%` }}
        />
        <input
          id={`${id}-lower`}
          type="range"
          className="range-input"
          min={min}
          max={max}
          step={step}
          value={lower}
          aria-label={`${ariaLabel} minimum`}
          aria-valuetext={formatValue ? formatValue(lower) : String(lower)}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange([Math.min(next, upper), upper]);
          }}
        />
        <input
          id={`${id}-upper`}
          type="range"
          className="range-input"
          min={min}
          max={max}
          step={step}
          value={upper}
          aria-label={`${ariaLabel} maximum`}
          aria-valuetext={formatValue ? formatValue(upper) : String(upper)}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange([lower, Math.max(next, lower)]);
          }}
        />
      </div>
    </div>
  );
}
