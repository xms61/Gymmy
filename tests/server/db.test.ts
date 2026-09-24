import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { clearSessions, listExercises, listSessions, openDatabase, upsertExercises, upsertSession } from '../../server/db.ts';
import { EXERCISE_DEFINITIONS } from '../../src/data/seedData.ts';
import type { ExerciseDefinition, WorkoutSession } from '../../src/types/workout.ts';

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

  const backup = path.join(dir, 'gymmy.before-schema-v2.db');
  assert.equal(userVersion(backup), 0);
  assert.equal(userVersion(path.join(dir, 'gymmy.db')), 2);
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

function legsSession(id: string): WorkoutSession {
  return {
    id,
    name: 'Legs',
    splitType: 'Legs',
    date: '2026-09-22',
    startTime: '2026-09-22T17:00:00.000Z',
    durationMinutes: 50,
    totalVolumeKg: 560,
    completed: true,
    exercises: [{ exerciseId: 'squats', exerciseName: 'SQUATS', sets: [{ setNumber: 1, weightKg: 70, repsCompleted: 8, targetReps: '5–8', completed: true }] }]
  };
}

test('clearing sessions keeps a copy of the database from just before', t => {
  const dir = tempDataDir(t);
  const db = openDatabase(dir);
  upsertSession(db, legsSession('kept-in-backup'));
  const backupFile = clearSessions(db, new Date('2026-09-24T16:20:05.123Z'));
  assert.deepEqual(listSessions(db), []);
  db.close();

  assert.equal(backupFile, path.join(dir, 'gymmy.before-clear-2026-09-24T16-20-05-123Z.db'));
  const copy = new DatabaseSync(backupFile, { readOnly: true });
  const rows = copy.prepare('SELECT id FROM workout_sessions').all();
  copy.close();
  assert.deepEqual(rows.map(row => row.id), ['kept-in-backup']);
});

// Stored definitions as 1.x wrote them, before the seed matched the home equipment.
function setStoredEquipment(dataDir: string, equipmentById: Record<string, string>): void {
  const db = new DatabaseSync(path.join(dataDir, 'gymmy.db'));
  const update = db.prepare('UPDATE exercise_definitions SET equipment = ? WHERE id = ?');
  for (const [id, equipment] of Object.entries(equipmentById)) update.run(equipment, id);
  db.close();
}

function storedEquipment(dataDir: string): Record<string, string> {
  const db = openDatabase(dataDir);
  const equipment = Object.fromEntries(listExercises(db).map(e => [e.id, e.equipment]));
  db.close();
  return equipment;
}

test('moves Calf Raises to the barbell and Meadows Row to the landmine', t => {
  const dir = tempDataDir(t);
  createVersion0Database(dir);
  setStoredEquipment(dir, { 'calf-raises': 'machine', 'meadows-row': 'barbell' });

  const equipment = storedEquipment(dir);
  assert.equal(equipment['calf-raises'], 'barbell');
  assert.equal(equipment['meadows-row'], 'landmine');
});

test('leaves equipment the user already changed', t => {
  const dir = tempDataDir(t);
  createVersion0Database(dir);
  setStoredEquipment(dir, { 'calf-raises': 'dumbbell', 'meadows-row': 'bodyweight' });

  const equipment = storedEquipment(dir);
  assert.equal(equipment['calf-raises'], 'dumbbell');
  assert.equal(equipment['meadows-row'], 'bodyweight');
});
