import { History, Play, Trash2 } from 'lucide-react';
import type { WorkoutDraft } from '../../types/workout.ts';
import { toLocalDateString } from '../../utils/date.ts';

interface ResumeWorkoutBannerProps {
  draft: WorkoutDraft;
  onResume: () => void;
  onDiscard: () => void;
}

export function ResumeWorkoutBanner({ draft, onResume, onDiscard }: ResumeWorkoutBannerProps) {
  const sets = draft.exerciseLogs.flatMap(log => log.sets);
  const doneSets = sets.filter(s => s.completed).length;

  return (
    <div className="mb-6 bg-accent/10 border border-accent-ink/40 rounded-panel p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-accent-ink/15 text-accent-ink rounded-control">
          <History className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-ink">Unfinished {draft.workoutType} workout</div>
          <div className="text-xs text-ink-muted">
            Started {describeStart(draft.startTime)} · {doneSets} of {sets.length} sets done
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onDiscard}
          className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-ink-muted hover:text-bad-ink rounded-control transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Discard</span>
        </button>
        <button
          onClick={onResume}
          className="btn btn-primary gap-1.5 px-4 py-2 text-xs"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Resume</span>
        </button>
      </div>
    </div>
  );
}

function describeStart(startTime: string): string {
  const start = new Date(startTime);
  const time = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (toLocalDateString(start) === toLocalDateString(new Date())) return `at ${time}`;
  return `${start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${time}`;
}
