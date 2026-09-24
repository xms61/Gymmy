import { ExerciseDefinition, WorkoutSession } from '../types/workout';

const DB_NAME = 'gymmy_idb';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const EXERCISES_STORE = 'exercises';

class IndexedDbHelper {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  private getDb(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(EXERCISES_STORE)) {
          db.createObjectStore(EXERCISES_STORE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  async getAllSessions(): Promise<WorkoutSession[]> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readonly');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const res = req.result as WorkoutSession[];
          // Sort descending by date
          res.sort((a, b) => b.date.localeCompare(a.date));
          resolve(res);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async saveSession(session: WorkoutSession): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.put(session);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[IndexedDB] Save session failed:', e);
    }
  }

  async saveAllSessions(sessions: WorkoutSession[]): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        store.clear();
        for (const s of sessions) {
          store.put(s);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[IndexedDB] Save all sessions failed:', e);
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[IndexedDB] Delete session failed:', e);
    }
  }

  async clearSessions(): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[IndexedDB] Clear sessions failed:', e);
    }
  }

  async getAllExercises(): Promise<ExerciseDefinition[]> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(EXERCISES_STORE, 'readonly');
        const store = tx.objectStore(EXERCISES_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as ExerciseDefinition[]);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async saveExercises(exercises: ExerciseDefinition[]): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(EXERCISES_STORE, 'readwrite');
        const store = tx.objectStore(EXERCISES_STORE);
        for (const ex of exercises) {
          store.put(ex);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[IndexedDB] Save exercises failed:', e);
    }
  }
}

export const indexedDb = new IndexedDbHelper();
