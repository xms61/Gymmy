import React, { useState, useMemo } from 'react';
import { Dumbbell, Sparkles } from 'lucide-react';
import type { ExerciseDefinition, WorkoutSession } from '../../types/workout.ts';
import { getRecommendation } from '../../services/overloadEngine.ts';
import { exerciseHistory } from '../../services/progress.ts';

interface ProgressViewProps {
  exercises: ExerciseDefinition[];
  sessions: WorkoutSession[];
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  exercises,
  sessions
}) => {
  const [selectedExId, setSelectedExId] = useState<string>(exercises[0]?.id || 'flat-bench');

  const selectedExercise = useMemo(() => {
    return exercises.find(e => e.id === selectedExId) || exercises[0];
  }, [exercises, selectedExId]);

  const history = useMemo(() => {
    return selectedExercise ? exerciseHistory(selectedExercise, sessions) : [];
  }, [selectedExercise, sessions]);

  const recommendation = useMemo(() => {
    if (!selectedExercise) return null;
    return getRecommendation(selectedExercise, sessions);
  }, [selectedExercise, sessions]);

  // Overall PRs
  const personalBest = useMemo(() => {
    if (history.length === 0) return null;
    const maxWeight = Math.max(...history.map(h => h.weight));
    const max1RM = Math.max(...history.map(h => h.estimated1RM));
    return { maxWeight, max1RM };
  }, [history]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Exercise Selector Pills */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Select Exercise
        </label>
        <div className="flex flex-wrap gap-2">
          {exercises.map(ex => (
            <button
              key={ex.id}
              onClick={() => setSelectedExId(ex.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                selectedExId === ex.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Card & Overload Status */}
      {selectedExercise && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {selectedExercise.workoutType} Day
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 capitalize">{selectedExercise.equipment}</span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">{selectedExercise.name}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Target: {selectedExercise.targetSets} sets of {selectedExercise.targetRepsMin}–{selectedExercise.targetRepsMax} reps
              </p>
            </div>

            {personalBest && (
              <div className="flex items-center space-x-3">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Max Weight</div>
                  <div className="text-lg font-mono font-black text-emerald-400">{personalBest.maxWeight} kg</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Est. 1RM</div>
                  <div className="text-lg font-mono font-black text-indigo-400">{personalBest.max1RM} kg</div>
                </div>
              </div>
            )}
          </div>

          {/* Overload Guidance Banner */}
          {recommendation && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6 flex items-start space-x-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-indigo-300">Next Target Load: {recommendation.recommendedWeightKg} kg</span>
                  <span className="text-slate-400">Target Reps: {recommendation.recommendedRepRange}</span>
                </div>
                <p className="text-xs text-slate-300 font-medium mb-1.5">{recommendation.reason}</p>
                <div className="text-xs font-semibold text-emerald-400">
                  Goal: {recommendation.nextStepGoal}
                </div>
              </div>
            </div>
          )}

          {/* Progression History Table */}
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Session History Log ({history.length} recorded)
          </h3>

          {history.length === 0 ? (
            <div className="text-center py-8 bg-slate-950 rounded-2xl border border-slate-800/80">
              <Dumbbell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No session history yet for this exercise.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice().reverse().map((h, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-slate-400 font-semibold">{h.date}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold">
                      {h.sessionName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-slate-500">Weight: </span>
                      <strong className="font-mono text-white">{h.weight} kg</strong>
                    </div>

                    <div>
                      <span className="text-slate-500">Reps: </span>
                      <strong className="font-mono text-indigo-300">{h.repsString}</strong>
                    </div>

                    <div>
                      <span className="text-slate-500">Est. 1RM: </span>
                      <strong className="font-mono text-emerald-400">{h.estimated1RM} kg</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
