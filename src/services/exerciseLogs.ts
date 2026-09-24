// Decides which logged sets count as having done an exercise. The overload engine and the
// Progress view both read history through here, so a skipped exercise is ignored everywhere.
import type { ExerciseDefinition, SetLog, WorkoutSession } from '../types/workout.ts';

export interface CompletedExerciseLog {
  session: WorkoutSession;
  sets: SetLog[];
}

// Oldest first. A session counts only if the exercise has at least one completed set with reps.
export function completedExerciseLogs(exercise: ExerciseDefinition, sessions: WorkoutSession[]): CompletedExerciseLog[] {
  return sessions
    .filter(session => session.completed)
    .map(session => ({ session, sets: completedSets(exercise, session) }))
    .filter(log => log.sets.length > 0)
    .sort((a, b) => a.session.date.localeCompare(b.session.date) || a.session.startTime.localeCompare(b.session.startTime));
}

function completedSets(exercise: ExerciseDefinition, session: WorkoutSession): SetLog[] {
  const name = exercise.name.toLowerCase();
  const log = session.exercises.find(e => e.exerciseId === exercise.id || e.exerciseName.toLowerCase() === name);
  return log?.sets.filter(s => s.completed && s.repsCompleted > 0) ?? [];
}
