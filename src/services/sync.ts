// The pure half of syncing with the SQLite API: the changes waiting to be sent, how they apply
// to local data, and how a queue of them is sent in order. storage.ts does the I/O.
import type { ExerciseDefinition, WorkoutSession } from '../types/workout.ts';
import { parseWorkoutSession } from '../validation.ts';

export interface Snapshot {
  sessions: WorkoutSession[];
  exercises: ExerciseDefinition[];
}

export type PendingOp =
  | { type: 'upsertSession'; session: WorkoutSession }
  | { type: 'deleteSession'; id: string }
  | { type: 'saveExercises'; exercises: ExerciseDefinition[] }
  | { type: 'clearSessions' };

export interface SyncStatus {
  connected: boolean;
  pendingChanges: number;
  rejectedChanges: number; // refused by the server, kept in gymmy_rejected_ops_v1
  storageFailed: boolean; // the last save to localStorage failed, usually because it is full
}

export interface ApiCall {
  method: 'POST' | 'DELETE';
  path: string;
  body?: unknown;
}

// sent: the server stored it. rejected: the server will never accept this payload (keep it
// aside instead of blocking the queue). failed: try again later.
export type SendResult = 'sent' | 'rejected' | 'failed';

// Applies a whole batch in one pass over a map by id, then sorts once, so a restored backup of
// many sessions costs one sort instead of a scan per session. Sessions stay newest first; on the
// same day and start time, a session added by these ops comes before the ones already there.
export function applyOps(snapshot: Snapshot, ops: PendingOp[]): Snapshot {
  const sessionsById = new Map(snapshot.sessions.map(s => [s.id, s]));
  const position = new Map(snapshot.sessions.map((s, i) => [s.id, i]));
  let exercises = snapshot.exercises;
  let nextNewPosition = -1;
  for (const op of ops) {
    switch (op.type) {
      case 'upsertSession':
        if (!sessionsById.has(op.session.id)) position.set(op.session.id, nextNewPosition--);
        sessionsById.set(op.session.id, op.session);
        break;
      case 'deleteSession':
        sessionsById.delete(op.id);
        break;
      case 'saveExercises':
        exercises = op.exercises;
        break;
      case 'clearSessions':
        sessionsById.clear();
        break;
    }
  }
  const sessions = [...sessionsById.values()].sort(
    (a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime) || position.get(a.id)! - position.get(b.id)!
  );
  return { sessions, exercises };
}

export function apiCallFor(op: PendingOp): ApiCall {
  switch (op.type) {
    case 'upsertSession':
      return { method: 'POST', path: '/api/sessions', body: op.session };
    case 'deleteSession':
      return { method: 'DELETE', path: `/api/sessions/${encodeURIComponent(op.id)}` };
    case 'saveExercises':
      return { method: 'POST', path: '/api/exercises', body: op.exercises };
    case 'clearSessions':
      return { method: 'POST', path: '/api/clear' };
  }
}

// 400, 413 and 415 describe the payload itself, so sending it again cannot succeed. Anything
// else (network errors, 5xx, a 403 from opening the app under an unexpected host name) may
// work later, so the operation stays queued.
export function classifyStatus(status: number): SendResult {
  if (status >= 200 && status < 300) return 'sent';
  if (status === 400 || status === 413 || status === 415) return 'rejected';
  return 'failed';
}

// Sends in order and stops at the first failure, so the server never sees a later change
// before an earlier one.
export async function sendInOrder(
  ops: PendingOp[],
  send: (op: PendingOp) => Promise<SendResult>
): Promise<{ remaining: PendingOp[]; rejected: PendingOp[] }> {
  const rejected: PendingOp[] = [];
  for (const [index, op] of ops.entries()) {
    const result = await send(op);
    if (result === 'failed') return { remaining: ops.slice(index), rejected };
    if (result === 'rejected') rejected.push(op);
  }
  return { remaining: [], rejected };
}

// Removes each finished op once, matched by content. The outbox may have gained ops from this tab
// or another one while the batch was in flight, and ops read back from storage are new objects.
export function withoutOps(outbox: PendingOp[], finished: PendingOp[]): PendingOp[] {
  const toRemove = new Map<string, number>();
  for (const op of finished) {
    const key = JSON.stringify(op);
    toRemove.set(key, (toRemove.get(key) ?? 0) + 1);
  }
  return outbox.filter(op => {
    const key = JSON.stringify(op);
    const count = toRemove.get(key) ?? 0;
    if (count === 0) return true;
    toRemove.set(key, count - 1);
    return false;
  });
}

// Valid sessions from the local cache of before the outbox existed that the known data does not
// have yet. Unreadable ones are skipped.
export function sessionsToAdopt(candidates: unknown[], known: Snapshot): WorkoutSession[] {
  const knownIds = new Set(known.sessions.map(s => s.id));
  return candidates.flatMap(candidate => {
    const parsed = parseWorkoutSession(candidate);
    return parsed.ok && !knownIds.has(parsed.value.id) ? [parsed.value] : [];
  });
}
