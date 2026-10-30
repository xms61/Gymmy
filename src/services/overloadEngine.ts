// Progressive overload rules (double progression) and 1RM estimates. Which loads exist, and
// which one comes next, is decided by loading.ts from the home equipment.
import type { EquipmentType, ExerciseDefinition, ProgressRecommendation, SetLog } from '../types/workout.ts';
import { workingSets, workingWeight, type CompletedExerciseLog } from './exerciseLogs.ts';
import { lightestLoad, nearestLoad, stepLoad } from './loading.ts';

const DELOAD_FACTOR = 0.9;
const DELOAD_RIR = 3;
// A stall: the last this-many sessions at one weight beat none of the sessions before them.
const STALL_WINDOW = 3;

// A heavier jump than this is earned with extra reps first. Double progression restarts at the
// bottom of the range after a jump, which only works when the jump is a few percent: 5 to 7.5 kg
// (+50 %) after 15 reps would leave the lifter far below the range at the new weight.
const MAX_PLAIN_JUMP = 0.15;
// Sets of up to about 30 reps taken close to failure build muscle about as well as heavier ones
// (Schoenfeld et al. 2017); much lighter loads do less (Lasevicius et al. 2018).
const REP_TARGET_CAP = 30;
const EPLEY_REPS = 30; // Epley: 1RM = weight × (1 + reps / 30)
const FLOAT_TOLERANCE = 1e-9;

type Advice = Omit<ProgressRecommendation, 'exerciseId' | 'exerciseName' | 'recommendedRepRange'>;

// logs: this exercise's completed logs, oldest first (logsFor in exerciseLogs.ts).
export function getRecommendation(exercise: ExerciseDefinition, logs: CompletedExerciseLog[]): ProgressRecommendation {
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

// A deload is one session, about a week at once a week per lift. The session after it goes back to
// the weight before it: a deload is a temporary cut (Bell et al. 2023 Delphi consensus).
function adviceFromHistory(exercise: ExerciseDefinition, logs: CompletedExerciseLog[]): Advice {
  const shownBeforeLast = logs.length > 1 ? progressionAdvice(exercise, logs.slice(0, -1)) : null;
  const last = workingSets(logs[logs.length - 1]!.sets);
  if (shownBeforeLast?.status === 'deload' && workingWeight(last) === shownBeforeLast.recommendedWeightKg) {
    return returnFromDeload(exercise, last, shownBeforeLast.currentWeightKg);
  }
  return progressionAdvice(exercise, logs);
}

function returnFromDeload(exercise: ExerciseDefinition, sets: SetLog[], weightBeforeKg: number): Advice {
  const { targetSets, targetRepsMin: min, targetRepsMax: max } = exercise;
  const weight = workingWeight(sets);
  return {
    status: 'increase_load',
    currentWeightKg: weight,
    recommendedWeightKg: weightBeforeKg,
    lastRepsSummary: sets.map(s => s.repsCompleted).join(' / '),
    reason: `Deload done at ${weight} kg. Go back to ${weightBeforeKg} kg.`,
    nextStepGoal: `Return to ${weightBeforeKg} kg for ${targetSets} sets of ${min}–${max} reps.`
  };
}

// logs is oldest first, and every log has at least one set.
function progressionAdvice(exercise: ExerciseDefinition, logs: CompletedExerciseLog[]): Advice {
  const { targetSets, targetRepsMin: min, targetRepsMax: max, equipment } = exercise;
  const sets = workingSets(logs[logs.length - 1]!.sets);
  const weight = workingWeight(sets);
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
    const repsNeeded = repsToMoveUp(weight, next, exercise);
    if (!sets.every(s => s.repsCompleted >= repsNeeded)) {
      return hold(
        `Every set reached the top of the range, but the next load, ${next} kg, is ${Math.round(((next - weight) / weight) * 100)} % heavier.`,
        `Build to ${repsNeeded} reps on every set at ${weight} kg, then move to ${next} kg for ${min} reps.`
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
  const averages = logsAtWeight(logs, weight).map(log => averageReps(workingSets(log.sets)));
  const trend = averages.slice(-3).map(formatAverage).join(' → ');

  // A deload cuts the load by about 10 %, the sets by half and the effort to about 3 reps in
  // reserve (Bell et al. 2023 Delphi consensus; Rogerson et al. 2024 survey).
  const deloadFor = (cause: string): Advice => {
    const deload = deloadWeight(weight, equipment);
    const easier = `${Math.ceil(targetSets / 2)} sets, each stopped about ${DELOAD_RIR} reps short of failure`;
    if (deload < weight) {
      return {
        status: 'deload',
        currentWeightKg: weight,
        recommendedWeightKg: deload,
        lastRepsSummary: summary,
        reason: `${cause}. Deload for one session: about 10 % lighter with half the sets.`,
        nextStepGoal: `Train at ${deload} kg for one session: ${easier}. Then return to ${weight} kg.`
      };
    }
    return hold(`${cause}, and ${weight} kg is already the lowest load.`, `Take an easier session at ${weight} kg: ${easier}.`);
  };

  // Falling performance and stalls are what lifters deload on (Rogerson et al. 2024 survey).
  // Being below the range while reps rise is neither.
  if (isDeclining(averages)) {
    return deloadFor(`Average reps dropped in each of the last two sessions at ${weight} kg (${trend}), which points to fatigue`);
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

  if (isStalled(averages)) {
    const stallTrend = averages.slice(-(STALL_WINDOW + 1)).map(formatAverage).join(' → ');
    return deloadFor(`No new best in the last three sessions at ${weight} kg (${stallTrend})`);
  }

  const restAdvice = laterSetsFellBelow(sets, min)
    ? ' Later sets fell below the range: rest 2–3 minutes between sets, or stop the early sets 1–2 reps short of failure.'
    : '';
  if (sets[0].repsCompleted >= max) {
    return hold(
      `The first set reached ${sets[0].repsCompleted} reps, but later sets dropped (${summary}). Keep the load until they catch up.${restAdvice}`,
      `Stay at ${weight} kg and push the later sets closer to ${max} reps.`
    );
  }

  const totalReps = sets.reduce((sum, s) => sum + s.repsCompleted, 0);
  const goal = `Stay at ${weight} kg and aim for at least ${totalReps + 2} total reps.`;
  if (averageReps(sets) < min) {
    return hold(
      `Reps are below the ${min}–${max} range (${summary}). Keep the load while they climb; three flat sessions below the range suggest a lighter weight.${restAdvice}`,
      goal
    );
  }
  return hold(`Reps are within the target range (${summary}). Double progression adds reps before weight.${restAdvice}`, goal);
}

// The first set made the range and the last did not. Longer rest keeps later sets closer to the
// first (Schoenfeld et al. 2016; Grgic et al. 2018 review; Singer et al. 2024 meta-analysis).
function laterSetsFellBelow(sets: SetLog[], minReps: number): boolean {
  return sets[0]!.repsCompleted >= minReps && sets[sets.length - 1]!.repsCompleted < minReps;
}

// The reps every set needs before moving from weightKg to nextKg: the top of the range, or for a
// big jump the reps that predict the same one-rep max as the bottom of the range at nextKg (Epley).
// Above 10 reps Brzycki predicts fewer reps at a given share of the 1RM than lifters manage, and
// Epley comes closer (Nuzzo et al. 2024 meta-regression). Bodyweight lifts move the body too, so
// their added weight is a small share of the load.
function repsToMoveUp(weightKg: number, nextKg: number, exercise: ExerciseDefinition): number {
  const { targetRepsMin: min, targetRepsMax: max, equipment } = exercise;
  const jumpIsBig = equipment !== 'bodyweight' && weightKg > 0 && (nextKg - weightKg) / weightKg > MAX_PLAIN_JUMP;
  if (!jumpIsBig) return max;
  const sameOneRepMax = Math.ceil((nextKg / weightKg) * (EPLEY_REPS + min) - EPLEY_REPS - FLOAT_TOLERANCE);
  return Math.max(max, Math.min(REP_TARGET_CAP, sameOneRepMax));
}

function averageReps(sets: SetLog[]): number {
  return sets.reduce((sum, s) => sum + s.repsCompleted, 0) / sets.length;
}

// The most recent run of sessions at this weight, oldest first.
function logsAtWeight(logs: CompletedExerciseLog[], weightKg: number): CompletedExerciseLog[] {
  let start = logs.length;
  while (start > 0 && workingWeight(logs[start - 1]!.sets) === weightKg) start--;
  return logs.slice(start);
}

// Average reps fell in each of the last two sessions.
function isDeclining(averages: number[]): boolean {
  const [a, b, c] = averages.slice(-3);
  return c !== undefined && b < a && c < b;
}

// At least four sessions; the last three beat none before them and gained nothing from the first
// of them to the last. Reps that are climbing back toward an earlier best are not a stall.
function isStalled(averages: number[]): boolean {
  const earlier = averages.slice(0, -STALL_WINDOW);
  const window = averages.slice(-STALL_WINDOW);
  return earlier.length > 0 && Math.max(...window) <= Math.max(...earlier) && window[window.length - 1]! <= window[0]!;
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

// Epley, the model repsToMoveUp uses, so reps that earn a jump predict the same 1RM as the bottom of
// the range after it. Brzycki overestimates above about 10 reps (20 % at 19 reps on the bench press,
// Nuzzo et al. 2024) and divides by zero at 37.
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / EPLEY_REPS) * 10) / 10;
}
