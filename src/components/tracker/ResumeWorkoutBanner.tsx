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
    <div className="mb-6 bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-indigo-500/15 text-indigo-300 rounded-xl">
          <History className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">Unfinished {draft.workoutType} workout</div>
          <div className="text-xs text-slate-400">
            Started {describeStart(draft.startTime)} · {doneSets} of {sets.length} sets done
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onDiscard}
          className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-300 rounded-xl transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Discard</span>
        </button>
        <button
          onClick={onResume}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition active:scale-95"
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
