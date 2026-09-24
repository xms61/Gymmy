import { ExerciseDefinition, WorkoutSession } from '../types/workout';
import { EXERCISE_DEFINITIONS, INITIAL_SESSIONS } from '../data/seedData';
import { indexedDb } from './indexedDb';
import * as XLSX from 'xlsx';

const SESSIONS_STORAGE_KEY = 'gymmy_workout_sessions_v2';
const DEFINITIONS_STORAGE_KEY = 'gymmy_exercise_definitions_v1';

export class StorageService {
  private static cachedSessions: WorkoutSession[] | null = null;
  private static cachedDefinitions: ExerciseDefinition[] | null = null;
  private static sqliteConnected: boolean = false;
  private static initPromise: Promise<void> | null = null;

  /**
   * Initializes local DB connection:
   * 1. Hydrates in-memory cache from localStorage / IndexedDB instantly.
   * 2. Asynchronously fetches latest data from local SQLite backend (/api/data).
   */
  static async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      // 1. Initial immediate hydrate from localStorage
      this.hydrateFromLocalStorage();

      // 2. Hydrate from IndexedDB if localStorage was empty
      if ((!this.cachedSessions || this.cachedSessions.length === 0)) {
        try {
          const idbSessions = await indexedDb.getAllSessions();
          if (idbSessions && idbSessions.length > 0) {
            this.cachedSessions = idbSessions;
          }
        } catch {
          // ignore
        }
      }

      // 3. Try to sync with SQLite backend (/api/data)
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            this.sqliteConnected = true;
            this.cachedSessions = data.sessions || [];
            if (data.exercises && data.exercises.length > 0) {
              this.cachedDefinitions = data.exercises;
            }

            // Dual-persist to IndexedDB and localStorage
            if (this.cachedSessions) {
              localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(this.cachedSessions));
              indexedDb.saveAllSessions(this.cachedSessions);
            }
            if (this.cachedDefinitions) {
              localStorage.setItem(DEFINITIONS_STORAGE_KEY, JSON.stringify(this.cachedDefinitions));
              indexedDb.saveExercises(this.cachedDefinitions);
            }
            console.log('[StorageService] Connected to local SQLite DB (data/gymmy.db)');
          }
        }
      } catch {
        console.log('[StorageService] Running in offline/client mode (IndexedDB + LocalStorage)');
        this.sqliteConnected = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Returns true if local SQLite database (/api) is active
   */
  static isDbConnected(): boolean {
    return this.sqliteConnected;
  }

  private static hydrateFromLocalStorage(): void {
    try {
      // Clean legacy mock data if present
      if (localStorage.getItem('gymmy_workout_sessions_v1')) {
        localStorage.removeItem('gymmy_workout_sessions_v1');
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([]));
        this.cachedSessions = [];
      }

      if (this.cachedSessions === null) {
        const data = localStorage.getItem(SESSIONS_STORAGE_KEY);
        this.cachedSessions = data ? JSON.parse(data) : [];
      }

      if (this.cachedDefinitions === null) {
        const defData = localStorage.getItem(DEFINITIONS_STORAGE_KEY);
        this.cachedDefinitions = defData ? JSON.parse(defData) : EXERCISE_DEFINITIONS;
      }
    } catch (e) {
      console.error('Failed to hydrate from localStorage:', e);
      if (this.cachedSessions === null) this.cachedSessions = [];
      if (this.cachedDefinitions === null) this.cachedDefinitions = EXERCISE_DEFINITIONS;
    }
  }

  /**
   * Retrieves all workout sessions (synchronous from cache)
   */
  static getSessions(): WorkoutSession[] {
    if (this.cachedSessions === null) {
      this.hydrateFromLocalStorage();
    }
    return this.cachedSessions || [];
  }

  /**
   * Clears all workout logs for a clean slate
   */
  static clearAllSessions(): void {
    this.cachedSessions = [];
    localStorage.removeItem('gymmy_workout_sessions_v1');
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([]));
    indexedDb.clearSessions().catch(() => {});

    // Sync with SQLite backend
    fetch('/api/clear', { method: 'POST' }).catch(() => {});
  }

  /**
   * Persists workout sessions list
   */
  static saveSessions(sessions: WorkoutSession[]): void {
    this.cachedSessions = sessions;
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
      indexedDb.saveAllSessions(sessions).catch(() => {});
    } catch (e) {
      console.error('Failed to save sessions to local cache:', e);
    }
  }

  /**
   * Adds or updates a single session
   */
  static saveSession(session: WorkoutSession): void {
    const sessions = [...this.getSessions()];
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session); // Add newest first
    }
    this.saveSessions(sessions);
    indexedDb.saveSession(session).catch(() => {});

    // Sync to SQLite backend
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    }).catch(err => console.warn('[StorageService] SQLite save failed, persisted to IndexedDB:', err));
  }

  /**
   * Deletes a session by ID
   */
  static deleteSession(id: string): void {
    const sessions = this.getSessions().filter(s => s.id !== id);
    this.saveSessions(sessions);
    indexedDb.deleteSession(id).catch(() => {});

    // Sync to SQLite backend
    fetch(`/api/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(err => console.warn('[StorageService] SQLite delete failed:', err));
  }

  /**
   * Retrieves exercise definitions
   */
  static getExerciseDefinitions(): ExerciseDefinition[] {
    if (this.cachedDefinitions === null) {
      this.hydrateFromLocalStorage();
    }
    return this.cachedDefinitions || EXERCISE_DEFINITIONS;
  }

  /**
   * Saves updated exercise definitions
   */
  static saveExerciseDefinitions(definitions: ExerciseDefinition[]): void {
    this.cachedDefinitions = definitions;
    try {
      localStorage.setItem(DEFINITIONS_STORAGE_KEY, JSON.stringify(definitions));
      indexedDb.saveExercises(definitions).catch(() => {});

      // Sync to SQLite backend
      fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(definitions)
      }).catch(err => console.warn('[StorageService] SQLite exercise update failed:', err));
    } catch (e) {
      console.error('Failed to save definitions:', e);
    }
  }

  /**
   * Updates an individual exercise definition
   */
  static updateExerciseDefinition(def: ExerciseDefinition): void {
    const list = [...this.getExerciseDefinitions()];
    const idx = list.findIndex(e => e.id === def.id);
    if (idx >= 0) {
      list[idx] = def;
      this.saveExerciseDefinitions(list);
    }
  }

  /**
   * Exports all data to downloadable JSON file
   */
  static exportToJson(): void {
    const data = {
      sessions: this.getSessions(),
      exercises: this.getExerciseDefinitions(),
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0',
      database: 'SQLite (data/gymmy.db) + IndexedDB'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymmy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Exports completed sessions to Excel (.xlsx)
   */
  static exportToExcel(): void {
    const sessions = this.getSessions().filter(s => s.completed);
    const rows: Array<{
      Date: string;
      Workout: string;
      Exercise: string;
      Sets: number;
      TargetReps: string;
      Accomplished: string;
      LoadKg: string;
      Notes: string;
    }> = [];

    for (const session of sessions) {
      for (const ex of session.exercises) {
        const accomplished = ex.sets.map(s => s.repsCompleted).join('/');
        const load = ex.sets.map(s => s.weightKg).join('/');
        rows.push({
          Date: session.date,
          Workout: session.name,
          Exercise: ex.exerciseName,
          Sets: ex.sets.length,
          TargetReps: ex.sets[0]?.targetReps || '',
          Accomplished: accomplished,
          LoadKg: load,
          Notes: ex.notes || ''
        });
      }
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gymmy Workouts');
    XLSX.writeFile(wb, `Gymmy-History-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  /**
   * Resets data to initial factory seed
   */
  static resetToSeed(): void {
    this.saveSessions(INITIAL_SESSIONS);
    this.saveExerciseDefinitions(EXERCISE_DEFINITIONS);
    fetch('/api/reset', { method: 'POST' }).catch(() => {});
  }
}
