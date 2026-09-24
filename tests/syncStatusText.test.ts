import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeSyncStatus, needsAttention, syncLabel } from '../src/components/syncStatusText.ts';
import type { SyncStatus } from '../src/services/sync.ts';

function status(overrides: Partial<SyncStatus> = {}): SyncStatus {
  return { connected: true, pendingChanges: 0, rejectedChanges: 0, storageFailed: false, needsAccessKey: false, ...overrides };
}

test('labels the header badge with the connection and any unsaved changes', () => {
  const CASES: [label: string, input: SyncStatus, expected: string][] = [
    ['connected', status(), 'SQLite'],
    ['offline', status({ connected: false }), 'Offline'],
    ['offline with queued changes', status({ connected: false, pendingChanges: 3 }), 'Offline, 3 pending'],
    ['refused changes', status({ rejectedChanges: 2 }), 'SQLite, 2 not saved'],
    ['full storage', status({ storageFailed: true }), 'SQLite, browser storage full']
  ];
  for (const [label, input, expected] of CASES) {
    assert.equal(syncLabel(input), expected, label);
  }
});

test('explains refused changes and full storage after the connection', () => {
  assert.equal(
    describeSyncStatus(status({ connected: false, pendingChanges: 1, rejectedChanges: 1, storageFailed: true })),
    'The server is unreachable. 1 change is kept in this browser and will be sent when it is back. ' +
      'The server refused 1 change. They are kept in this browser; see Settings. ' +
      'This browser could not save the latest changes, probably because its storage is full. Download a backup.'
  );
  assert.equal(describeSyncStatus(status({ connected: false, pendingChanges: 2 })).includes('2 changes are kept'), true);
});

test('asks for attention unless connected with every change saved', () => {
  const CASES: [label: string, input: SyncStatus, expected: boolean][] = [
    ['all saved', status(), false],
    ['offline', status({ connected: false }), true],
    ['refused changes', status({ rejectedChanges: 1 }), true],
    ['full storage', status({ storageFailed: true }), true]
  ];
  for (const [label, input, expected] of CASES) {
    assert.equal(needsAttention(input), expected, label);
  }
});

test('asks for the access key instead of calling the server offline', () => {
  const refused = status({ connected: false, needsAccessKey: true, pendingChanges: 2 });
  assert.equal(syncLabel(refused), 'Needs access key, 2 pending');
  assert.equal(syncLabel(status({ connected: false, needsAccessKey: true })), 'Needs access key');
  assert.match(describeSyncStatus(refused), /#key=.*2 changes are kept/);
  assert.equal(needsAttention(refused), true);
});
