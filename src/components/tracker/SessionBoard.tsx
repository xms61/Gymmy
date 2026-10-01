import type { ExerciseSessionLog } from '../../types/workout.ts';
import { Flaps } from '../ui/Flaps.tsx';

interface SessionBoardProps {
  logs: ExerciseSessionLog[];
  current: number; // the exercise on the board
  onSelect: (exerciseIdx: number) => void;
}

// Every exercise of the workout as one row, like the departures on a station board. The row on
// the board and the next one with open sets are in full ink; the rest wait at half ink. Load and
// progress are on flaps, so a row turns over when its exercise moves on.
export function SessionBoard({ logs, current, onSelect }: SessionBoardProps) {
  const next = logs.findIndex((log, idx) => idx > current && log.sets.some(s => !s.completed));
  return (
    <section aria-labelledby="session-board">
      <h3 id="session-board" className="text-2xl text-ink">
        This workout
      </h3>
      <ol className="mt-3 border-t border-line">
        {logs.map((log, idx) => {
          const done = log.sets.filter(s => s.completed).length;
          const finished = done === log.sets.length;
          const tone = idx === current ? 'bg-surface' : idx === next ? '' : 'opacity-50';
          return (
            <li key={log.exerciseId} className="border-b border-line">
              <button
                onClick={() => onSelect(idx)}
                aria-current={idx === current ? 'true' : undefined}
                className={`session-row w-full grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-2 py-2.5 text-left text-ink hover:bg-surface transition-colors ${tone}`}
              >
                <span className="font-display text-lg font-semibold uppercase tracking-[0.04em] truncate">{log.exerciseName}</span>
                <Flaps text={String(log.sets[0]?.weightKg ?? 0)} cells={5} label={`${log.sets[0]?.weightKg ?? 0} kg`} className="text-xl" />
                <Flaps
                  text={finished ? 'DONE' : `${done}/${log.sets.length}`}
                  cells={4}
                  label={finished ? 'all sets done' : `${done} of ${log.sets.length} sets done`}
                  className="text-xl"
                />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
