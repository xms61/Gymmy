// Wording for the sync status shown in the header badge and in Settings.
import type { SyncStatus } from '../services/storage.ts';

export function syncLabel({ connected, pendingChanges }: SyncStatus): string {
  if (connected) return 'SQLite';
  return pendingChanges > 0 ? `Offline, ${pendingChanges} pending` : 'Offline';
}

export function describeSyncStatus({ connected, pendingChanges }: SyncStatus): string {
  if (connected) return 'Saved to data/gymmy.db through the dev server.';
  if (pendingChanges === 0) return 'The server is unreachable. New changes are kept in this browser and sent when it is back.';
  const pending = pendingChanges === 1 ? '1 change is' : `${pendingChanges} changes are`;
  return `The server is unreachable. ${pending} kept in this browser and will be sent when it is back.`;
}
