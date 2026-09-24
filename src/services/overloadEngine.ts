// Progressive overload rules (double progression), 1RM estimates and plate maths.
import type { EquipmentType, ExerciseDefinition, ProgressRecommendation, SetLog, WorkoutSession } from '../types/workout.ts';
import { completedExerciseLogs, type CompletedExerciseLog } from './exerciseLogs.ts';

// stepKg is the smallest load change to suggest. minKg is the lowest load a deload may
// suggest: an empty Olympic bar, or no added weight for bodyweight lifts.
const LOADING: Record<EquipmentType, { stepKg: number; minKg: number }> = {
  barbell: { stepKg: 2.5, minKg: 20 },
  dumbbell: { stepKg: 2, minKg: 2 },
  machine: { stepKg: 2.5, minKg: 2.5 },
  cable: { stepKg: 2.5, minKg: 2.5 },
  bodyweight: { stepKg: 2.5, minKg: 0 }
};

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
    const { stepKg } = LOADING[equipment];
    const next = roundToStep(weight + stepKg, stepKg);
    return {
      status: 'increase_load',
      currentWeightKg: weight,
      recommendedWeightKg: next,
      lastRepsSummary: summary,
      reason: `Every set reached the top of the range (${max} reps). Add ${stepKg} kg.`,
      nextStepGoal: `Increase the load to ${next} kg and aim for at least ${min} reps on every set.`
    };
  }

  if (sets[0].repsCompleted >= max) {
    return hold(
      `The first set reached ${sets[0].repsCompleted} reps, but later sets dropped (${summary}). Keep the load until they catch up.`,
      `Stay at ${weight} kg and push the later sets closer to ${max} reps.`
    );
  }

  const lastTwo = logs.slice(-2);
  if (lastTwo.length === 2 && lastTwo.every(log => averageReps(log.sets) < min)) {
    const deload = deloadWeight(weight, equipment);
    if (deload < weight) {
      return {
        status: 'deload',
        currentWeightKg: weight,
        recommendedWeightKg: deload,
        lastRepsSummary: summary,
        reason: `Average reps were below ${min} in the last two sessions. Drop about 10 % to recover, then build back up.`,
        nextStepGoal: `Train at ${deload} kg for a week with strict form.`
      };
    }
    return hold(
      `Average reps were below ${min} in the last two sessions, and ${weight} kg is already the lowest load.`,
      `Stay at ${weight} kg and aim for ${min} reps on every set.`
    );
  }

  const totalReps = sets.reduce((sum, s) => sum + s.repsCompleted, 0);
  return hold(
    `Reps are within the target range (${summary}). Double progression adds reps before weight.`,
    `Stay at ${weight} kg and aim for at least ${totalReps + 2} total reps.`
  );
}

function averageReps(sets: SetLog[]): number {
  return sets.reduce((sum, s) => sum + s.repsCompleted, 0) / sets.length;
}

// About 10 % lighter, at least one step lighter, never below the equipment's lowest load.
function deloadWeight(weightKg: number, equipment: EquipmentType): number {
  const { stepKg, minKg } = LOADING[equipment];
  const tenPercentLighter = roundToStep(weightKg * DELOAD_FACTOR, stepKg);
  const oneStepLighter = roundToStep(weightKg - stepKg, stepKg);
  return Math.max(minKg, Math.min(tenPercentLighter, oneStepLighter));
}

// Rounds to the nearest loadable weight, then to 0.01 kg to drop floating-point noise.
function roundToStep(weightKg: number, stepKg: number): number {
  return Math.round(Math.round(weightKg / stepKg) * stepKg * 100) / 100;
}

// Brzycki formula.
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  if (reps >= 37) return Math.round(weightKg * 1.5);
  return Math.round(weightKg * (36 / (37 - reps)) * 10) / 10;
}

// Plates per side of a barbell, heaviest first.
export function calculatePlates(targetWeightKg: number, barWeightKg = 20): { [plate: number]: number } {
  if (targetWeightKg <= barWeightKg) return {};
  let weightPerSide = (targetWeightKg - barWeightKg) / 2;
  const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
  const platesUsed: { [plate: number]: number } = {};

  for (const plate of availablePlates) {
    if (weightPerSide >= plate) {
      const count = Math.floor(weightPerSide / plate);
      platesUsed[plate] = count;
      weightPerSide -= count * plate;
    }
  }

  return platesUsed;
}
