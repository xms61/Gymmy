// The app's data and its sync with the SQLite API. Reads are synchronous from a cache kept in
// localStorage. Every change also goes into an outbox and leaves it only once the server has
// stored it, so changes made while the server is unreachable reach it on a later start.
import type { ExerciseDefinition, WorkoutSession } from '../types/workout.ts';
import { EXERCISE_DEFINITIONS } from '../data/seedData.ts';
import type { ImportPlan } from './backup.ts';
import { deleteLegacyDatabase, readLegacySessions } from './legacyIndexedDb.ts';
import {
  apiCallFor,
  applyOps,
  classifyStatus,
  isAdoptionConfirmed,
  sendInOrder,
  sessionsToAdopt,
  type PendingOp,
  type SendResult,
  type Snapshot,
  type SyncStatus,
  withoutOps
} from './sync.ts';

const SESSIONS_KEY = 'gymmy_workout_sessions_v2';
const DEFINITIONS_KEY = 'gymmy_exercise_definitions_v1';
const OUTBOX_KEY = 'gymmy_pending_ops_v1';
const REJECTED_KEY = 'gymmy_rejected_ops_v1';
// Set once the local cache from before the outbox existed has been checked against the server.
const LOCAL_ADOPTION_KEY = 'gymmy_local_sessions_adopted_v1';

// A request to an unreachable address can hang for minutes, and every later send waits behind it.
const REQUEST_TIMEOUT_MS = 8000;
const RETRY_INTERVAL_MS = 30_000;

export class StorageService {
  private static snapshot: Snapshot = readStoredSnapshot();
  private static outbox: PendingOp[] = readStoredList<PendingOp>(OUTBOX_KEY);
  private static rejected: PendingOp[] = readStoredList<PendingOp>(REJECTED_KEY);
  private static storageFailed = false;
  private static connected = false;
  private static hasServerData = false;
  private static initPromise: Promise<void> | null = null;
  private static syncing: Promise<void> | null = null;
  private static flushQueue: Promise<void> = Promise.resolve();
  private static listeners = new Set<() => void>();

  static init(): Promise<void> {
    if (!this.initPromise) {
      this.followOtherTabs();
      this.retryWhenPossible();
      this.initPromise = this.syncWithServer();
    }
    return this.initPromise;
  }

  static getSessions(): WorkoutSession[] {
    return this.snapshot.sessions;
  }

  static getExerciseDefinitions(): ExerciseDefinition[] {
    return this.snapshot.exercises;
  }

  static getSyncStatus(): SyncStatus {
    return {
      connected: this.connected,
      pendingChanges: this.outbox.length,
      rejectedChanges: this.rejected.length,
      storageFailed: this.storageFailed
    };
  }

  static getRejectedChanges(): PendingOp[] {
    return this.rejected;
  }

  static dismissRejectedChanges(): void {
    this.rejected = [];
    writeStored(REJECTED_KEY, this.rejected);
    this.notify();
  }

  // Called after the data or the sync status changes. Returns the unsubscribe function.
  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  static saveSession(session: WorkoutSession): void {
    this.record({ type: 'upsertSession', session });
  }

  static deleteSession(id: string): void {
    this.record({ type: 'deleteSession', id });
  }

  static saveExerciseDefinitions(exercises: ExerciseDefinition[]): void {
    this.record({ type: 'saveExercises', exercises });
  }

  static clearAllSessions(): void {
    this.record({ type: 'clearSessions' });
  }

  static getSnapshot(): Snapshot {
    return this.snapshot;
  }

  // Queues every change in the plan as one batch, so the server receives them in order.
  static applyImport(plan: ImportPlan): void {
    for (const session of [...plan.newSessions, ...plan.replacedSessions]) {
      this.enqueue({ type: 'upsertSession', session });
    }
    if (plan.exercises) this.enqueue({ type: 'saveExercises', exercises: plan.exercises });
    this.persist();
    this.notify();
    void this.flush();
  }

  // Runs at start, and again whenever an earlier run could not reach the server.
  private static syncWithServer(): Promise<void> {
    this.syncing ??= this.sendAndLoad().finally(() => {
      this.syncing = null;
    });
    return this.syncing;
  }

  private static async sendAndLoad(): Promise<void> {
    await this.flush();
    const server = await fetchServerSnapshot();
    if (server) {
      this.connected = true;
      this.hasServerData = true;
      this.snapshot = applyOps(server, this.outbox);
      if (localStorage.getItem(LOCAL_ADOPTION_KEY) === null) this.adoptLocalOnlySessions(readStoredSnapshot(), this.snapshot);
      this.persist();
    }
    await this.retireIndexedDb();
    await this.flush();
    this.notify();
  }

  // Without this, changes queued while the server was down would wait for the next change or reload.
  private static retryWhenPossible(): void {
    const retry = () => {
      if (!this.hasServerData) void this.syncWithServer();
      else if (this.outbox.length > 0) void this.flush();
    };
    window.addEventListener('online', retry);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') retry();
    });
    window.setInterval(retry, RETRY_INTERVAL_MS);
  }

  // Another tab wrote the stored copy. Take its version, so this tab's next write builds on it
  // instead of overwriting it.
  private static followOtherTabs(): void {
    window.addEventListener('storage', event => {
      if (!event.key || ![OUTBOX_KEY, SESSIONS_KEY, DEFINITIONS_KEY, REJECTED_KEY].includes(event.key)) return;
      this.snapshot = readStoredSnapshot();
      this.outbox = readStoredList<PendingOp>(OUTBOX_KEY);
      this.rejected = readStoredList<PendingOp>(REJECTED_KEY);
      this.notify();
    });
  }

  // Before the outbox existed, a session saved while the server was down stayed only in
  // localStorage. Queue those for the server once, instead of dropping them.
  private static adoptLocalOnlySessions(local: Snapshot, known: Snapshot): void {
    const { toAdopt } = sessionsToAdopt(local.sessions, known);
    for (const session of toAdopt) this.enqueue({ type: 'upsertSession', session });
    localStorage.setItem(LOCAL_ADOPTION_KEY, new Date().toISOString());
  }

  // Deletes the 1.0.0 IndexedDB store only after its sessions are confirmed to be in
  // localStorage and on the server. Otherwise it is kept and checked again on the next start.
  private static async retireIndexedDb(): Promise<void> {
    const legacySessions = await readLegacySessions();
    if (legacySessions === null) return;

    const adoption = sessionsToAdopt(legacySessions, this.snapshot);
    for (const session of adoption.toAdopt) this.enqueue({ type: 'upsertSession', session });
    this.persist();
    if (this.connected) await this.flush();

    if (isAdoptionConfirmed(adoption, readStoredSnapshot(), this.outbox)) {
      await deleteLegacyDatabase();
      console.info(`[StorageService] Moved ${adoption.validIds.length} sessions out of IndexedDB and deleted it`);
    } else {
      console.warn(
        `[StorageService] Keeping IndexedDB until its sessions reach the server ` +
          `(${adoption.invalidCount} unreadable, ${this.outbox.length} changes pending)`
      );
    }
  }

  private static record(op: PendingOp): void {
    this.enqueue(op);
    this.persist();
    this.notify();
    void this.flush();
  }

  private static enqueue(op: PendingOp): void {
    this.snapshot = applyOps(this.snapshot, [op]);
    this.outbox = [...this.outbox, op];
  }

  // Flushes run one after another, so two can never send the same operation. A failed flush is
  // logged and the chain goes on, so one error does not stop every later send.
  private static flush(): Promise<void> {
    this.flushQueue = this.flushQueue
      .then(() => this.sendOutbox())
      .catch((err: unknown) => console.error('[StorageService] Could not send queued changes', err));
    return this.flushQueue;
  }

  private static async sendOutbox(): Promise<void> {
    const batch = this.outbox;
    if (batch.length === 0) return;

    const { remaining, rejected } = await sendInOrder(batch, sendToServer);
    const finished = batch.slice(0, batch.length - remaining.length);
    this.outbox = withoutOps(this.outbox, finished);
    this.connected = remaining.length === 0;
    if (rejected.length > 0) this.keepRejected(rejected);
    writeStored(OUTBOX_KEY, this.outbox);
    this.notify();
  }

  // A refused change never reached the server. Keep it so the data can still be recovered.
  private static keepRejected(ops: PendingOp[]): void {
    console.error('[StorageService] The server refused these changes; kept in localStorage under', REJECTED_KEY, ops);
    this.rejected = [...this.rejected, ...ops];
    writeStored(REJECTED_KEY, this.rejected);
  }

  private static persist(): void {
    const saved = [
      writeStored(SESSIONS_KEY, this.snapshot.sessions),
      writeStored(DEFINITIONS_KEY, this.snapshot.exercises),
      writeStored(OUTBOX_KEY, this.outbox)
    ];
    this.storageFailed = saved.includes(false);
  }

  private static notify(): void {
    for (const listener of this.listeners) listener();
  }
}

async function fetchServerSnapshot(): Promise<Snapshot | null> {
  try {
    const res = await fetch('/api/data', { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) return null;
    // Safe: /api/data is our own server, which validates everything before storing it.
    const data = (await res.json()) as { success?: boolean; sessions: WorkoutSession[]; exercises: ExerciseDefinition[] };
    if (!data.success) return null;
    return { sessions: data.sessions, exercises: data.exercises.length > 0 ? data.exercises : EXERCISE_DEFINITIONS };
  } catch {
    // Expected when the app is served without the API (a static build) or the server is down.
    return null;
  }
}

async function sendToServer(op: PendingOp): Promise<SendResult> {
  const call = apiCallFor(op);
  try {
    const res = await fetch(call.path, {
      method: call.method,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: call.method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: call.body === undefined ? undefined : JSON.stringify(call.body)
    });
    return classifyStatus(res.status);
  } catch {
    return 'failed';
  }
}

function readStoredSnapshot(): Snapshot {
  const exercises = readStoredList<ExerciseDefinition>(DEFINITIONS_KEY);
  return {
    sessions: readStoredList<WorkoutSession>(SESSIONS_KEY),
    exercises: exercises.length > 0 ? exercises : EXERCISE_DEFINITIONS
  };
}

// These keys are only written by this module, so a parsed array has the stored shape.
function readStoredList<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? (value as T[]) : [];
  } catch (err) {
    console.error(`[StorageService] Could not read ${key} from localStorage`, err);
    return [];
  }
}

// Returns false when the browser refused the write, usually because its storage is full.
function writeStored(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[StorageService] Could not write ${key} to localStorage`, err);
    return false;
  }
}
