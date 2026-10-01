import { Flame, Info, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import type { OverloadStatus, SplitType } from '../../types/workout.ts';

// Class names are written out in full so Tailwind finds them.
interface SplitStyle {
  text: string;
  tint: string;
  fill: string;
  border: string;
  hoverBorder: string;
  groupHoverFill: string;
}

export const SPLIT_STYLE: Record<SplitType, SplitStyle> = {
  Push: {
    text: 'text-push',
    tint: 'bg-push/15',
    fill: 'bg-push text-on-split',
    border: 'border-push/40',
    hoverBorder: 'hover:border-push/50',
    groupHoverFill: 'group-hover:bg-push group-hover:text-on-split'
  },
  Pull: {
    text: 'text-pull',
    tint: 'bg-pull/15',
    fill: 'bg-pull text-on-split',
    border: 'border-pull/40',
    hoverBorder: 'hover:border-pull/50',
    groupHoverFill: 'group-hover:bg-pull group-hover:text-on-split'
  },
  Legs: {
    text: 'text-legs',
    tint: 'bg-legs/15',
    fill: 'bg-legs text-on-split',
    border: 'border-legs/40',
    hoverBorder: 'hover:border-legs/50',
    groupHoverFill: 'group-hover:bg-legs group-hover:text-on-split'
  },
  Other: {
    text: 'text-other',
    tint: 'bg-other/15',
    fill: 'bg-other text-on-split',
    border: 'border-other/40',
    hoverBorder: 'hover:border-other/50',
    groupHoverFill: 'group-hover:bg-other group-hover:text-on-split'
  }
};

const SPLIT_FILL: Record<SplitType, string> = {
  Push: 'bg-push',
  Pull: 'bg-pull',
  Legs: 'bg-legs',
  Other: 'bg-other'
};

const MARKER_SIZE = {
  sm: 'w-6 h-6 text-sm ring-1',
  md: 'w-8 h-8 text-lg ring-1',
  lg: 'w-14 h-14 text-3xl ring-2 xl:w-20 xl:h-20 xl:text-5xl' // 3.5rem, 5rem from 1280px wide
};

// The round line marker of a split, like a route bullet on a station sign: its first letter on
// the split color.
export function RouteMarker({ split, size = 'md' }: { split: SplitType; size?: keyof typeof MARKER_SIZE }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid place-items-center flex-none rounded-pill ring-on-split/40 font-display font-bold text-on-split ${MARKER_SIZE[size]} ${SPLIT_FILL[split]}`}
    >
      {split[0]}
    </span>
  );
}

export function SplitBadge({ split, label }: { split: SplitType; label: string }) {
  const style = SPLIT_STYLE[split];
  return (
    <span
      className={`px-2.5 py-0.5 rounded-pill text-xs font-extrabold uppercase tracking-wider border ${style.tint} ${style.text} ${style.border}`}
    >
      {label}
    </span>
  );
}

interface StatusStyle {
  label: string;
  icon: LucideIcon;
  className: string;
}

const STATUS_STYLE: Record<OverloadStatus, StatusStyle> = {
  increase_load: {
    label: 'Add Weight',
    icon: TrendingUp,
    className: 'text-good-ink'
  },
  progress_reps: {
    label: 'Rep Goal Active',
    icon: Flame,
    className: 'text-ink-soft'
  },
  maintain: {
    label: 'Rep Goal Active',
    icon: Flame,
    className: 'text-ink-soft'
  },
  deload: {
    label: 'Deload Advised',
    icon: Info,
    className: 'text-warn-ink'
  },
  reduce_load: {
    label: 'Lighter Weight',
    icon: TrendingDown,
    className: 'text-info-ink'
  }
};

// What the progression asks for, as an icon and a word in its status ink. Status is read, not
// pressed, so it carries no box.
export function StatusBadge({ status }: { status: OverloadStatus }) {
  const style = STATUS_STYLE[status];
  const Icon = style.icon;
  return (
    <span className={`flex items-center gap-1.5 font-display text-base font-semibold uppercase tracking-[0.06em] ${style.className}`}>
      <Icon className="w-4 h-4" />
      <span>{style.label}</span>
    </span>
  );
}
