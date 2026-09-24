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

export interface ApiCall {
  method: 'POST' | 'DELETE';
  path: string;
  body?: unknown;
}

// sent: the server stored it. rejected: the server will never accept this payload (keep it
// aside instead of blocking the queue). failed: try again later.
export type SendResult = 'sent' | 'rejected' | 'failed';

export function applyOps(snapshot: Snapshot, ops: PendingOp[]): Snapshot {
  return ops.reduce(applyOp, snapshot);
}

function applyOp(snapshot: Snapshot, op: PendingOp): Snapshot {
  switch (op.type) {
    case 'upsertSession': {
      const exists = snapshot.sessions.some(s => s.id === op.session.id);
      const sessions = exists
        ? snapshot.sessions.map(s => (s.id === op.session.id ? op.session : s))
        : [op.session, ...snapshot.sessions];
      return { ...snapshot, sessions };
    }
    case 'deleteSession':
      return { ...snapshot, sessions: snapshot.sessions.filter(s => s.id !== op.id) };
    case 'saveExercises':
      return { ...snapshot, exercises: op.exercises };
    case 'clearSessions':
      return { ...snapshot, sessions: [] };
  }
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

export interface Adoption {
  validIds: string[];
  invalidCount: number;
  toAdopt: WorkoutSession[];
}

// Sessions found outside the normal sync path (the retired IndexedDB store, or a local cache
// from before the outbox existed) that the known data does not have yet.
export function sessionsToAdopt(candidates: unknown[], known: Snapshot): Adoption {
  const knownIds = new Set(known.sessions.map(s => s.id));
  const valid: WorkoutSession[] = [];
  let invalidCount = 0;
  for (const candidate of candidates) {
    const parsed = parseWorkoutSession(candidate);
    if (parsed.ok) valid.push(parsed.value);
    else invalidCount++;
  }
  return {
    validIds: valid.map(s => s.id),
    invalidCount,
    toAdopt: valid.filter(s => !knownIds.has(s.id))
  };
}

// True once every adopted session is in the stored copy and the server has confirmed it.
export function isAdoptionConfirmed(adoption: Adoption, stored: Snapshot, outbox: PendingOp[]): boolean {
  const storedIds = new Set(stored.sessions.map(s => s.id));
  const pendingIds = new Set(outbox.flatMap(op => (op.type === 'upsertSession' ? [op.session.id] : [])));
  return adoption.invalidCount === 0 && adoption.validIds.every(id => storedIds.has(id) && !pendingIds.has(id));
}
