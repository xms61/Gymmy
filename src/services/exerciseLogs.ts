// Decides which logged sets count as having done an exercise. The overload engine and the
// Progress view both read history through here, so a skipped exercise is ignored everywhere.
import type { ExerciseDefinition, SetLog, WorkoutSession } from '../types/workout.ts';

export interface CompletedExerciseLog {
  session: WorkoutSession;
  sets: SetLog[];
}

// Each exercise's completed logs by exercise id, oldest first.
export type ExerciseLogIndex = Map<string, CompletedExerciseLog[]>;

// Built in one pass over the history, so the screens don't re-filter and re-sort every session for
// every exercise. A log is filed under its exerciseId, or, for logs whose id is not a known
// exercise, under the exercise with the same name. Only a session's first log of an exercise
// counts, and only if it has a completed set with reps.
export function indexCompletedLogs(sessions: WorkoutSession[], exercises: ExerciseDefinition[]): ExerciseLogIndex {
  const knownIds = new Set(exercises.map(e => e.id));
  const idByName = new Map(exercises.map(e => [e.name.toLowerCase(), e.id]));
  const index: ExerciseLogIndex = new Map();
  for (const session of sessions.filter(s => s.completed).sort(oldestFirst)) {
    const seen = new Set<string>();
    for (const log of session.exercises) {
      const id = knownIds.has(log.exerciseId) ? log.exerciseId : idByName.get(log.exerciseName.toLowerCase());
      if (id === undefined || seen.has(id)) continue;
      seen.add(id);
      const sets = log.sets.filter(s => s.completed && s.repsCompleted > 0);
      if (sets.length > 0) fileLog(index, id, { session, sets });
    }
  }
  return index;
}

export function logsFor(index: ExerciseLogIndex, exercise: ExerciseDefinition): CompletedExerciseLog[] {
  return index.get(exercise.id) ?? [];
}

function fileLog(index: ExerciseLogIndex, id: string, log: CompletedExerciseLog): void {
  const logs = index.get(id);
  if (logs) logs.push(log);
  else index.set(id, [log]);
}

function oldestFirst(a: WorkoutSession, b: WorkoutSession): number {
  return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
}

// The sets that count for progression: the ones at the session's heaviest weight. Lighter ramp-up
// and back-off sets are left out, so they neither hide nor drag down the real work.
export function workingSets(sets: SetLog[]): SetLog[] {
  const heaviest = workingWeight(sets);
  return sets.filter(s => s.weightKg === heaviest);
}

export function workingWeight(sets: SetLog[]): number {
  return Math.max(...sets.map(s => s.weightKg));
}

