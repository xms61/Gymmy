import React, { useState, useMemo } from 'react';
import { Dumbbell, Sparkles } from 'lucide-react';
import type { ExerciseDefinition } from '../../types/workout.ts';
import { getRecommendation } from '../../services/overloadEngine.ts';
import { exerciseHistory } from '../../services/progress.ts';
import { logsFor, type ExerciseLogIndex } from '../../services/exerciseLogs.ts';
import { useTheme } from '../../theme/ThemeProvider.tsx';
import { formatSessionDate } from '../../utils/date.ts';

interface ProgressViewProps {
  exercises: ExerciseDefinition[];
  logIndex: ExerciseLogIndex;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  exercises,
  logIndex
}) => {
  const [selectedExId, setSelectedExId] = useState<string>(exercises[0]?.id || 'flat-bench');

  const { theme } = useTheme();
  const selectedExercise = useMemo(() => {
    return exercises.find(e => e.id === selectedExId) || exercises[0];
  }, [exercises, selectedExId]);

  const history = useMemo(() => {
    return selectedExercise ? exerciseHistory(logsFor(logIndex, selectedExercise)) : [];
  }, [selectedExercise, logIndex]);

  const recommendation = useMemo(() => {
    if (!selectedExercise) return null;
    return getRecommendation(selectedExercise, logsFor(logIndex, selectedExercise));
  }, [selectedExercise, logIndex]);

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
        <label className="block section-label mb-3">
          Select Exercise
        </label>
        <div className="flex flex-wrap gap-2">
          {exercises.map(ex => (
            <button
              key={ex.id}
              onClick={() => setSelectedExId(ex.id)}
              className={`btn px-3 py-1.5 text-xs ${
                selectedExId === ex.id
                  ? 'btn-primary shadow-lg shadow-accent/30'
                  : 'bg-surface border border-line text-ink-muted hover:text-ink-soft'
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Card & Overload Status */}
      {selectedExercise && (
        <div className="card p-6 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-accent-ink uppercase tracking-wider">
                  {selectedExercise.workoutType} Day
                </span>
                <span className="text-ink-faint">•</span>
                <span className="text-xs text-ink-muted capitalize">{selectedExercise.equipment}</span>
              </div>
              <h2 className="text-2xl font-black text-ink mt-1">{selectedExercise.name}</h2>
              <p className="text-xs text-ink-muted mt-1">
                Target: {selectedExercise.targetSets} sets of {selectedExercise.targetRepsMin}–{selectedExercise.targetRepsMax} reps
              </p>
            </div>

            {personalBest && (
              <div className="flex items-center space-x-3">
                <div className="bg-inset border border-line rounded-panel p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-ink-faint">Max Weight</div>
                  <div className="record-value text-lg font-mono font-black text-good-ink">{personalBest.maxWeight} kg</div>
                </div>
                <div className="bg-inset border border-line rounded-panel p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-ink-faint">Est. 1RM</div>
                  <div className="record-value text-lg font-mono font-black text-accent-ink">{personalBest.max1RM} kg</div>
                </div>
              </div>
            )}
          </div>

          {/* Overload Guidance Banner */}
          {recommendation && (
            <div className="bg-inset border border-line rounded-panel p-4 mb-6 flex items-start space-x-3">
              <div className="p-2 bg-accent-ink/10 text-accent-ink rounded-control mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-accent-ink">Next Target Load: {recommendation.recommendedWeightKg} kg</span>
                  <span className="text-ink-muted">Target Reps: {recommendation.recommendedRepRange}</span>
                </div>
                <p className="text-xs text-ink-soft font-medium mb-1.5">{recommendation.reason}</p>
                <div className="text-xs font-semibold text-good-ink">
                  Goal: {recommendation.nextStepGoal}
                </div>
              </div>
            </div>
          )}

          {/* Progression History Table */}
          <h3 className="section-label mb-3">
            Session History Log ({history.length} recorded)
          </h3>

          {history.length === 0 ? (
            <div className="text-center py-8 bg-inset rounded-panel border border-line">
              <Dumbbell className="w-8 h-8 text-ink-faint mx-auto mb-2" />
              <p className="text-xs text-ink-muted">No session history yet for this exercise.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice().reverse().map((h, idx) => (
                <div
                  key={idx}
                  className="bg-inset border border-line rounded-panel p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-ink-muted font-semibold">{formatSessionDate(h.date, theme.traits.dates)}</span>
                    <span className="px-2 py-0.5 bg-control text-ink-soft rounded-chip font-semibold">
                      {h.sessionName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-ink-faint">Weight: </span>
                      <strong className="font-mono text-ink">{h.weight} kg</strong>
                    </div>

                    <div>
                      <span className="text-ink-faint">Reps: </span>
                      <strong className="font-mono text-accent-ink">{h.repsString}</strong>
                    </div>

                    <div>
                      <span className="text-ink-faint">Est. 1RM: </span>
                      <strong className="font-mono text-good-ink">{h.estimated1RM} kg</strong>
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
