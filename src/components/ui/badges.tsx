import { Flame, Info, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import type { OverloadStatus, SplitType } from '../../types/workout.ts';

// Class names are written out in full so Tailwind finds them.
interface SplitStyle {
  text: string;
  tint: string;
  fill: string;
  border: string;
  gradient: string;
  hoverBorder: string;
  groupHoverFill: string;
}

export const SPLIT_STYLE: Record<SplitType, SplitStyle> = {
  Push: {
    text: 'text-push',
    tint: 'bg-push/15',
    fill: 'bg-push text-on-split',
    border: 'border-push/40',
    gradient: 'from-push/20 to-push/5',
    hoverBorder: 'hover:border-push/50',
    groupHoverFill: 'group-hover:bg-push group-hover:text-on-split'
  },
  Pull: {
    text: 'text-pull',
    tint: 'bg-pull/15',
    fill: 'bg-pull text-on-split',
    border: 'border-pull/40',
    gradient: 'from-pull/20 to-pull/5',
    hoverBorder: 'hover:border-pull/50',
    groupHoverFill: 'group-hover:bg-pull group-hover:text-on-split'
  },
  Legs: {
    text: 'text-legs',
    tint: 'bg-legs/15',
    fill: 'bg-legs text-on-split',
    border: 'border-legs/40',
    gradient: 'from-legs/20 to-legs/5',
    hoverBorder: 'hover:border-legs/50',
    groupHoverFill: 'group-hover:bg-legs group-hover:text-on-split'
  },
  Other: {
    text: 'text-other',
    tint: 'bg-other/15',
    fill: 'bg-other text-on-split',
    border: 'border-other/40',
    gradient: 'from-other/20 to-other/5',
    hoverBorder: 'hover:border-other/50',
    groupHoverFill: 'group-hover:bg-other group-hover:text-on-split'
  }
};

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
      <span className={`px-2 py-0.5 rounded-chip font-bold text-[10px] uppercase tracking-wider border ${style.className}`}>
        {style.shortLabel}
      </span>
    );
  }
  const Icon = style.icon;
  return (
    <span className={`px-3 py-1 rounded-pill text-xs font-bold flex items-center space-x-1 border ${style.className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{style.label}</span>
    </span>
  );
}
