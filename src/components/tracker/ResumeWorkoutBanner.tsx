import { Play, Trash2 } from 'lucide-react';
import type { WorkoutDraft } from '../../types/workout.ts';
import { toLocalDateString } from '../../utils/date.ts';
import { RouteMarker } from '../ui/badges.tsx';

interface ResumeWorkoutBannerProps {
  draft: WorkoutDraft;
  onResume: () => void;
  onDiscard: () => void;
}

// One board row above the calendar and progress screens. Home shows the draft on its sign instead.
export function ResumeWorkoutBanner({ draft, onResume, onDiscard }: ResumeWorkoutBannerProps) {
  const sets = draft.exerciseLogs.flatMap(log => log.sets);
  const doneSets = sets.filter(s => s.completed).length;

  return (
    <div role="status" className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <RouteMarker split={draft.workoutType} />
        <div>
          <div className="font-display text-xl font-semibold uppercase tracking-[0.04em] text-ink">Unfinished {draft.workoutType}</div>
          <div className="text-sm text-ink-muted">
            Started {describeDraftStart(draft.startTime)} · {doneSets} of {sets.length} sets done
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onDiscard} className="btn btn-secondary h-tap px-3 text-sm border border-edge">
          <Trash2 className="w-4 h-4" />
          Discard
        </button>
        <button onClick={onResume} className="btn btn-good h-tap px-4 text-sm">
          <Play className="w-4 h-4" />
          Resume
        </button>
      </div>
    </div>
  );
}

// "at 14:38" today, "Wed 30 Sep at 14:38" on another day.
export function describeDraftStart(startTime: string): string {
  const start = new Date(startTime);
  const time = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (toLocalDateString(start) === toLocalDateString(new Date())) return `at ${time}`;
  return `${start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${time}`;
}
