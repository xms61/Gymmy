// Per-exercise training history for the Progress view.
import { workingWeight, type CompletedExerciseLog } from './exerciseLogs.ts';
import { estimate1RM } from './overloadEngine.ts';

export interface ExerciseHistoryEntry {
  date: string;
  sessionName: string;
  weight: number;
  repsString: string;
  estimated1RM: number;
  volumeKg: number; // weight × reps over every completed set of the exercise
}

// Oldest session first. Sessions where the exercise has no completed sets are left out.
export function exerciseHistory(logs: CompletedExerciseLog[]): ExerciseHistoryEntry[] {
  return logs.map(({ session, sets }) => ({
    date: session.date,
    sessionName: session.name,
    weight: workingWeight(sets),
    repsString: sets.map(s => s.repsCompleted).join(' / '),
    estimated1RM: Math.max(...sets.map(s => estimate1RM(s.weightKg, s.repsCompleted))),
    volumeKg: sets.reduce((total, s) => total + s.weightKg * s.repsCompleted, 0)
  }));
}
