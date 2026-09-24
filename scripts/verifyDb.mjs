import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'gymmy.db');
console.log(`Connecting to SQLite database at: ${dbPath}`);

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');

// 1. Create tables
db.exec(`
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
`);

console.log('✓ Tables verified.');

// 2. Check exercise definitions count
const exCountStmt = db.prepare('SELECT COUNT(*) as count FROM exercise_definitions');
let exCount = exCountStmt.get().count;

if (exCount === 0) {
  console.log('Seeding 11 exercises from Sheet "List"...');
  const insertEx = db.prepare(`
    INSERT INTO exercise_definitions (
      id, name, workout_type, target_reps_min, target_reps_max, target_sets,
      default_weight_kg, default_rest_seconds, equipment, warmup_required, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const exercises = [
    ['flat-bench', 'FLAT BENCH', 'Push', 6, 8, 4, 60, 150, 'barbell', 1, 'Primary heavy chest press', new Date().toISOString()],
    ['overhead-press', 'OVERHEAD PRESS', 'Push', 6, 8, 3, 25, 120, 'barbell', 1, 'Full lockout overhead', new Date().toISOString()],
    ['incline-db-press', 'INCLINE DB PRESS', 'Push', 8, 12, 3, 10, 105, 'dumbbell', 0, 'Set bench to 30-degree', new Date().toISOString()],
    ['lateral-raise', 'LATERAL RAISE', 'Push', 10, 15, 3, 5, 75, 'dumbbell', 0, 'Strict lateral abduction', new Date().toISOString()],
    ['skullcrusher', 'SKULLCRUSHER', 'Push', 8, 12, 3, 22.5, 90, 'barbell', 0, 'Lower bar past crown', new Date().toISOString()],
    ['deadlifts', 'Deadlifts', 'Pull', 5, 6, 4, 100, 180, 'barbell', 1, 'Follow with Pull Ups', new Date().toISOString()],
    ['pull-ups', 'Pull-Ups', 'Pull', 6, 10, 3, 0, 120, 'bodyweight', 0, 'Full dead-hang', new Date().toISOString()],
    ['meadows-row', 'MEADOWS ROW', 'Pull', 8, 12, 3, 20, 90, 'barbell', 0, 'Staggered stance', new Date().toISOString()],
    ['biceps-curl', 'BICEPS CURL', 'Pull', 8, 12, 3, 10, 90, 'dumbbell', 0, 'Standing curls', new Date().toISOString()],
    ['squats', 'SQUATS', 'Legs', 5, 8, 4, 70, 180, 'barbell', 1, 'Break parallel depth', new Date().toISOString()],
    ['calf-raises', 'CALF RAISES', 'Legs', 10, 15, 3, 60, 75, 'machine', 0, '2-second pause', new Date().toISOString()],
    ['rdl', 'RDL', 'Legs', 8, 10, 3, 50, 120, 'barbell', 0, 'Hinge hips back', new Date().toISOString()]
  ];

  for (const ex of exercises) {
    insertEx.run(...ex);
  }
  exCount = exCountStmt.get().count;
}

console.log(`✓ Exercise definitions in DB: ${exCount} (Expected: 12 total from Sheet List)`);

// 3. Test Workout Session Insert, Read, and Clean Slate
const testSessionId = 'test-session-' + Date.now();
const insertSession = db.prepare(`
  INSERT INTO workout_sessions (
    id, name, split_type, date, start_time, end_time, duration_minutes,
    exercises_json, total_volume_kg, completed, notes, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertSession.run(
  testSessionId,
  'Push Test Session',
  'Push',
  '2026-09-07',
  new Date().toISOString(),
  new Date().toISOString(),
  45,
  JSON.stringify([
    {
      exerciseId: 'flat-bench',
      exerciseName: 'FLAT BENCH',
      sets: [{ setNumber: 1, weightKg: 60, repsCompleted: 8, targetReps: '6-8', completed: true }]
    }
  ]),
  480,
  1,
  'Test session for local db verification',
  new Date().toISOString()
);

const checkStmt = db.prepare('SELECT * FROM workout_sessions WHERE id = ?');
const fetched = checkStmt.get(testSessionId);
if (!fetched || fetched.name !== 'Push Test Session') {
  console.error('FAIL: Could not fetch inserted session');
  process.exit(1);
}
console.log('✓ Successfully inserted and verified test workout session in data/gymmy.db');

// Clean up test session to keep clean slate
db.prepare('DELETE FROM workout_sessions WHERE id = ?').run(testSessionId);
console.log('✓ Clean slate preserved: test session removed.');

console.log('\n=== ALL DATABASE TESTS PASSED SUCCESSFULLY ===');
