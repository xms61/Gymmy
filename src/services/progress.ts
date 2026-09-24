// Per-exercise training history for the Progress view.
import type { ExerciseDefinition, WorkoutSession } from '../types/workout.ts';
import { completedExerciseLogs, workingWeight } from './exerciseLogs.ts';
import { estimate1RM } from './overloadEngine.ts';

export interface ExerciseHistoryEntry {
  date: string;
  sessionName: string;
  weight: number;
  repsString: string;
  estimated1RM: number;
}

// Oldest session first. Sessions where the exercise has no completed sets are left out.
export function exerciseHistory(exercise: ExerciseDefinition, sessions: WorkoutSession[]): ExerciseHistoryEntry[] {
  return completedExerciseLogs(exercise, sessions).map(({ session, sets }) => ({
    date: session.date,
    sessionName: session.name,
    weight: workingWeight(sets),
    repsString: sets.map(s => s.repsCompleted).join(' / '),
    estimated1RM: Math.max(...sets.map(s => estimate1RM(s.weightKg, s.repsCompleted)))
  }));
}
