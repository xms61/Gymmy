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

// The round line marker of a split, like a route bullet on a station sign: its first letter on
// the split color.
export function RouteMarker({ split, className = '' }: { split: SplitType; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid place-items-center w-8 h-8 flex-none rounded-pill ring-1 ring-on-split/40 font-display text-lg font-bold text-on-split ${SPLIT_FILL[split]} ${className}`}
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
  shortLabel: string;
  icon: LucideIcon;
  className: string;
}

const STATUS_STYLE: Record<OverloadStatus, StatusStyle> = {
  increase_load: {
    label: 'Add Weight',
    shortLabel: '+Weight',
    icon: TrendingUp,
    className: 'bg-good-ink/15 text-good-ink border-good-ink/40'
  },
  progress_reps: {
    label: 'Rep Goal Active',
    shortLabel: '+Reps',
    icon: Flame,
    className: 'bg-accent-ink/15 text-accent-ink border-accent-ink/40'
  },
  maintain: {
    label: 'Rep Goal Active',
    shortLabel: '+Reps',
    icon: Flame,
    className: 'bg-accent-ink/15 text-accent-ink border-accent-ink/40'
  },
  deload: {
    label: 'Deload Advised',
    shortLabel: 'Deload',
    icon: Info,
    className: 'bg-warn-ink/15 text-warn-ink border-warn-ink/40'
  },
  reduce_load: {
    label: 'Lighter Weight',
    shortLabel: 'Lighter',
    icon: TrendingDown,
    className: 'bg-info-ink/15 text-info-ink border-info-ink/40'
  }
};

// The short form fits the dashboard's target list; the full form, with an icon, heads an exercise in the tracker.
export function StatusBadge({ status, short = false }: { status: OverloadStatus; short?: boolean }) {
  const style = STATUS_STYLE[status];
  if (short) {
    return (
      <span className={`px-2 py-0.5 rounded-chip font-display font-semibold text-xs uppercase tracking-[0.06em] border ${style.className}`}>
        {style.shortLabel}
      </span>
    );
  }
  const Icon = style.icon;
  return (
    <span className={`h-tap px-3 rounded-chip flex items-center gap-1.5 border font-display text-sm font-semibold uppercase tracking-[0.06em] ${style.className}`}>
      <Icon className="w-4 h-4" />
      <span>{style.label}</span>
    </span>
  );
}
