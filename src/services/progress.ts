// Per-exercise training history for the Progress view.
import type { ExerciseDefinition, WorkoutSession } from '../types/workout.ts';
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
  const sortedSessions = [...sessions]
    .filter(s => s.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const entries: ExerciseHistoryEntry[] = [];
  for (const session of sortedSessions) {
    const match = session.exercises.find(
      e => e.exerciseId === exercise.id || e.exerciseName.toLowerCase() === exercise.name.toLowerCase()
    );
    const completedSets = match?.sets.filter(s => s.completed && s.repsCompleted > 0) ?? [];
    if (completedSets.length === 0) continue;

    const topWeight = Math.max(...completedSets.map(s => s.weightKg));
    const topReps = Math.max(...completedSets.map(s => s.repsCompleted));
    entries.push({
      date: session.date,
      sessionName: session.name,
      weight: topWeight,
      repsString: completedSets.map(s => s.repsCompleted).join(' / '),
      estimated1RM: estimate1RM(topWeight, topReps)
    });
  }
  return entries;
}
