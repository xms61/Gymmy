// Backups in the GymmyBackup format: building one for export, and working out what importing
// one would change. Reading and writing files happens in backupFile.ts.
import type { GymmyBackup, WorkoutSession } from '../types/workout.ts';
import type { Snapshot } from './sync.ts';

export interface ImportPlan {
  newSessions: WorkoutSession[];
  replacedSessions: WorkoutSession[];
  unchangedSessionCount: number;
  // null when the backup's exercise targets match the current ones.
  exercises: GymmyBackup['exercises'] | null;
}

export function createBackup(snapshot: Snapshot, now: Date): GymmyBackup {
  return {
    format: 'gymmy-backup',
    version: 1,
    exportedAt: now.toISOString(),
    sessions: snapshot.sessions,
    exercises: snapshot.exercises
  };
}

// An import adds new sessions and replaces sessions with the same id. It never deletes: sessions
// missing from the backup are kept.
export function planImport(current: Snapshot, backup: GymmyBackup): ImportPlan {
  const currentById = new Map(current.sessions.map(s => [s.id, s]));
  const plan: ImportPlan = { newSessions: [], replacedSessions: [], unchangedSessionCount: 0, exercises: null };
  for (const session of backup.sessions) {
    const existing = currentById.get(session.id);
    if (!existing) plan.newSessions.push(session);
    else if (isSameData(existing, session)) plan.unchangedSessionCount++;
    else plan.replacedSessions.push(session);
  }
  if (!isSameData(current.exercises, backup.exercises)) plan.exercises = backup.exercises;
  return plan;
}

export function hasChanges(plan: ImportPlan): boolean {
  return plan.newSessions.length > 0 || plan.replacedSessions.length > 0 || plan.exercises !== null;
}

export function describeImportPlan(plan: ImportPlan): string {
  if (!hasChanges(plan)) return 'Nothing to import: this backup matches your current data.';
  const parts = [
    countOf(plan.newSessions.length, 'new session'),
    countOf(plan.replacedSessions.length, 'replaced session'),
    plan.exercises ? 'exercise targets updated' : '',
    countOf(plan.unchangedSessionCount, 'unchanged session')
  ].filter(part => part !== '');
  return `${parts.join(', ')}.`;
}

function countOf(count: number, noun: string): string {
  if (count === 0) return '';
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

// Compares by content, ignoring key order and keys that are undefined (the server and the
// local cache can store the same session with its keys in a different order).
function isSameData(a: unknown, b: unknown): boolean {
  return canonicalJson(a) === canonicalJson(b);
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    item !== null && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([x], [y]) => x.localeCompare(y)))
      : item
  );
}
