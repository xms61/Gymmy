# Browser storage and sync

Entry: `src/services/storage.ts`: `StorageService` holds the app's sessions and exercise definitions in the browser, and syncs them with the SQLite API (`server/SERVER.md`).
- `src/services/storage.ts`: the I/O. Reads and writes localStorage, calls `/api/*`, and notifies subscribers (`App.tsx`) when data or sync status changes.
- `src/services/sync.ts`: the pure rules, with tests. How a pending change applies to local data, which API call sends it, how a queue is sent in order, and which found sessions to adopt.
- `src/services/legacyIndexedDb.ts`: reads and deletes the IndexedDB store written by 1.0.0. Temporary; see Gotchas.

## Rules
- Components read through `getSessions()` / `getExerciseDefinitions()` and write through `saveSession`, `deleteSession`, `saveExerciseDefinitions`, `clearAllSessions` or `applyImport`. Never call `/api/*` or localStorage directly.
- Every write becomes a `PendingOp`. It is applied to the local copy at once, appended to the outbox, and removed from the outbox only after the server answers 2xx.
- The outbox is sent in order and stops at the first failure. A 400, 413 or 415 means the payload can never be stored: the op moves to `gymmy_rejected_ops_v1` (kept for recovery, logged) and the rest continue. Anything else stays queued.
- Refused ops and failed localStorage writes are shown, not only logged: `SyncStatus` carries `rejectedChanges` and `storageFailed`, the header badge adds "N not saved" or "browser storage full" with a warning dot, and Settings offers the refused ops as a JSON download before they can be dismissed (`RefusedChanges.tsx`).
- On start, `init()`:
  1. sends the outbox;
  2. loads `/api/data`;
  3. re-applies whatever is still queued on top of the server data. Unsynced local changes win, and offline deletes stay deleted.
- Every request gives up after 8 s (`AbortSignal.timeout`), so an unreachable address cannot hold up the outbox.
- While the app is open, it tries again when the browser goes back online, when the tab comes back to the front, and every 30 s: it runs the start sync again if that never reached the server, and otherwise sends whatever is queued.
- Tabs share the stored copy. When another tab writes it (`storage` event), this tab takes the stored sessions and outbox, so its next write builds on them. After a send, the ops that went out are removed by content (`withoutOps`), because the outbox may have changed while they were in flight.
- A new kind of write gets a new `PendingOp` variant in `sync.ts`, with its `applyOps` case, its `apiCallFor` case and tests.

## Data
| localStorage key | Holds |
|---|---|
| `gymmy_workout_sessions_v2` | Sessions, newest first. A cache of the server plus unsent changes. |
| `gymmy_exercise_definitions_v1` | Exercise definitions in routine order. |
| `gymmy_pending_ops_v1` | The outbox: `PendingOp[]` not yet stored by the server. |
| `gymmy_rejected_ops_v1` | Ops the server refused (400/413/415), kept so the data is not lost until the user downloads or dismisses them in Settings. |
| `gymmy_workout_draft_v1` | The workout in progress (`WorkoutDraft`). Owned by `src/components/tracker/workoutDraft.ts`, not `StorageService`: it is never synced, and is cleared when the workout is finished or left. |
| `gymmy_local_sessions_adopted_v1` | Timestamp. Set after the one-time check for sessions that 1.0.0 left only in localStorage. |

The key names are stored data: never rename them (see `AGENTS.md`).

## Backups
- One format both ways: `GymmyBackup` (`format: "gymmy-backup"`, `version: 1`). `createBackup` in `backup.ts` builds it, `parseBackup` in `src/validation.ts` reads it, and `backupFile.ts` handles the download and the chosen file.
- `parseBackup` applies the same `LIMITS` as the server, so a file with, say, a billion target sets is refused before it reaches the tracker.
- `parseBackup` also reads the unversioned 1.0.0 export (`appVersion: "1.0.0"`, `exportDate`). A new version must keep reading every older one, and refuses newer ones.
- An import is previewed first (`planImport`). It adds new sessions, replaces sessions with the same id when their content differs, and replaces the exercise targets when they differ. It never deletes. `applyImport` queues it through the outbox like any other change.

## Gotchas
- A browser upgraded from 1.0.0 can hold sessions that exist only in localStorage, because 1.0.0 dropped writes that failed. The first start that reaches the server queues every local session the server lacks, then sets `gymmy_local_sessions_adopted_v1`.
- A browser upgraded from 1.0.0 also has an IndexedDB copy (`gymmy_idb`). Each start moves any sessions missing from the local copy over, and deletes the database only when every one of its sessions is in localStorage **and** confirmed by the server. Otherwise it keeps the database and tries again next start. Remove `legacyIndexedDb.ts` and its call one release after 1.1.0.
- `readLegacySessions` aborts the upgrade when the database does not exist, because opening without a version would otherwise create an empty one.
- A static build (no API) queues every change forever. The header shows "Offline, N pending".

## Tests
- `tests/sync.test.ts`: offline saves survive a start and offline deletes stay deleted; sending is in order and stops at a failure; rejected ops are set aside; sent ops leave an outbox that changed meanwhile; status classification; adoption and its confirmation rule.
- `tests/backup.test.ts`: export and import round trip, reading 1.0.0 backups, refusing other files, and what an import adds, replaces or keeps.
