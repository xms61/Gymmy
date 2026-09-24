// Reads and deletes the IndexedDB store that Gymmy 1.0.0 wrote alongside localStorage.
// Remove this module, and its call in storage.ts, one release after 1.1.0: by then every
// browser that opened the app has moved its sessions over and deleted the store.
const LEGACY_DATABASE = 'gymmy_idb';
const SESSIONS_STORE = 'sessions';

// null when the database does not exist. Opening without a version would create it, so the
// upgrade that signals a new database is aborted instead.
export function readLegacySessions(): Promise<unknown[] | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise(resolve => {
    const request = indexedDB.open(LEGACY_DATABASE);
    request.onupgradeneeded = () => request.transaction?.abort();
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        db.close();
        resolve([]);
        return;
      }
      const read = db.transaction(SESSIONS_STORE, 'readonly').objectStore(SESSIONS_STORE).getAll();
      read.onsuccess = () => {
        db.close();
        resolve(read.result);
      };
      read.onerror = () => {
        db.close();
        resolve(null);
      };
    };
  });
}

// Resolves once the browser has deleted the database, or has queued the delete behind another
// tab that still holds it open.
export function deleteLegacyDatabase(): Promise<void> {
  return new Promise(resolve => {
    const request = indexedDB.deleteDatabase(LEGACY_DATABASE);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}
