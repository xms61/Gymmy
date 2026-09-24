import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  EquipmentType,
  ExerciseDefinition,
  ExerciseSessionLog,
  SetLog,
  SplitType,
  WorkoutDraft,
  WorkoutSession
} from '../../types/workout.ts';
import { isPlateLoaded, type PlateLoaded } from '../../services/loading.ts';
import { getRecommendation } from '../../services/overloadEngine.ts';
import { indexCompletedLogs, logsFor } from '../../services/exerciseLogs.ts';
import { StorageService } from '../../services/storage.ts';
import { RestTimer } from './RestTimer.tsx';
import { PlateCalculatorModal } from './PlateCalculatorModal.tsx';
import { ElapsedClock } from './ElapsedClock.tsx';
import { ExerciseCard } from './ExerciseCard.tsx';
import { CompletionSummary } from './CompletionSummary.tsx';
import type { SetChange } from './SetRow.tsx';
import { workoutDurationMinutes } from './workoutTime.ts';
import { toLocalDateString } from '../../utils/date.ts';
import { unlockAudio } from '../../utils/audio.ts';
import { clearDraft, saveDraft } from './workoutDraft.ts';
import { SplitBadge } from '../ui/badges.tsx';
import { LIMITS, MAX_NOTES_LENGTH } from '../../validation.ts';

interface LiveTrackerProps {
  workoutType: SplitType;
  sessions: WorkoutSession[];
  exercises: ExerciseDefinition[];
  // A workout in progress from before a reload. Only read when the tracker opens.
  resumeFrom: WorkoutDraft | null;
  onFinish: () => void;
  onCancel: () => void;
}

export const LiveTracker: React.FC<LiveTrackerProps> = ({
  workoutType,
  sessions,
  exercises,
  resumeFrom,
  onFinish,
  onCancel
}) => {
  // Taken once when the tracker opens: saving this workout must not change the targets it started with.
  const [allDefinitions] = useState(exercises);
  const [history] = useState(sessions);

  // Filter exercises matching active workout split
  const workoutExercises = useMemo(() => {
    return allDefinitions.filter(e => e.workoutType === workoutType);
  }, [allDefinitions, workoutType]);

  // History does not change during a workout, so each recommendation is computed once.
  const recommendations = useMemo(
    () => {
      const logIndex = indexCompletedLogs(history, allDefinitions);
      return new Map(workoutExercises.map(ex => [ex.id, getRecommendation(ex, logsFor(logIndex, ex))]));
    },
    [workoutExercises, history, allDefinitions]
  );

  const [startTime] = useState<string>(() => resumeFrom?.startTime ?? new Date().toISOString());
  const [sessionNotes, setSessionNotes] = useState(() => resumeFrom?.sessionNotes ?? '');

  // Active exercises log state
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseSessionLog[]>(() => {
    if (resumeFrom) return resumeFrom.exerciseLogs;
    return workoutExercises.map(ex => {
      // Pre-fill working sets
      const sets: SetLog[] = Array.from({ length: ex.targetSets }).map((_, idx) => ({
        setNumber: idx + 1,
        weightKg: recommendations.get(ex.id)?.recommendedWeightKg ?? ex.defaultWeightKg,
        repsCompleted: ex.targetRepsMin,
        targetReps: `${ex.targetRepsMin}–${ex.targetRepsMax}`,
        completed: false
      }));

      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets,
        notes: ex.notes || '',
        equipment: ex.equipment
      };
    });
  });

  // Rest Timer State
  const [activeTimer, setActiveTimer] = useState<{
    id: number;
    show: boolean;
    seconds: number;
    exerciseName: string;
    nextSetNumber: number;
  }>({
    id: 0,
    show: false,
    seconds: 90,
    exerciseName: '',
    nextSetNumber: 1
  });

  // Plate Calculator Modal State
  const [plateCalc, setPlateCalc] = useState<{ weightKg: number; equipment: PlateLoaded } | null>(null);

  // Summary Celebration Modal State
  const [completedSummary, setCompletedSummary] = useState<WorkoutSession | null>(null);
  // A ref, not state: a double tap fires both clicks before React re-renders.
  const hasFinishedRef = useRef(false);

  // Keeps the screen on during the workout (phones and laptops that sleep between sets), asking
  // again when the tab comes back, because the browser drops the lock when the tab is hidden.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const requestLock = () => {
      navigator.wakeLock
        ?.request('screen')
        .then(granted => (lock = granted))
        .catch(() => {});
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') requestLock();
    };
    requestLock();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, []);

  useEffect(() => {
    if (hasFinishedRef.current) return;
    saveDraft({ version: 1, workoutType, startTime, sessionNotes, exerciseLogs });
  }, [workoutType, startTime, sessionNotes, exerciseLogs]);

  // StrictMode calls state updaters twice, so these must not mutate.
  const updateExercise = (exIdx: number, change: (log: ExerciseSessionLog) => ExerciseSessionLog) => {
    setExerciseLogs(prev => prev.map((ex, eIdx) => (eIdx === exIdx ? change(ex) : ex)));
  };

  const changeSet = (exIdx: number, setIdx: number, change: SetChange) => {
    updateExercise(exIdx, ex => ({
      ...ex,
      sets: ex.sets.map((s, sIdx) => (sIdx === setIdx ? change(s) : s))
    }));
  };

  // Toggle set completion and trigger rest timer
  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    const currentEx = exerciseLogs[exIdx];
    const currentSet = currentEx?.sets[setIdx];
    if (!currentSet) return;

    const willBeCompleted = !currentSet.completed;
    // This tap is the user gesture that lets the rest timer play its chime later.
    if (willBeCompleted) unlockAudio();

    changeSet(exIdx, setIdx, s => ({ ...s, completed: willBeCompleted }));

    // Started outside the updater, so the double call cannot start two timers.
    if (willBeCompleted) {
      const exDef = workoutExercises.find(e => e.id === currentEx.exerciseId);
      let restSecs = exDef?.defaultRestSeconds || 90;

      // Check if special 5-minute break note applies (e.g. Deadlifts to Pull Ups)
      const isLastSetOfDeadlift =
        currentEx.exerciseName.toLowerCase().includes('deadlift') &&
        setIdx === currentEx.sets.length - 1;

      if (isLastSetOfDeadlift) {
        restSecs = 300; // 5 minute transition break
      }

      const nextSetNum = setIdx + 2 <= currentEx.sets.length ? setIdx + 2 : 1;
      const nextExName =
        setIdx + 1 < currentEx.sets.length
          ? currentEx.exerciseName
          : exerciseLogs[exIdx + 1]?.exerciseName || 'Next Exercise';

      setActiveTimer({
        id: Date.now(),
        show: true,
        seconds: restSecs,
        exerciseName: nextExName,
        nextSetNumber: nextSetNum
      });
    }
  };

  const addSet = (exIdx: number) => {
    updateExercise(exIdx, ex => {
      if (ex.sets.length >= LIMITS.setNumber.max) return ex;
      const lastSet = ex.sets[ex.sets.length - 1];
      const exDef = workoutExercises.find(e => e.id === ex.exerciseId);

      const newSet: SetLog = {
        setNumber: ex.sets.length + 1,
        weightKg: lastSet ? lastSet.weightKg : exDef?.defaultWeightKg || 0,
        repsCompleted: lastSet ? lastSet.repsCompleted : exDef?.targetRepsMin || 8,
        targetReps: exDef ? `${exDef.targetRepsMin}–${exDef.targetRepsMax}` : '8–12',
        completed: false
      };

      return { ...ex, sets: [...ex.sets, newSet] };
    });
  };

  const removeLastSet = (exIdx: number) => {
    updateExercise(exIdx, ex => (ex.sets.length <= 1 ? ex : { ...ex, sets: ex.sets.slice(0, -1) }));
  };

  // Calculate volume & progress stats
  const totalSetsCount = exerciseLogs.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSetsCount = exerciseLogs.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
    0
  );
  const progressPercent = totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;

  const currentTotalVolumeKg = exerciseLogs.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sum, s) => {
        return s.completed ? sum + s.weightKg * s.repsCompleted : sum;
      }, 0)
    );
  }, 0);

  // Finish Workout
  const handleFinishWorkout = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    const endTime = new Date().toISOString();
    const completedSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      name: workoutType,
      splitType: workoutType,
      // The day the workout started, so a resumed draft or a late session past midnight keeps its day.
      date: toLocalDateString(new Date(startTime)),
      startTime,
      endTime,
      durationMinutes: workoutDurationMinutes(startTime, endTime),
      completed: true,
      totalVolumeKg: currentTotalVolumeKg,
      notes: sessionNotes,
      exercises: exerciseLogs
    };

    StorageService.saveSession(completedSession);
    clearDraft();
    setCompletedSummary(completedSession);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="min-h-screen bg-inset pb-28 text-ink-soft antialiased">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={onCancel} className="icon-btn" title="Leave workout">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <SplitBadge split={workoutType} label={`${workoutType} Day`} />
              <span className="flex items-center space-x-1 text-xs text-ink-muted font-mono">
                <Clock className="w-3.5 h-3.5 text-accent-ink" />
                <ElapsedClock startTime={startTime} />
              </span>
            </div>
          </div>

          <button
            onClick={handleFinishWorkout}
            disabled={completedSetsCount === 0 || completedSummary !== null}
            className="btn btn-good px-4 py-2 text-sm shadow-lg shadow-good/30 disabled:shadow-none"
          >
            <Check className="w-4 h-4" />
            <span>Finish Workout</span>
          </button>
        </div>

        <div className="max-w-4xl mx-auto mt-3">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
            <span>Progress: {completedSetsCount} / {totalSetsCount} sets</span>
            <span className="font-mono font-semibold text-accent-ink">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-control rounded-pill overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-hover to-good-hover transition-all duration-300 rounded-pill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6 mt-2">
        {exerciseLogs.map((exLog, exIdx) => (
          <ExerciseCard
            key={exLog.exerciseId}
            log={exLog}
            definition={workoutExercises.find(e => e.id === exLog.exerciseId)}
            recommendation={recommendations.get(exLog.exerciseId) ?? null}
            onToggleSet={setIdx => toggleSetComplete(exIdx, setIdx)}
            onChangeSet={(setIdx, change) => changeSet(exIdx, setIdx, change)}
            onAddSet={() => addSet(exIdx)}
            onRemoveLastSet={() => removeLastSet(exIdx)}
            onNotesChange={notes => updateExercise(exIdx, ex => ({ ...ex, notes }))}
            onOpenPlates={(weightKg: number, equipment: EquipmentType) => {
              if (isPlateLoaded(equipment)) setPlateCalc({ weightKg, equipment });
            }}
          />
        ))}

        <div className="card p-5 shadow-xl">
          <label className="block section-label mb-2">Workout Notes (Optional)</label>
          <textarea
            value={sessionNotes}
            onChange={e => setSessionNotes(e.target.value)}
            placeholder="How did the session feel? Energy levels, soreness, personal breakthroughs..."
            rows={3}
            maxLength={MAX_NOTES_LENGTH}
            className="field w-full bg-inset rounded-panel p-3 text-base sm:text-sm text-ink-soft"
          />
        </div>
      </main>

      {activeTimer.show && (
        <RestTimer
          key={activeTimer.id}
          initialSeconds={activeTimer.seconds}
          exerciseName={activeTimer.exerciseName}
          nextSetNumber={activeTimer.nextSetNumber}
          onFinish={() => setActiveTimer(prev => ({ ...prev, show: false }))}
          onClose={() => setActiveTimer(prev => ({ ...prev, show: false }))}
        />
      )}

      {plateCalc !== null && (
        <PlateCalculatorModal
          initialWeightKg={plateCalc.weightKg}
          equipment={plateCalc.equipment}
          onClose={() => setPlateCalc(null)}
        />
      )}

      {completedSummary && <CompletionSummary session={completedSummary} onDone={onFinish} />}
    </div>
  );
};
