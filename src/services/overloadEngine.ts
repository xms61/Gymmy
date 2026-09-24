// Progressive overload rules (double progression) and 1RM estimates. Which loads exist, and
// which one comes next, is decided by loading.ts from the home equipment.
import type { EquipmentType, ExerciseDefinition, ProgressRecommendation, SetLog, WorkoutSession } from '../types/workout.ts';
import { completedExerciseLogs, type CompletedExerciseLog } from './exerciseLogs.ts';
import { lightestLoad, nearestLoad, stepLoad } from './loading.ts';

const DELOAD_FACTOR = 0.9;

type Advice = Omit<ProgressRecommendation, 'exerciseId' | 'exerciseName' | 'recommendedRepRange'>;

export function getRecommendation(exercise: ExerciseDefinition, history: WorkoutSession[]): ProgressRecommendation {
  const logs = completedExerciseLogs(exercise, history);
  const advice = logs.length === 0 ? adviceForFirstSession(exercise) : adviceFromHistory(exercise, logs);
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    recommendedRepRange: `${exercise.targetRepsMin}–${exercise.targetRepsMax}`,
    ...advice
  };
}

function adviceForFirstSession(exercise: ExerciseDefinition): Advice {
  const { targetSets, targetRepsMin, targetRepsMax, defaultWeightKg } = exercise;
  return {
    status: 'maintain',
    currentWeightKg: defaultWeightKg,
    recommendedWeightKg: defaultWeightKg,
    reason: 'First logged session. Focus on clean technique through the target rep range.',
    lastRepsSummary: 'No previous logs',
    nextStepGoal: `Complete ${targetSets} sets of ${targetRepsMin}–${targetRepsMax} reps at ${defaultWeightKg} kg.`
  };
}

// logs is oldest first, and every log has at least one set.
function adviceFromHistory(exercise: ExerciseDefinition, logs: CompletedExerciseLog[]): Advice {
  const { targetSets, targetRepsMin: min, targetRepsMax: max, equipment } = exercise;
  const sets = logs[logs.length - 1].sets;
  const weight = sets[0].weightKg;
  const summary = sets.map(s => s.repsCompleted).join(' / ');
  const hold = (reason: string, nextStepGoal: string): Advice => ({
    status: 'progress_reps',
    currentWeightKg: weight,
    recommendedWeightKg: weight,
    lastRepsSummary: summary,
    reason,
    nextStepGoal
  });

  if (sets.length >= targetSets && sets.every(s => s.repsCompleted >= max)) {
    const next = stepLoad(weight, equipment, 1);
    if (next === null) {
      return hold(
        `Every set reached the top of the range (${max} reps), and ${weight} kg is the heaviest load your equipment makes.`,
        `Stay at ${weight} kg and add reps beyond ${max}.`
      );
    }
    return {
      status: 'increase_load',
      currentWeightKg: weight,
      recommendedWeightKg: next,
      lastRepsSummary: summary,
      reason: `Every set reached the top of the range (${max} reps). Add ${formatKg(next - weight)} kg.`,
      nextStepGoal: `Increase the load to ${next} kg and aim for at least ${min} reps on every set.`
    };
  }

  // Trends are read only across sessions at this weight: reps at another load aren't comparable.
  const averages = logsAtWeight(logs, weight).map(log => averageReps(log.sets));
  const trend = averages.slice(-3).map(formatAverage).join(' → ');

  // Falling performance is the fatigue signal coaches deload on (Bell et al. 2023 Delphi
  // consensus; Rogerson et al. 2024 survey). Being below the range while reps rise is not.
  if (isDeclining(averages)) {
    const deload = deloadWeight(weight, equipment);
    if (deload < weight) {
      return {
        status: 'deload',
        currentWeightKg: weight,
        recommendedWeightKg: deload,
        lastRepsSummary: summary,
        reason: `Average reps dropped in each of the last two sessions at ${weight} kg (${trend}). That points to fatigue: drop about 10 % for a week, then build back up.`,
        nextStepGoal: `Train at ${deload} kg for a week with strict form.`
      };
    }
    return hold(
      `Average reps dropped in each of the last two sessions (${trend}), and ${weight} kg is already the lowest load.`,
      `Take an easier week at ${weight} kg with fewer sets.`
    );
  }

  if (isStuckBelowRange(averages, min)) {
    const lighter = stepLoad(weight, equipment, -1);
    if (lighter !== null) {
      return {
        status: 'reduce_load',
        currentWeightKg: weight,
        recommendedWeightKg: lighter,
        lastRepsSummary: summary,
        reason: `Average reps have stayed below ${min} for three sessions at ${weight} kg (${trend}). This weight is too heavy for the ${min}–${max} range.`,
        nextStepGoal: `Use ${lighter} kg and work up through ${min}–${max} reps.`
      };
    }
    return hold(
      `Average reps have stayed below ${min} for three sessions (${trend}), and ${weight} kg is already the lowest load.`,
      `Stay at ${weight} kg and aim for ${min} reps on every set.`
    );
  }

  if (sets[0].repsCompleted >= max) {
    return hold(
      `The first set reached ${sets[0].repsCompleted} reps, but later sets dropped (${summary}). Keep the load until they catch up.`,
      `Stay at ${weight} kg and push the later sets closer to ${max} reps.`
    );
  }

  const totalReps = sets.reduce((sum, s) => sum + s.repsCompleted, 0);
  const goal = `Stay at ${weight} kg and aim for at least ${totalReps + 2} total reps.`;
  if (averageReps(sets) < min) {
    return hold(
      `Reps are below the ${min}–${max} range (${summary}). Keep the load while they climb; three flat sessions below the range suggest a lighter weight.`,
      goal
    );
  }
  return hold(`Reps are within the target range (${summary}). Double progression adds reps before weight.`, goal);
}

function averageReps(sets: SetLog[]): number {
  return sets.reduce((sum, s) => sum + s.repsCompleted, 0) / sets.length;
}

// The most recent run of sessions at this weight, oldest first.
function logsAtWeight(logs: CompletedExerciseLog[], weightKg: number): CompletedExerciseLog[] {
  let start = logs.length;
  while (start > 0 && logs[start - 1].sets[0].weightKg === weightKg) start--;
  return logs.slice(start);
}

// Average reps fell in each of the last two sessions.
function isDeclining(averages: number[]): boolean {
  const [a, b, c] = averages.slice(-3);
  return c !== undefined && b < a && c < b;
}

// Three sessions below the minimum with no gain from the first to the last.
function isStuckBelowRange(averages: number[], minReps: number): boolean {
  const lastThree = averages.slice(-3);
  return lastThree.length === 3 && lastThree.every(avg => avg < minReps) && lastThree[2] <= lastThree[0];
}

function formatAverage(average: number): string {
  return String(Math.round(average * 10) / 10);
}

function formatKg(weightKg: number): string {
  return String(Math.round(weightKg * 100) / 100);
}

// About 10 % lighter, at least one step lighter, never below the equipment's lightest load.
// Returns weightKg itself when nothing lighter can be made.
function deloadWeight(weightKg: number, equipment: EquipmentType): number {
  const oneStepLighter = stepLoad(weightKg, equipment, -1);
  if (oneStepLighter === null) return weightKg;
  const tenPercentLighter = nearestLoad(weightKg * DELOAD_FACTOR, equipment);
  return Math.max(lightestLoad(equipment), Math.min(tenPercentLighter, oneStepLighter));
}

// Brzycki formula.
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  if (reps >= 37) return Math.round(weightKg * 1.5);
  return Math.round(weightKg * (36 / (37 - reps)) * 10) / 10;
}
