import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
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
import { RestIdle, RestTimer } from './RestTimer.tsx';
import { PlateCalculatorModal } from './PlateCalculatorModal.tsx';
import { ElapsedClock } from './ElapsedClock.tsx';
import { ExerciseBoard } from './ExerciseBoard.tsx';
import { SessionBoard } from './SessionBoard.tsx';
import { CompletionSummary } from './CompletionSummary.tsx';
import { steppedWeight, type SetChange } from './SetControls.tsx';
import { CommandLine } from './CommandLine.tsx';
import { COMMAND_HELP, lastDoneSet, moveCursor, nextOpenSet, parseSetCommand, type SetCommand, type SetPosition } from './setCommand.ts';
import { formatReps, withRir } from '../../services/effort.ts';
import { isShortcutFree } from '../keyboardShortcuts.ts';
import { workoutDurationMinutes } from './workoutTime.ts';
import { formatSessionDate, toLocalDateString } from '../../utils/date.ts';
import { unlockAudio } from '../../utils/audio.ts';
import { clearDraft, saveDraft } from './workoutDraft.ts';
import { RouteMarker } from '../ui/badges.tsx';
import { askToConfirm } from '../ui/ConfirmHost.tsx';
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
  const progress = useMemo(() => {
    const logIndex = indexCompletedLogs(history, allDefinitions);
    return new Map(
      workoutExercises.map(ex => {
        const logs = logsFor(logIndex, ex);
        return [ex.id, getRecommendation(ex, logs)];
      })
    );
  }, [workoutExercises, history, allDefinitions]);

  const [startTime] = useState<string>(() => resumeFrom?.startTime ?? new Date().toISOString());
  const [sessionNotes, setSessionNotes] = useState(() => resumeFrom?.sessionNotes ?? '');

  // Active exercises log state
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseSessionLog[]>(() => {
    if (resumeFrom) return resumeFrom.exerciseLogs;
    return workoutExercises.map(ex => {
      // Pre-fill working sets
      const sets: SetLog[] = Array.from({ length: ex.targetSets }).map((_, idx) => ({
        setNumber: idx + 1,
        weightKg: progress.get(ex.id)?.recommendedWeightKg ?? ex.defaultWeightKg,
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
  const [activeTimer, setActiveTimer] = useState<{ id: number; show: boolean; seconds: number }>({
    id: 0,
    show: false,
    seconds: 90
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

      const afterThis = exerciseLogs.map((ex, eIdx) =>
        eIdx === exIdx ? { ...ex, sets: ex.sets.map((s, sIdx) => (sIdx === setIdx ? { ...s, completed: true } : s)) } : ex
      );
      const next = nextOpenSet(afterThis, exIdx) ?? nextOpenSet(afterThis, 0);
      if (next) setCursor(next);

      setActiveTimer({ id: Date.now(), show: true, seconds: restSecs });
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

  // The set on the board. Logging a set moves it to the next open set.
  const [cursor, setCursor] = useState<SetPosition>(() => (resumeFrom && nextOpenSet(resumeFrom.exerciseLogs, 0)) || { exerciseIndex: 0, setIndex: 0 });
  const commandInputRef = useRef<HTMLInputElement>(null);
  const [commandOutput, setCommandOutput] = useState<string[]>([]);

  const equipmentOf = (log: ExerciseSessionLog): EquipmentType =>
    workoutExercises.find(e => e.id === log.exerciseId)?.equipment ?? log.equipment ?? 'barbell';

  const runCommand = (text: string) => {
    const parsed = parseSetCommand(text);
    setCommandOutput([`> ${text.trim()}`, ...(parsed.ok ? applyCommand(parsed.command) : [parsed.message])]);
  };

  const applyCommand = (command: SetCommand): string[] => {
    const focused = exerciseLogs[cursor.exerciseIndex];
    switch (command.kind) {
      case 'log':
      case 'step':
      case 'done':
        return applyToOpenSet(command);
      case 'undo': {
        const target = lastDoneSet(exerciseLogs, cursor.exerciseIndex);
        if (!target) return ['no done set to undo'];
        toggleSetComplete(target.exerciseIndex, target.setIndex);
        setCursor(target);
        return [`${exerciseLogs[target.exerciseIndex]?.exerciseName} set ${target.setIndex + 1} not done`];
      }
      case 'focus': {
        const exerciseIndex = Math.min(exerciseLogs.length - 1, Math.max(0, cursor.exerciseIndex + command.direction));
        setCursor({ exerciseIndex, setIndex: 0 });
        return [exerciseLogs[exerciseIndex]?.exerciseName ?? ''];
      }
      case 'rest':
        setActiveTimer({ id: Date.now(), show: true, seconds: command.seconds });
        return [`rest ${command.seconds} s`];
      case 'skipRest':
        setActiveTimer(prev => ({ ...prev, show: false }));
        return ['rest skipped'];
      case 'plates': {
        const equipment = focused && equipmentOf(focused);
        if (!focused || !equipment || !isPlateLoaded(equipment)) return ['no plates for this exercise'];
        setPlateCalc({ weightKg: focused.sets[0]?.weightKg ?? 0, equipment });
        return [];
      }
      case 'note':
        updateExercise(cursor.exerciseIndex, ex => ({ ...ex, notes: command.text.slice(0, MAX_NOTES_LENGTH) }));
        return [`note saved for ${focused?.exerciseName}`];
      case 'finish':
        if (completedSetsCount === 0) return ['log a set first'];
        void askToConfirm('Finish this workout and save it?', 'Finish', { danger: false }).then(confirmed => confirmed && handleFinishWorkout());
        return [];
      case 'leave':
        onCancel();
        return [];
      case 'help':
        return COMMAND_HELP.map(([example, does]) => `${example.padEnd(18)} ${does}`);
    }
  };

  const applyToOpenSet = (command: Extract<SetCommand, { kind: 'log' | 'step' | 'done' }>): string[] => {
    const target = nextOpenSet(exerciseLogs, cursor.exerciseIndex);
    if (!target) return ['every set is done'];
    const log = exerciseLogs[target.exerciseIndex];
    const current = log?.sets[target.setIndex];
    if (!log || !current) return ['every set is done'];
    const updated = updatedSet(current, command, equipmentOf(log));
    changeSet(target.exerciseIndex, target.setIndex, () => updated);
    const markDone = command.kind === 'done' || (command.kind === 'log' && command.markDone);
    if (markDone) toggleSetComplete(target.exerciseIndex, target.setIndex);
    else setCursor(target);
    return [`${log.exerciseName} set ${target.setIndex + 1}: ${updated.weightKg} kg × ${formatReps(updated)}${markDone ? ', done' : ''}`];
  };

  // "/" or ":" jumps to the prompt, j and k move the set cursor, and Space ticks the set under it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isShortcutFree(event)) return;
      if (event.key === '/' || event.key === ':') {
        event.preventDefault();
        commandInputRef.current?.focus();
      } else if (event.key === 'j' || event.key === 'k') {
        setCursor(moveCursor(exerciseLogs, cursor, event.key === 'j' ? 1 : -1));
      } else if (event.key === ' ') {
        event.preventDefault();
        toggleSetComplete(cursor.exerciseIndex, cursor.setIndex);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });
  // Finish needs at least one done set, and the saved session records its volume.
  const completedSetsCount = exerciseLogs.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
    0
  );

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
  };

  const boardIndex = Math.min(cursor.exerciseIndex, exerciseLogs.length - 1);
  const boardLog = exerciseLogs[boardIndex];
  const boardDefinition = boardLog && workoutExercises.find(e => e.id === boardLog.exerciseId);
  const selectSet = (exerciseIndex: number, setIndex: number) => setCursor({ exerciseIndex, setIndex });
  const selectExercise = (exerciseIndex: number) => {
    const sets = exerciseLogs[exerciseIndex]?.sets ?? [];
    selectSet(exerciseIndex, Math.max(0, sets.findIndex(s => !s.completed)));
  };

  return (
    <div className="h-screen flex flex-col bg-bg text-ink-soft">
      <header className="flex-none bg-accent text-on-accent">
        <div className="max-w-[90rem] mx-auto h-16 px-6 flex items-center gap-3">
          <button onClick={onCancel} title="Leave workout" aria-label="Leave workout" className="p-2 rounded-control hover:bg-on-accent/10">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <RouteMarker split={workoutType} />
          <h1 className="text-3xl leading-none">{workoutType}</h1>
          <span className="font-display text-lg font-semibold uppercase tracking-[0.04em]">
            {formatSessionDate(toLocalDateString(new Date(startTime)))}
          </span>
          <span title="Time since the workout started" className="ml-auto font-mono text-xl font-semibold">
            <ElapsedClock startTime={startTime} />
          </span>
          <button
            onClick={handleFinishWorkout}
            disabled={completedSetsCount === 0 || completedSummary !== null}
            title={completedSetsCount === 0 ? 'Log a set first' : 'Finish and save the workout'}
            className="btn h-11 px-5 text-lg bg-on-accent text-accent hover:bg-on-accent/85 disabled:bg-on-accent/20 disabled:text-on-accent/60"
          >
            Finish
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[90rem] mx-auto px-6 py-8 grid content-start gap-10 grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] xl:gap-12">
          {boardLog && (
            <ExerciseBoard
              key={boardLog.exerciseId}
              log={boardLog}
              definition={boardDefinition}
              recommendation={progress.get(boardLog.exerciseId) ?? null}
              setIndex={boardIndex === cursor.exerciseIndex ? cursor.setIndex : 0}
              onSelectSet={setIdx => selectSet(boardIndex, setIdx)}
              onToggleSet={setIdx => toggleSetComplete(boardIndex, setIdx)}
              onChangeSet={(setIdx, change) => changeSet(boardIndex, setIdx, change)}
              onAddSet={() => addSet(boardIndex)}
              onRemoveLastSet={() => removeLastSet(boardIndex)}
              onNotesChange={notes => updateExercise(boardIndex, ex => ({ ...ex, notes }))}
              onOpenPlates={(weightKg: number, equipment: EquipmentType) => {
                if (isPlateLoaded(equipment)) setPlateCalc({ weightKg, equipment });
              }}
            />
          )}
  
          <aside className="grid gap-8 content-start">
            {activeTimer.show ? (
              <RestTimer
                key={activeTimer.id}
                initialSeconds={activeTimer.seconds}
                onFinish={() => setActiveTimer(prev => ({ ...prev, show: false }))}
                onSkip={() => setActiveTimer(prev => ({ ...prev, show: false }))}
              />
            ) : (
              <RestIdle seconds={boardDefinition?.defaultRestSeconds || 90} />
            )}
  
            <SessionBoard logs={exerciseLogs} current={boardIndex} onSelect={selectExercise} />
  
            <label className="grid gap-2">
              <span className="section-label">Workout notes</span>
              <textarea
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                placeholder="Energy, soreness, anything worth remembering"
                rows={3}
                maxLength={MAX_NOTES_LENGTH}
                className="field w-full p-3 text-base text-ink-soft"
              />
            </label>
          </aside>
        </div>
      </main>

      {plateCalc !== null && (
        <PlateCalculatorModal
          initialWeightKg={plateCalc.weightKg}
          equipment={plateCalc.equipment}
          onClose={() => setPlateCalc(null)}
        />
      )}

      <CommandLine output={commandOutput} inputRef={commandInputRef} onSubmit={runCommand} />

      {completedSummary && <CompletionSummary session={completedSummary} onDone={onFinish} />}
    </div>
  );
};


function updatedSet(set: SetLog, command: Extract<SetCommand, { kind: 'log' | 'step' | 'done' }>, equipment: EquipmentType): SetLog {
  if (command.kind === 'done') return set;
  if (command.kind === 'step') return { ...set, weightKg: steppedWeight(set.weightKg, equipment, command.direction) };
  const changed = { ...set, weightKg: command.weightKg ?? set.weightKg, repsCompleted: command.reps ?? set.repsCompleted };
  return command.rir === undefined ? changed : withRir(changed, command.rir);
}
