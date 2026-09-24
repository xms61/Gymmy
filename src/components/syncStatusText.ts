// Wording for the sync status shown in the header badge and in Settings.
import type { SyncStatus } from '../services/sync.ts';

export function syncLabel(status: SyncStatus): string {
  return [connectionLabel(status), ...problemLabels(status)].join(', ');
}

export function describeSyncStatus(status: SyncStatus): string {
  return [describeConnection(status), ...describeProblems(status)].join(' ');
}

// Anything short of connected with every change saved shows the warning dot.
export function needsAttention({ connected, rejectedChanges, storageFailed }: SyncStatus): boolean {
  return !connected || rejectedChanges > 0 || storageFailed;
}

function connectionLabel({ connected, pendingChanges }: SyncStatus): string {
  if (connected) return 'SQLite';
  return pendingChanges > 0 ? `Offline, ${pendingChanges} pending` : 'Offline';
}

function problemLabels({ rejectedChanges, storageFailed }: SyncStatus): string[] {
  return [
    ...(rejectedChanges > 0 ? [`${rejectedChanges} not saved`] : []),
    ...(storageFailed ? ['browser storage full'] : [])
  ];
}

function describeConnection({ connected, pendingChanges }: SyncStatus): string {
  if (connected) return 'Saved to data/gymmy.db through the dev server.';
  if (pendingChanges === 0) return 'The server is unreachable. New changes are kept in this browser and sent when it is back.';
  const verb = pendingChanges === 1 ? 'is' : 'are';
  return `The server is unreachable. ${changes(pendingChanges)} ${verb} kept in this browser and will be sent when it is back.`;
}

function describeProblems({ rejectedChanges, storageFailed }: SyncStatus): string[] {
  return [
    ...(rejectedChanges > 0
      ? [`The server refused ${changes(rejectedChanges)}. They are kept in this browser; see Settings.`]
      : []),
    ...(storageFailed ? ['This browser could not save the latest changes, probably because its storage is full. Download a backup.'] : [])
  ];
}

function changes(count: number): string {
  return count === 1 ? '1 change' : `${count} changes`;
}
