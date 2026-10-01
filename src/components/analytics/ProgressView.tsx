import { useMemo, useState } from 'react';
import type { ExerciseDefinition, ProgressRecommendation } from '../../types/workout.ts';
import { getRecommendation } from '../../services/overloadEngine.ts';
import { exerciseHistory, type ExerciseHistoryEntry } from '../../services/progress.ts';
import { logsFor, type ExerciseLogIndex } from '../../services/exerciseLogs.ts';
import { ROTATION } from '../../services/rotation.ts';
import { formatSessionDate } from '../../utils/date.ts';
import { RouteMarker, StatusBadge } from '../ui/badges.tsx';
import { Flaps } from '../ui/Flaps.tsx';
import { TrendChart } from './TrendChart.tsx';

interface ProgressViewProps {
  exercises: ExerciseDefinition[];
  logIndex: ExerciseLogIndex;
}

interface ExerciseProgress {
  exercise: ExerciseDefinition;
  history: ExerciseHistoryEntry[]; // oldest first
  recommendation: ProgressRecommendation;
}

// Every exercise on a rail with its latest 1RM; the chosen one fills the board with its record,
// its next target, both curves and every session.
export function ProgressView({ exercises, logIndex }: ProgressViewProps) {
  const progress = useMemo(
    () =>
      exercises.map(exercise => {
        const logs = logsFor(logIndex, exercise);
        return { exercise, history: exerciseHistory(logs), recommendation: getRecommendation(exercise, logs) };
      }),
    [exercises, logIndex]
  );
  const [selectedId, setSelectedId] = useState(() => exercises[0]?.id ?? '');
  const selected = progress.find(p => p.exercise.id === selectedId) ?? progress[0];

  return (
    <div className="grid grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] gap-10 items-start">
      <ExerciseRail progress={progress} selectedId={selected?.exercise.id} onSelect={setSelectedId} />
      {selected && <ExerciseRecord progress={selected} />}
    </div>
  );
}

interface ExerciseRailProps {
  progress: ExerciseProgress[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

function ExerciseRail({ progress, selectedId, onSelect }: ExerciseRailProps) {
  return (
    <nav aria-label="Exercises" className="grid gap-6">
      {ROTATION.map(split => {
        const rows = progress.filter(p => p.exercise.workoutType === split);
        if (rows.length === 0) return null;
        return (
          <section key={split} aria-label={split}>
            <h3 className="flex items-center gap-2.5 text-2xl text-ink">
              <RouteMarker split={split} />
              {split}
            </h3>
            <ol className="mt-2 border-t border-line">
              {rows.map(({ exercise, history }) => {
                const latest = history[history.length - 1];
                return (
                  <li key={exercise.id} className={`border-b border-line ${latest || exercise.id === selectedId ? '' : 'opacity-50'}`}>
                    <button
                      onClick={() => onSelect(exercise.id)}
                      aria-current={exercise.id === selectedId ? 'true' : undefined}
                      className={`w-full grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-2 py-2 text-left transition-colors ${
                        exercise.id === selectedId ? 'bg-surface text-ink' : 'text-ink-soft hover:bg-surface'
                      }`}
                    >
                      <span className="font-display text-lg font-semibold uppercase tracking-[0.04em] truncate">{exercise.name}</span>
                      {latest ? (
                        <Flaps text={String(latest.estimated1RM)} cells={5} label={`estimated 1RM ${latest.estimated1RM} kg`} className="text-xl" />
                      ) : (
                        <span className="section-label">No sessions</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </nav>
  );
}

function ExerciseRecord({ progress: { exercise, history, recommendation } }: { progress: ExerciseProgress }) {
  const bestLoad = history.length ? Math.max(...history.map(h => h.weight)) : null;
  const best1RM = history.length ? Math.max(...history.map(h => h.estimated1RM)) : null;
  return (
    <section aria-labelledby="record-heading" className="grid gap-8 min-w-0">
      <div>
        <h2 id="record-heading" className="text-6xl leading-[0.95] text-ink">
          {exercise.name}
        </h2>
        <p className="mt-2 font-display text-lg font-medium uppercase tracking-[0.06em] text-ink-muted">
          {exercise.workoutType} · {exercise.equipment} · {exercise.targetSets} × {exercise.targetRepsMin}–{exercise.targetRepsMax}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
        <Record label="Best load, kg" value={bestLoad} />
        <Record label="Best est. 1RM, kg" value={best1RM} />
        <div className="grid gap-2 min-w-0 max-w-[36ch]">
          <span className="section-label">Next</span>
          <span className="font-mono text-2xl text-ink">
            {recommendation.recommendedWeightKg} kg × {recommendation.recommendedRepRange}
          </span>
          {recommendation.status !== 'maintain' && <StatusBadge status={recommendation.status} />}
          <p className="text-base text-ink-soft">{recommendation.nextStepGoal}</p>
        </div>
      </div>

      {history.length === 0 ? (
        <p className="text-base text-ink-muted">No sessions of this exercise yet. Its record starts with the first logged set.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6">
            <TrendChart title="Estimated 1RM" unit="kg" points={history.map(h => ({ label: formatSessionDate(h.date), value: h.estimated1RM }))} />
            <TrendChart title="Session volume" unit="kg" points={history.map(h => ({ label: formatSessionDate(h.date), value: h.volumeKg }))} />
          </div>
          <SessionHistory history={history} />
        </>
      )}
    </section>
  );
}

function Record({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="grid gap-2">
      <span className="section-label">{label}</span>
      <Flaps text={value === null ? '-' : String(value)} cells={5} label={value === null ? 'none yet' : `${value} kg`} className="text-[3.75rem] xl:text-[4.5rem]" />
    </div>
  );
}

// Every session, newest first: the table the charts draw.
function SessionHistory({ history }: { history: ExerciseHistoryEntry[] }) {
  return (
    <section aria-labelledby="history-heading">
      <h3 id="history-heading" className="text-2xl text-ink">
        Sessions
      </h3>
      <table className="mt-2 w-full border-t border-line text-left">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="section-label font-semibold px-2 py-2">Date</th>
            <th scope="col" className="section-label font-semibold px-2 py-2 text-right">Load, kg</th>
            <th scope="col" className="section-label font-semibold px-2 py-2">Reps</th>
            <th scope="col" className="section-label font-semibold px-2 py-2 text-right">Est. 1RM, kg</th>
          </tr>
        </thead>
        <tbody>
          {history
            .slice()
            .reverse()
            .map(h => (
              <tr key={`${h.date}-${h.sessionName}`} className="border-b border-line">
                <td className="px-2 py-2.5 font-display text-lg font-semibold uppercase tracking-[0.04em] text-ink-soft">{formatSessionDate(h.date)}</td>
                <td className="px-2 py-2.5 font-mono text-lg text-ink text-right">{h.weight}</td>
                <td className="px-2 py-2.5 font-mono text-lg text-ink-soft">{h.repsString}</td>
                <td className="px-2 py-2.5 font-mono text-lg text-ink text-right">{h.estimated1RM}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </section>
  );
}
