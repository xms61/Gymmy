import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Check, 
  Clock, 
  Flame, 
  Info, 
  Plus, 
  Trash2, 
  Trophy, 
  TrendingUp, 
  Calculator,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ExerciseSessionLog, SetLog, SplitType, WorkoutDraft, WorkoutSession } from '../../types/workout.ts';
import { getRecommendation } from '../../services/overloadEngine.ts';
import { StorageService } from '../../services/storage.ts';
import { RestTimer } from './RestTimer.tsx';
import { PlateCalculatorModal } from './PlateCalculatorModal.tsx';
import { ElapsedClock } from './ElapsedClock.tsx';
import { workoutDurationMinutes } from './workoutTime.ts';
import { toLocalDateString } from '../../utils/date.ts';
import { clearDraft, saveDraft } from './workoutDraft.ts';

interface LiveTrackerProps {
  workoutType: SplitType;
  // A workout in progress from before a reload. Only read when the tracker opens.
  resumeFrom: WorkoutDraft | null;
  onFinish: () => void;
  onCancel: () => void;
}

export const LiveTracker: React.FC<LiveTrackerProps> = ({
  workoutType,
  resumeFrom,
  onFinish,
  onCancel
}) => {
  // Load existing definitions & history
  const allDefinitions = useMemo(() => StorageService.getExerciseDefinitions(), []);
  const history = useMemo(() => StorageService.getSessions(), []);

  // Filter exercises matching active workout split
  const workoutExercises = useMemo(() => {
    return allDefinitions.filter(e => e.workoutType === workoutType);
  }, [allDefinitions, workoutType]);

  // History does not change during a workout, so each recommendation is computed once.
  const recommendations = useMemo(
    () => new Map(workoutExercises.map(ex => [ex.id, getRecommendation(ex, history)])),
    [workoutExercises, history]
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
  const [plateCalcWeight, setPlateCalcWeight] = useState<number | null>(null);

  // Summary Celebration Modal State
  const [completedSummary, setCompletedSummary] = useState<WorkoutSession | null>(null);
  // A ref, not state: a double tap fires both clicks before React re-renders.
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    if (hasFinishedRef.current) return;
    saveDraft({ version: 1, workoutType, startTime, sessionNotes, exerciseLogs });
  }, [workoutType, startTime, sessionNotes, exerciseLogs]);

  // Toggle set completion and trigger rest timer
  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    const currentEx = exerciseLogs[exIdx];
    const currentSet = currentEx?.sets[setIdx];
    if (!currentSet) return;

    const willBeCompleted = !currentSet.completed;

    // 1. Pure immutable state update (no mutation, works seamlessly in StrictMode)
    setExerciseLogs(prev =>
      prev.map((ex, eIdx) => {
        if (eIdx !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) => {
            if (sIdx !== setIdx) return s;
            return { ...s, completed: willBeCompleted };
          })
        };
      })
    );

    // 2. Trigger Rest Timer ONLY if marking completed (outside state updater)
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

  const updateSetWeight = (exIdx: number, setIdx: number, delta: number) => {
    setExerciseLogs(prev =>
      prev.map((ex, eIdx) => {
        if (eIdx !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) => {
            if (sIdx !== setIdx) return s;
            const newWeight = Math.max(0, Math.round((s.weightKg + delta) * 100) / 100);
            return { ...s, weightKg: newWeight };
          })
        };
      })
    );
  };

  const setExactSetWeight = (exIdx: number, setIdx: number, val: number) => {
    setExerciseLogs(prev =>
      prev.map((ex, eIdx) => {
        if (eIdx !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) => {
            if (sIdx !== setIdx) return s;
            return { ...s, weightKg: Math.max(0, isNaN(val) ? 0 : val) };
          })
        };
      })
    );
  };

  const updateSetReps = (exIdx: number, setIdx: number, delta: number) => {
    setExerciseLogs(prev =>
      prev.map((ex, eIdx) => {
        if (eIdx !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) => {
            if (sIdx !== setIdx) return s;
            return { ...s, repsCompleted: Math.max(0, s.repsCompleted + delta) };
          })
        };
      })
    );
  };

  const setExactSetReps = (exIdx: number, setIdx: number, val: number) => {
    setExerciseLogs(prev =>
      prev.map((ex, eIdx) => {
        if (eIdx !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) => {
            if (sIdx !== setIdx) return s;
            return { ...s, repsCompleted: Math.max(0, isNaN(val) ? 0 : val) };
          })
        };
      })
    );
  };

  const addSet = (exIdx: number) => {
    setExerciseLogs(prev =>
      prev.map((ex, eIdx) => {
        if (eIdx !== exIdx) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSetNumber = ex.sets.length + 1;
        const exDef = workoutExercises.find(e => e.id === ex.exerciseId);

        const newSet: SetLog = {
          setNumber: newSetNumber,
          weightKg: lastSet ? lastSet.weightKg : exDef?.defaultWeightKg || 0,
          repsCompleted: lastSet ? lastSet.repsCompleted : exDef?.targetRepsMin || 8,
          targetReps: exDef ? `${exDef.targetRepsMin}–${exDef.targetRepsMax}` : '8–12',
          completed: false
        };

        return {
          ...ex,
          sets: [...ex.sets, newSet]
        };
      })
    );
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExerciseLogs(prev =>
      prev.map((ex, eIdx) => {
        if (eIdx !== exIdx) return ex;
        if (ex.sets.length <= 1) return ex;
        const filtered = ex.sets.filter((_, idx) => idx !== setIdx);
        const reindexed = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        return {
          ...ex,
          sets: reindexed
        };
      })
    );
  };

  const updateExerciseNotes = (exIdx: number, notes: string) => {
    setExerciseLogs(prev =>
      prev.map((ex, eIdx) => {
        if (eIdx !== exIdx) return ex;
        return { ...ex, notes };
      })
    );
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

    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Workout Split Accent Colors
  const splitTheme = {
    Push: { badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40', accent: 'text-orange-400' },
    Pull: { badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', accent: 'text-emerald-400' },
    Legs: { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40', accent: 'text-blue-400' },
    Other: { badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40', accent: 'text-indigo-400' }
  }[workoutType];

  return (
    <div className="min-h-screen bg-slate-950 pb-28 text-slate-100 antialiased">
      {/* Top Floating Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title="Leave workout"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${splitTheme.badge}`}>
                  {workoutType} Day
                </span>
                <span className="flex items-center space-x-1 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <ElapsedClock startTime={startTime} />
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleFinishWorkout}
            disabled={completedSetsCount === 0 || completedSummary !== null}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition active:scale-95 ${
              completedSetsCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Finish Workout</span>
          </button>
        </div>

        {/* Workout Progress Bar */}
        <div className="max-w-4xl mx-auto mt-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Progress: {completedSetsCount} / {totalSetsCount} sets</span>
            <span className="font-mono font-semibold text-indigo-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-4 space-y-6 mt-2">
        {exerciseLogs.map((exLog, exIdx) => {
          const exDef = workoutExercises.find(e => e.id === exLog.exerciseId);
          const recommendation = recommendations.get(exLog.exerciseId) ?? null;

          return (
            <div
              key={exLog.exerciseId}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl transition hover:border-slate-700/80 relative overflow-hidden"
            >
              {/* Exercise Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-black text-white tracking-tight">{exLog.exerciseName}</h3>
                    {exDef?.equipment === 'barbell' && (
                      <button
                        onClick={() => {
                          const firstWeight = exLog.sets[0]?.weightKg || exDef?.defaultWeightKg || 60;
                          setPlateCalcWeight(firstWeight);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                        title="Calculate Barbell Plates"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Plates</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
                    <span className="capitalize font-medium text-slate-300">{exLog.equipment || 'Gym Exercise'}</span>
                    <span>•</span>
                    <span>Target: <strong className="text-slate-200">{exDef?.targetRepsMin}–{exDef?.targetRepsMax} reps</strong></span>
                    <span>•</span>
                    <span>Rest: <strong className="text-indigo-400">{exDef?.defaultRestSeconds || 90}s</strong></span>
                  </div>
                </div>

                {/* Overload Status Pill */}
                {recommendation && (
                  <div className="flex items-center space-x-2">
                    {recommendation.status === 'increase_load' && (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center space-x-1 animate-pulse">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Weight Up Ready!</span>
                      </span>
                    )}
                    {recommendation.status === 'progress_reps' && (
                      <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-xs font-bold flex items-center space-x-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Rep Goal Active</span>
                      </span>
                    )}
                    {recommendation.status === 'deload' && (
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold flex items-center space-x-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>Deload Advised</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Progressive Overload Guidance Card */}
              {recommendation && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 mb-5 flex items-start space-x-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span>Last Performance: <strong className="text-slate-200">{recommendation.lastRepsSummary}</strong></span>
                      <span>Target: <strong className="text-indigo-300">{recommendation.recommendedWeightKg} kg</strong></span>
                    </div>
                    <p className="text-slate-300 font-medium leading-relaxed">{recommendation.nextStepGoal}</p>
                  </div>
                </div>
              )}

              {/* Special Notes banner if present (e.g., Pull-Up 5 min break or standing) */}
              {exDef?.notes && (
                <div className="mb-4 text-xs font-medium text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 flex items-center space-x-2">
                  <Info className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  <span>{exDef.notes}</span>
                </div>
              )}

              {/* Sets Table */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 px-2">
                  <div className="col-span-2 text-center">Set</div>
                  <div className="col-span-4 text-center">Load (kg)</div>
                  <div className="col-span-4 text-center">Reps</div>
                  <div className="col-span-2 text-center">Done</div>
                </div>

                {exLog.sets.map((set, setIdx) => {
                  return (
                    <div
                      key={set.setNumber}
                      className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl border transition-all ${
                        set.completed
                          ? 'bg-emerald-950/20 border-emerald-600/40'
                          : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Set Number */}
                      <div className="col-span-2 text-center">
                        <span className={`w-8 h-8 rounded-xl font-mono font-bold text-sm flex items-center justify-center mx-auto ${
                          set.completed ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {set.setNumber}
                        </span>
                      </div>

                      {/* Weight Steppers */}
                      <div className="col-span-4 flex items-center justify-center space-x-1">
                        <button
                          onClick={() => updateSetWeight(exIdx, setIdx, -2.5)}
                          className="w-7 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition active:scale-95"
                          title="-2.5 kg"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          value={set.weightKg === 0 ? '' : set.weightKg}
                          onChange={e => setExactSetWeight(exIdx, setIdx, parseFloat(e.target.value))}
                          className="w-14 h-8 bg-slate-900 border border-slate-700/60 rounded-lg text-center font-mono font-bold text-sm text-white focus:border-indigo-500 focus:outline-none"
                          placeholder="0"
                        />
                        <button
                          onClick={() => updateSetWeight(exIdx, setIdx, 2.5)}
                          className="w-7 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition active:scale-95"
                          title="+2.5 kg"
                        >
                          +
                        </button>
                      </div>

                      {/* Reps Steppers */}
                      <div className="col-span-4 flex items-center justify-center space-x-1">
                        <button
                          onClick={() => updateSetReps(exIdx, setIdx, -1)}
                          className="w-7 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition active:scale-95"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={set.repsCompleted === 0 ? '' : set.repsCompleted}
                          onChange={e => setExactSetReps(exIdx, setIdx, parseInt(e.target.value) || 0)}
                          className="w-12 h-8 bg-slate-900 border border-slate-700/60 rounded-lg text-center font-mono font-bold text-sm text-white focus:border-indigo-500 focus:outline-none"
                          placeholder="0"
                        />
                        <button
                          onClick={() => updateSetReps(exIdx, setIdx, 1)}
                          className="w-7 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition active:scale-95"
                        >
                          +
                        </button>
                      </div>

                      {/* Checkmark Button */}
                      <div className="col-span-2 flex items-center justify-center">
                        <button
                          onClick={() => toggleSetComplete(exIdx, setIdx)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                            set.completed
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Check className={`w-5 h-5 ${set.completed ? 'stroke-[3]' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Set Management Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => addSet(exIdx)}
                  className="flex items-center space-x-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Set</span>
                </button>

                {exLog.sets.length > 1 && (
                  <button
                    onClick={() => removeSet(exIdx, exLog.sets.length - 1)}
                    className="flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-rose-400 py-1 px-2 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Set</span>
                  </button>
                )}
              </div>

              {/* Individual Exercise Note Input */}
              <div className="mt-3 pt-2">
                <input
                  type="text"
                  value={exLog.notes || ''}
                  onChange={e => updateExerciseNotes(exIdx, e.target.value)}
                  placeholder="Notes for this exercise (e.g., grip, form cues, RPE)..."
                  className="w-full bg-slate-950/60 border border-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          );
        })}

        {/* Workout Session Notes */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Workout Notes (Optional)
          </label>
          <textarea
            value={sessionNotes}
            onChange={e => setSessionNotes(e.target.value)}
            placeholder="How did the session feel? Energy levels, soreness, personal breakthroughs..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </main>

      {/* Rest Timer Modal / Floating Widget */}
      {activeTimer.show && (
        <RestTimer
          key={activeTimer.id}
          totalSeconds={activeTimer.seconds}
          initialSeconds={activeTimer.seconds}
          exerciseName={activeTimer.exerciseName}
          nextSetNumber={activeTimer.nextSetNumber}
          onFinish={() => setActiveTimer(prev => ({ ...prev, show: false }))}
          onClose={() => setActiveTimer(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* Plate Calculator Modal */}
      {plateCalcWeight !== null && (
        <PlateCalculatorModal
          initialWeightKg={plateCalcWeight}
          onClose={() => setPlateCalcWeight(null)}
        />
      )}

      {/* Workout Completion Summary Modal */}
      {completedSummary && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20">
              <Trophy className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight mb-1">Workout Crushed!</h2>
            <p className="text-sm text-slate-400 mb-6">
              Great consistency! Your progress has been logged and your calendar updated.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
                <div className="text-xs text-slate-400 font-semibold mb-1">Duration</div>
                <div className="text-xl font-mono font-black text-white">{completedSummary.durationMinutes} min</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
                <div className="text-xs text-slate-400 font-semibold mb-1">Total Volume</div>
                <div className="text-xl font-mono font-black text-emerald-400">
                  {completedSummary.totalVolumeKg.toLocaleString()} kg
                </div>
              </div>
            </div>

            <button
              onClick={onFinish}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition active:scale-95"
            >
              View Calendar & Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
