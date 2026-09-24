import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, describeImportPlan, hasChanges, planImport } from '../src/services/backup.ts';
import { parseBackup } from '../src/validation.ts';
import { EXERCISE_DEFINITIONS } from '../src/data/seedData.ts';
import type { Snapshot } from '../src/services/sync.ts';
import type { WorkoutSession } from '../src/types/workout.ts';

function session(id: string, notes?: string): WorkoutSession {
  return {
    id,
    name: 'Legs',
    splitType: 'Legs',
    date: '2026-09-20',
    startTime: '2026-09-20T09:00:00.000Z',
    durationMinutes: 50,
    totalVolumeKg: 560,
    completed: true,
    ...(notes !== undefined && { notes }),
    exercises: [
      {
        exerciseId: 'squats',
        exerciseName: 'SQUATS',
        sets: [{ setNumber: 1, weightKg: 70, repsCompleted: 8, targetReps: '5–8', completed: true }]
      }
    ]
  };
}

function snapshot(...sessions: WorkoutSession[]): Snapshot {
  return { sessions, exercises: EXERCISE_DEFINITIONS };
}

const NOW = new Date('2026-09-24T12:00:00.000Z');

test('export then import gives the same sessions and exercises', () => {
  const data = snapshot(session('a'), session('b', 'Deep squats'));
  const file = JSON.parse(JSON.stringify(createBackup(data, NOW)));
  const parsed = parseBackup(file);
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.value, { format: 'gymmy-backup', version: 1, exportedAt: NOW.toISOString(), ...data });
});

test('reads a backup exported by Gymmy 1.0.0', () => {
  const legacyFile = {
    sessions: [session('a')],
    exercises: EXERCISE_DEFINITIONS,
    exportDate: '2026-09-10T08:00:00.000Z',
    appVersion: '1.0.0',
    database: 'SQLite (data/gymmy.db) + IndexedDB'
  };
  assert.deepEqual(parseBackup(legacyFile), {
    ok: true,
    value: { format: 'gymmy-backup', version: 1, exportedAt: '2026-09-10T08:00:00.000Z', ...snapshot(session('a')) }
  });
});

test('refuses files that are not a readable Gymmy backup', () => {
  const valid = createBackup(snapshot(session('a')), NOW);
  const CASES: [label: string, input: unknown, error: string][] = [
    ['a list', [], 'backup must be an object'],
    ['another app', { sessions: [] }, 'backup is not a Gymmy backup file'],
    ['a newer version', { ...valid, version: 2 }, 'backup.version is 2, which is newer than this app can read (1)'],
    ['a session without a date', { ...valid, sessions: [{ ...session('a'), date: undefined }] }, 'backup.sessions[0].date must be a string'],
    ['a bad rep range', { ...valid, exercises: [{ ...EXERCISE_DEFINITIONS[0], targetRepsMin: 9 }] }, 'backup.exercises[0].targetRepsMin must not be greater than targetRepsMax']
  ];
  for (const [label, input, error] of CASES) {
    assert.deepEqual(parseBackup(input), { ok: false, error }, label);
  }
});

test('an import adds new sessions and replaces changed ones', () => {
  const current = snapshot(session('same'), session('edited'));
  const backup = createBackup(snapshot(session('same'), session('edited', 'Changed'), session('new')), NOW);
  const plan = planImport(current, backup);
  assert.deepEqual(plan.newSessions.map(s => s.id), ['new']);
  assert.deepEqual(plan.replacedSessions.map(s => s.id), ['edited']);
  assert.equal(plan.unchangedSessionCount, 1);
  assert.equal(plan.exercises, null);
});

test('an import never removes sessions that are not in the backup', () => {
  const plan = planImport(snapshot(session('only-here')), createBackup(snapshot(), NOW));
  assert.equal(hasChanges(plan), false);
});

test('treats the same session with its keys in another order as unchanged', () => {
  const reordered = Object.fromEntries(Object.entries(session('a')).reverse()) as unknown as WorkoutSession;
  const plan = planImport(snapshot(reordered), createBackup(snapshot(session('a')), NOW));
  assert.equal(plan.unchangedSessionCount, 1);
});

test('an import updates exercise targets only when they differ', () => {
  const changed = EXERCISE_DEFINITIONS.map(e => (e.id === 'squats' ? { ...e, targetSets: 5 } : e));
  const plan = planImport(snapshot(), { ...createBackup(snapshot(), NOW), exercises: changed });
  assert.deepEqual(plan.exercises, changed);
});

test('describes what an import will change', () => {
  const CASES: [label: string, current: Snapshot, backupSessions: WorkoutSession[], expected: string][] = [
    ['nothing new', snapshot(session('a')), [session('a')], 'Nothing to import: this backup matches your current data.'],
    ['one new', snapshot(), [session('a')], '1 new session.'],
    ['mixed', snapshot(session('a'), session('b')), [session('a'), session('b', 'x'), session('c'), session('d')], '2 new sessions, 1 replaced session, 1 unchanged session.']
  ];
  for (const [label, current, sessions, expected] of CASES) {
    const plan = planImport(current, createBackup(snapshot(...sessions), NOW));
    assert.equal(describeImportPlan(plan), expected, label);
  }
});
