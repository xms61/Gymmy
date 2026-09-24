import { Trophy } from 'lucide-react';
import type { WorkoutSession } from '../../types/workout.ts';
import { Dialog } from '../ui/Dialog.tsx';

interface CompletionSummaryProps {
  session: WorkoutSession;
  onDone: () => void;
}

export function CompletionSummary({ session, onDone }: CompletionSummaryProps) {
  return (
    <Dialog onClose={onDone} className="text-center overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-good-ink/10 rounded-pill blur-3xl pointer-events-none" />

      <div className="w-16 h-16 bg-gradient-to-tr from-good to-accent rounded-panel flex items-center justify-center mx-auto mb-4 shadow-xl shadow-good/20">
        <Trophy className="w-8 h-8 text-on-good" />
      </div>

      <h2 className="text-2xl font-black text-ink tracking-tight mb-1">Workout Saved</h2>
      <p className="text-sm text-ink-muted mb-6">Your sets are in your history and on the calendar.</p>

      <div className="grid grid-cols-2 gap-3 mb-6 text-left">
        <div className="panel p-3.5">
          <div className="text-xs text-ink-muted font-semibold mb-1">Duration</div>
          <div className="text-xl font-mono font-black text-ink">{session.durationMinutes} min</div>
        </div>

        <div className="panel p-3.5">
          <div className="text-xs text-ink-muted font-semibold mb-1">Total Volume</div>
          <div className="text-xl font-mono font-black text-good-ink">{session.totalVolumeKg.toLocaleString()} kg</div>
        </div>
      </div>

      <button onClick={onDone} className="btn btn-good w-full py-3.5 text-sm shadow-lg shadow-good/30">
        View Calendar & Dashboard
      </button>
    </Dialog>
  );
}
