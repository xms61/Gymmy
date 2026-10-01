import { useMemo, type ReactNode } from 'react';
import { Play, Trash2 } from 'lucide-react';
import type { ExerciseDefinition, ProgressRecommendation, SplitType, WorkoutDraft, WorkoutSession } from '../../types/workout.ts';
import { getRecommendation } from '../../services/overloadEngine.ts';
import { logsFor, type ExerciseLogIndex } from '../../services/exerciseLogs.ts';
import { latestSession, nextSplit as nextInRotation, ROTATION } from '../../services/rotation.ts';
import { weeklyStreak } from '../../services/streak.ts';
import { RouteMarker, StatusBadge } from '../ui/badges.tsx';
import { Flaps } from '../ui/Flaps.tsx';
import { formatSessionDate } from '../../utils/date.ts';
import { describeDraftStart } from '../tracker/ResumeWorkoutBanner.tsx';

interface HomeDashboardProps {
  sessions: WorkoutSession[];
  exercises: ExerciseDefinition[];
  logIndex: ExerciseLogIndex;
  draft: WorkoutDraft | null;
  onStartWorkout: (type: SplitType) => void;
  onResumeWorkout: () => void;
  onDiscardDraft: () => void;
  canStart: boolean; // false until the first sync, so targets come from the full history
}

// Home as a platform sign: the next workout hangs in yellow with Start on it, its targets sit
// under it as board rows, and the record runs along the foot.
export function HomeDashboard({
  sessions,
  exercises,
  logIndex,
  draft,
  onStartWorkout,
  onResumeWorkout,
  onDiscardDraft,
  canStart
}: HomeDashboardProps) {
  const lastSession = useMemo(() => latestSession(sessions), [sessions]);
  const next = useMemo(() => nextInRotation(sessions), [sessions]);
  const split = draft?.workoutType ?? next;

  const targets = useMemo(
    () =>
      exercises
        .filter(e => e.workoutType === split)
        .map(exercise => ({ exercise, recommendation: getRecommendation(exercise, logsFor(logIndex, exercise)) })),
    [exercises, split, logIndex]
  );

  return (
    <div className="grid gap-7">
      {draft ? (
        <DraftSign draft={draft} onResume={onResumeWorkout} onDiscard={onDiscardDraft} />
      ) : (
        <NextSign split={next} lastSession={lastSession} canStart={canStart} onStart={() => onStartWorkout(next)} />
      )}

      <section aria-labelledby="targets-heading">
        <h3 id="targets-heading" className="text-2xl text-ink">
          Targets
        </h3>
        <ol className="mt-2 border-t border-line">
          {targets.map(({ exercise, recommendation }) => (
            <TargetRow key={exercise.id} exercise={exercise} recommendation={recommendation} />
          ))}
        </ol>
      </section>

      <RecordStrip sessions={sessions} current={split} canStart={canStart} onStart={onStartWorkout} />
    </div>
  );
}

function NextSign({ split, lastSession, canStart, onStart }: { split: SplitType; lastSession: WorkoutSession | null; canStart: boolean; onStart: () => void }) {
  return (
    <SignPanel split={split} state="Next" detail={lastSession ? `After ${lastSession.splitType} on ${formatSessionDate(lastSession.date)}` : 'The rotation starts with Push'}>
      <button
        onClick={onStart}
        disabled={!canStart}
        title={canStart ? undefined : 'Waiting for the first sync, so the targets come from your full history'}
        className="btn h-16 px-6 xl:px-8 text-xl xl:text-2xl bg-on-accent text-accent hover:bg-on-accent/85 disabled:bg-on-accent/30 disabled:text-on-accent/70"
      >
        <Play className="w-6 h-6 fill-current" />
        {canStart ? 'Start' : 'Syncing'}
      </button>
    </SignPanel>
  );
}

function DraftSign({ draft, onResume, onDiscard }: { draft: WorkoutDraft; onResume: () => void; onDiscard: () => void }) {
  const sets = draft.exerciseLogs.flatMap(log => log.sets);
  const done = sets.filter(s => s.completed).length;
  return (
    <SignPanel split={draft.workoutType} state="Unfinished" detail={`Started ${describeDraftStart(draft.startTime)} · ${done} of ${sets.length} sets done`}>
      <div className="flex flex-none items-center gap-2">
        <button onClick={onDiscard} className="btn h-16 px-4 xl:px-5 text-base xl:text-lg border-2 border-on-accent/60 hover:bg-on-accent/10">
          <Trash2 className="w-5 h-5" />
          Discard
        </button>
        <button onClick={onResume} className="btn h-16 px-6 xl:px-8 text-xl xl:text-2xl bg-on-accent text-accent hover:bg-on-accent/85">
          <Play className="w-6 h-6 fill-current" />
          Resume
        </button>
      </div>
    </SignPanel>
  );
}

interface SignPanelProps {
  split: SplitType;
  state: string; // Next or Unfinished, read on the split's line
  detail: string;
  children: ReactNode;
}

// The yellow enamel sign: what is next, in letters big enough to read from the rack. The split
// sits on the board's own flap cells, so it turns over when the rotation moves on.
function SignPanel({ split, state, detail, children }: SignPanelProps) {
  return (
    <section className="bg-accent text-on-accent rounded-card px-8 py-5 flex items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <RouteMarker split={split} size="lg" />
        <div>
          <h2 className="flex items-center gap-5 leading-none">
            <span className="text-4xl xl:text-5xl">{state}</span>
            <Flaps text={split.toUpperCase()} label={split} className="text-[4.5rem] xl:text-[6rem]" />
          </h2>
          <p className="mt-3 font-display text-lg font-medium uppercase tracking-[0.04em]">{detail}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TargetRow({ exercise, recommendation }: { exercise: ExerciseDefinition; recommendation: ProgressRecommendation }) {
  const load = recommendation.recommendedWeightKg;
  // A bodyweight lift with no added load reads BW, not 0 kg.
  const bodyweight = exercise.equipment === 'bodyweight' && load === 0;
  return (
    <li className="grid grid-cols-[minmax(12rem,20rem)_9.5rem_9.5rem_minmax(0,1fr)] items-center gap-8 border-b border-line last:border-b-0 px-2 py-2">
      <span className="font-display text-2xl font-semibold uppercase tracking-[0.03em] text-ink truncate">{exercise.name}</span>
      <span className="flex items-baseline gap-2">
        <Flaps text={bodyweight ? 'BW' : String(load)} cells={5} label={bodyweight ? 'bodyweight' : `${load} kg`} className="text-[2.25rem]" />
        <span className={`section-label ${bodyweight ? 'invisible' : ''}`}>kg</span>
      </span>
      <span className="flex items-baseline gap-2">
        <Flaps
          text={repRangeOnFlaps(exercise.targetRepsMin, exercise.targetRepsMax)}
          cells={5}
          label={`${exercise.targetRepsMin} to ${exercise.targetRepsMax} reps`}
          className="text-[2.25rem]"
        />
        <span className="section-label">reps</span>
      </span>
      <span>
        {/* A steady target needs no badge: the row already shows it. */}
        {recommendation.status !== 'maintain' && <StatusBadge status={recommendation.status} />}
      </span>
    </li>
  );
}

interface RecordStripProps {
  sessions: WorkoutSession[];
  current: SplitType;
  canStart: boolean;
  onStart: (split: SplitType) => void;
}

// The record and the other two splits, along the foot of the board.
function RecordStrip({ sessions, current, canStart, onStart }: RecordStripProps) {
  const completed = sessions.filter(s => s.completed);
  const volumeTonnes = Math.round(completed.reduce((total, s) => total + s.totalVolumeKg, 0) / 1000);
  const streak = weeklyStreak(sessions, new Date());
  return (
    <section aria-label="Record" className="grid grid-cols-[repeat(3,auto)_minmax(0,1fr)] items-end gap-x-12 border-t border-line pt-6">
      <Figure label="Weekly streak" value={String(streak)} unit={streak === 1 ? 'week' : 'weeks'} />
      <Figure label="Workouts" value={String(completed.length)} />
      <Figure label="Volume" value={String(volumeTonnes)} unit="t" />
      <div className="flex justify-end gap-2">
        {ROTATION.filter(split => split !== current).map(split => (
          <button key={split} onClick={() => onStart(split)} disabled={!canStart} className="btn btn-secondary h-tap-lg px-4 text-base border border-edge disabled:opacity-50">
            <RouteMarker split={split} size="sm" />
            Start {split}
          </button>
        ))}
      </div>
    </section>
  );
}

function Figure({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="grid gap-2">
      <span className="section-label">{label}</span>
      <span className="flex items-baseline gap-2">
        <Flaps text={value} cells={3} label={`${value}${unit ? ` ${unit}` : ''}`} className="text-[2.25rem]" />
        {/* Every figure keeps a unit slot, so the three flap rows share one baseline. */}
        <span className={`section-label ${unit ? '' : 'invisible'}`}>{unit ?? 'x'}</span>
      </span>
    </div>
  );
}

// "5-6" as " 5-6 " and "10-15" as "10-15": two cells either side of the dash, so the dashes of
// every row stand in one column.
function repRangeOnFlaps(min: number, max: number): string {
  return `${String(min).padStart(2, ' ')}-${String(max).padEnd(2, ' ')}`;
}
