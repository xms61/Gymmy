// Owns the SQLite file: its schema, the seed routine and every query the API runs.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { EXERCISE_DEFINITIONS } from '../src/data/seedData.ts';
import type {
  EquipmentType,
  ExerciseDefinition,
  ExerciseSessionLog,
  SplitType,
  WorkoutSession
} from '../src/types/workout.ts';

export const DATABASE_FILE_NAME = 'gymmy.db';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    split_type TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration_minutes INTEGER NOT NULL,
    exercises_json TEXT NOT NULL,
    total_volume_kg REAL NOT NULL,
    completed INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exercise_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    workout_type TEXT NOT NULL,
    target_reps_min INTEGER NOT NULL,
    target_reps_max INTEGER NOT NULL,
    target_sets INTEGER NOT NULL,
    default_weight_kg REAL NOT NULL,
    default_rest_seconds INTEGER NOT NULL,
    equipment TEXT NOT NULL,
    warmup_required INTEGER DEFAULT 0,
    notes TEXT,
    updated_at TEXT NOT NULL
  );
`;

interface SessionRow {
  id: string;
  name: string;
  split_type: string;
  date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  exercises_json: string;
  total_volume_kg: number;
  completed: number;
  notes: string | null;
  created_at: string;
}

interface ExerciseRow {
  id: string;
  name: string;
  workout_type: string;
  target_reps_min: number;
  target_reps_max: number;
  target_sets: number;
  default_weight_kg: number;
  default_rest_seconds: number;
  equipment: string;
  warmup_required: number | null;
  notes: string | null;
  updated_at: string;
}

export function openDatabase(dataDir: string): DatabaseSync {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, DATABASE_FILE_NAME));
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  if (countExercises(db) === 0) upsertExercises(db, EXERCISE_DEFINITIONS);
  return db;
}

export function listSessions(db: DatabaseSync): WorkoutSession[] {
  // Safe: the schema above defines exactly these columns.
  const rows = db.prepare('SELECT * FROM workout_sessions ORDER BY date DESC, created_at DESC').all() as unknown as SessionRow[];
  return rows.map(sessionFromRow);
}

export function listExercises(db: DatabaseSync): ExerciseDefinition[] {
  // Safe: the schema above defines exactly these columns.
  const rows = db.prepare('SELECT * FROM exercise_definitions ORDER BY workout_type, name').all() as unknown as ExerciseRow[];
  return rows.map(exerciseFromRow);
}

export function upsertSession(db: DatabaseSync, session: WorkoutSession): void {
  db.prepare(`
    INSERT INTO workout_sessions (
      id, name, split_type, date, start_time, end_time, duration_minutes,
      exercises_json, total_volume_kg, completed, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      split_type = excluded.split_type,
      date = excluded.date,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      duration_minutes = excluded.duration_minutes,
      exercises_json = excluded.exercises_json,
      total_volume_kg = excluded.total_volume_kg,
      completed = excluded.completed,
      notes = excluded.notes
  `).run(
    session.id,
    session.name,
    session.splitType,
    session.date,
    session.startTime,
    session.endTime ?? null,
    session.durationMinutes,
    JSON.stringify(session.exercises),
    session.totalVolumeKg,
    session.completed ? 1 : 0,
    session.notes || null,
    new Date().toISOString()
  );
}

export function deleteSession(db: DatabaseSync, id: string): void {
  db.prepare('DELETE FROM workout_sessions WHERE id = ?').run(id);
}

export function clearSessions(db: DatabaseSync): void {
  db.exec('DELETE FROM workout_sessions');
}

export function upsertExercises(db: DatabaseSync, exercises: ExerciseDefinition[]): void {
  const upsert = db.prepare(`
    INSERT INTO exercise_definitions (
      id, name, workout_type, target_reps_min, target_reps_max, target_sets,
      default_weight_kg, default_rest_seconds, equipment, warmup_required, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      workout_type = excluded.workout_type,
      target_reps_min = excluded.target_reps_min,
      target_reps_max = excluded.target_reps_max,
      target_sets = excluded.target_sets,
      default_weight_kg = excluded.default_weight_kg,
      default_rest_seconds = excluded.default_rest_seconds,
      equipment = excluded.equipment,
      warmup_required = excluded.warmup_required,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `);
  const now = new Date().toISOString();
  for (const exercise of exercises) {
    upsert.run(
      exercise.id,
      exercise.name,
      exercise.workoutType,
      exercise.targetRepsMin,
      exercise.targetRepsMax,
      exercise.targetSets,
      exercise.defaultWeightKg,
      exercise.defaultRestSeconds,
      exercise.equipment,
      exercise.warmupRequired ? 1 : 0,
      exercise.notes || null,
      now
    );
  }
}

export function resetToSeed(db: DatabaseSync): void {
  db.exec('DELETE FROM workout_sessions');
  db.exec('DELETE FROM exercise_definitions');
  upsertExercises(db, EXERCISE_DEFINITIONS);
}

function countExercises(db: DatabaseSync): number {
  // Safe: COUNT(*) AS count always returns one row with a numeric count.
  const row = db.prepare('SELECT COUNT(*) AS count FROM exercise_definitions').get() as unknown as { count: number };
  return row.count;
}

// The casts below are safe because rows are only ever written from validated sessions and
// exercise definitions (see src/validation.ts) or from the seed data.
function sessionFromRow(row: SessionRow): WorkoutSession {
  return {
    id: row.id,
    name: row.name,
    splitType: row.split_type as SplitType,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time || undefined,
    durationMinutes: row.duration_minutes,
    exercises: JSON.parse(row.exercises_json) as ExerciseSessionLog[],
    totalVolumeKg: row.total_volume_kg,
    completed: Boolean(row.completed),
    notes: row.notes || undefined
  };
}

function exerciseFromRow(row: ExerciseRow): ExerciseDefinition {
  return {
    id: row.id,
    name: row.name,
    workoutType: row.workout_type as SplitType,
    targetRepsMin: row.target_reps_min,
    targetRepsMax: row.target_reps_max,
    targetSets: row.target_sets,
    defaultWeightKg: row.default_weight_kg,
    defaultRestSeconds: row.default_rest_seconds,
    equipment: row.equipment as EquipmentType,
    warmupRequired: Boolean(row.warmup_required),
    notes: row.notes || undefined
  };
}
