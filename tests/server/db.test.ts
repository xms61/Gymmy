import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { listExercises, listSessions, openDatabase, upsertExercises } from '../../server/db.ts';
import { EXERCISE_DEFINITIONS } from '../../src/data/seedData.ts';
import type { ExerciseDefinition } from '../../src/types/workout.ts';

// The schema that Gymmy 1.0.0 created. Real databases start from this, so it must not change.
const VERSION_0_SCHEMA = `
  CREATE TABLE workout_sessions (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, split_type TEXT NOT NULL, date TEXT NOT NULL,
    start_time TEXT NOT NULL, end_time TEXT, duration_minutes INTEGER NOT NULL,
    exercises_json TEXT NOT NULL, total_volume_kg REAL NOT NULL,
    completed INTEGER NOT NULL DEFAULT 1, notes TEXT, created_at TEXT NOT NULL
  );
  CREATE TABLE exercise_definitions (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, workout_type TEXT NOT NULL,
    target_reps_min INTEGER NOT NULL, target_reps_max INTEGER NOT NULL, target_sets INTEGER NOT NULL,
    default_weight_kg REAL NOT NULL, default_rest_seconds INTEGER NOT NULL, equipment TEXT NOT NULL,
    warmup_required INTEGER DEFAULT 0, notes TEXT, updated_at TEXT NOT NULL
  );
`;

function tempDataDir(t: TestContext): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gymmy-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function createVersion0Database(dataDir: string): void {
  const db = new DatabaseSync(path.join(dataDir, 'gymmy.db'));
  db.exec(VERSION_0_SCHEMA);
  const insertExercise = db.prepare(`
    INSERT INTO exercise_definitions (id, name, workout_type, target_reps_min, target_reps_max, target_sets,
      default_weight_kg, default_rest_seconds, equipment, warmup_required, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2026-09-07T00:00:00.000Z')
  `);
  for (const e of EXERCISE_DEFINITIONS) {
    insertExercise.run(e.id, e.name, e.workoutType, e.targetRepsMin, e.targetRepsMax, e.targetSets,
      e.defaultWeightKg, e.defaultRestSeconds, e.equipment, e.warmupRequired ? 1 : 0, e.notes ?? null);
  }
  db.prepare(`
    INSERT INTO workout_sessions (id, name, split_type, date, start_time, duration_minutes,
      exercises_json, total_volume_kg, completed, created_at)
    VALUES ('old-session', 'Legs', 'Legs', '2026-09-10', '2026-09-10T08:00:00.000Z', 50, '[]', 0, 1, '2026-09-10T09:00:00.000Z')
  `).run();
  db.close();
}

function userVersion(file: string): number {
  const db = new DatabaseSync(file, { readOnly: true });
  // Safe: PRAGMA user_version always returns one row with a numeric user_version.
  const row = db.prepare('PRAGMA user_version').get() as unknown as { user_version: number };
  db.close();
  return row.user_version;
}

test('migrates a 1.0.0 database to routine order and keeps its sessions', t => {
  const dir = tempDataDir(t);
  createVersion0Database(dir);

  const db = openDatabase(dir);
  const exerciseIds = listExercises(db).map(e => e.id);
  const sessionIds = listSessions(db).map(s => s.id);
  db.close();

  assert.deepEqual(exerciseIds, EXERCISE_DEFINITIONS.map(e => e.id));
  assert.deepEqual(sessionIds, ['old-session']);
});

test('backs up a database before migrating it', t => {
  const dir = tempDataDir(t);
  createVersion0Database(dir);

  openDatabase(dir).close();

  const backup = path.join(dir, 'gymmy.before-schema-v1.db');
  assert.equal(userVersion(backup), 0);
  assert.equal(userVersion(path.join(dir, 'gymmy.db')), 1);
});

test('does not back up a new database', t => {
  const dir = tempDataDir(t);
  openDatabase(dir).close();
  assert.deepEqual(fs.readdirSync(dir).filter(name => name.includes('before-schema')), []);
});

test('reopening a migrated database changes nothing', t => {
  const dir = tempDataDir(t);
  createVersion0Database(dir);
  openDatabase(dir).close();

  const db = openDatabase(dir);
  const exerciseIds = listExercises(db).map(e => e.id);
  db.close();
  assert.deepEqual(exerciseIds, EXERCISE_DEFINITIONS.map(e => e.id));
});

test('saving exercises writes all of them or none', t => {
  const dir = tempDataDir(t);
  const db = openDatabase(dir);
  const [first, second] = EXERCISE_DEFINITIONS;
  const renamed = { ...first!, name: 'RENAMED' };
  // Deliberately invalid: the database must stay consistent even if bad data gets past validation.
  const broken = { ...second!, name: null } as unknown as ExerciseDefinition;

  assert.throws(() => upsertExercises(db, [renamed, broken]), /NOT NULL/);
  const storedName = listExercises(db).find(e => e.id === first!.id)?.name;
  db.close();
  assert.equal(storedName, first!.name);
});
