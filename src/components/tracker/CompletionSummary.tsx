import type { WorkoutSession } from '../../types/workout.ts';
import { Dialog } from '../ui/Dialog.tsx';
import { Flaps } from '../ui/Flaps.tsx';
import { RouteMarker } from '../ui/badges.tsx';
import { formatSessionDate } from '../../utils/date.ts';

interface CompletionSummaryProps {
  session: WorkoutSession;
  onDone: () => void;
}

// The saved workout. "Logged" turns over on the flaps, the board's only celebration.
export function CompletionSummary({ session, onDone }: CompletionSummaryProps) {
  return (
    <Dialog onClose={onDone} width="lg">
      <div className="flex items-center gap-3">
        <RouteMarker split={session.splitType} />
        <h2 className="text-3xl text-ink">{session.splitType} saved</h2>
      </div>
      <Flaps text="LOGGED" className="mt-6 text-[3.25rem] sm:text-[4.5rem]" />

      <dl className="mt-6 grid grid-cols-3 border-y border-line">
        <Figure label="Date" value={formatSessionDate(session.date)} />
        <Figure label="Time" value={`${session.durationMinutes} min`} />
        <Figure label="Volume" value={`${session.totalVolumeKg.toLocaleString()} kg`} />
      </dl>

      <button onClick={onDone} className="btn btn-good w-full mt-6 h-tap-lg text-lg">
        Done
      </button>
    </Dialog>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 pr-3">
      <dt className="section-label">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-semibold text-ink">{value}</dd>
    </div>
  );
}
