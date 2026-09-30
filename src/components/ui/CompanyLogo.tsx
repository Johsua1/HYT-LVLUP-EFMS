import { cn } from '@/lib/utils';

/**
 * Company avatar. Real logos are out of scope for the prototype, so each
 * employer gets a deterministic monogram derived from a stored hue — visually
 * distinct without implying a real brand.
 */
export function CompanyLogo({
  initials,
  hue,
  size = 'md',
  className,
  square = false,
}: {
  initials: string;
  hue: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  square?: boolean;
}) {
  const dimensions = {
    xs: 'h-6 w-6 text-[9px]',
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-9 w-9 text-[11px]',
    lg: 'h-12 w-12 text-sm',
    xl: 'h-16 w-16 text-lg',
  }[size];

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-bold tracking-tight ring-1 ring-inset',
        square ? 'rounded-md' : 'rounded-full',
        dimensions,
        className,
      )}
      style={{
        backgroundColor: `hsl(${hue} 62% 94%)`,
        color: `hsl(${hue} 58% 30%)`,
        boxShadow: `inset 0 0 0 1px hsl(${hue} 50% 84%)`,
      }}
    >
      {initials}
    </span>
  );
}

/** User avatar with a neutral, consistent treatment. */
export function UserAvatar({
  initials,
  size = 'md',
  className,
}: {
  initials: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dimensions = {
    xs: 'h-6 w-6 text-[9px]',
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-8 w-8 text-[11px]',
    lg: 'h-10 w-10 text-xs',
  }[size];

  return (
    <span
      aria-hidden
      className={cn(
        'bg-ink-800 inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        dimensions,
        className,
      )}
    >
      {initials}
    </span>
  );
}
