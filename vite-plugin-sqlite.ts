import type { Plugin } from 'vite';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Default baseline exercises from Sheet "List"
const DEFAULT_EXERCISES = [
  {
    id: 'flat-bench',
    name: 'FLAT BENCH',
    workout_type: 'Push',
    target_reps_min: 6,
    target_reps_max: 8,
    target_sets: 4,
    default_weight_kg: 60,
    default_rest_seconds: 150,
    equipment: 'barbell',
    warmup_required: 1,
    notes: 'Primary heavy chest press. Pause slightly at chest, drive through feet.'
  },
  {
    id: 'overhead-press',
    name: 'OVERHEAD PRESS',
    workout_type: 'Push',
    target_reps_min: 6,
    target_reps_max: 8,
    target_sets: 3,
    default_weight_kg: 25,
    default_rest_seconds: 120,
    equipment: 'barbell',
    warmup_required: 1,
    notes: 'Full lockout overhead. Squeeze glutes and core to protect lower back.'
  },
  {
    id: 'incline-db-press',
    name: 'INCLINE DB PRESS',
    workout_type: 'Push',
    target_reps_min: 8,
    target_reps_max: 12,
    target_sets: 3,
    default_weight_kg: 10,
    default_rest_seconds: 105,
    equipment: 'dumbbell',
    warmup_required: 0,
    notes: 'Set bench to 30-degree incline. Emphasize upper chest stretch.'
  },
  {
    id: 'lateral-raise',
    name: 'LATERAL RAISE',
    workout_type: 'Push',
    target_reps_min: 10,
    target_reps_max: 15,
    target_sets: 3,
    default_weight_kg: 5,
    default_rest_seconds: 75,
    equipment: 'dumbbell',
    warmup_required: 0,
    notes: 'Strict lateral abduction without shrugging traps. Lead with elbows.'
  },
  {
    id: 'skullcrusher',
    name: 'SKULLCRUSHER',
    workout_type: 'Push',
    target_reps_min: 8,
    target_reps_max: 12,
    target_sets: 3,
    default_weight_kg: 22.5,
    default_rest_seconds: 90,
    equipment: 'barbell',
    warmup_required: 0,
    notes: 'Lower bar just past crown of head for deep triceps long head stretch.'
  },
  {
    id: 'deadlifts',
    name: 'Deadlifts',
    workout_type: 'Pull',
    target_reps_min: 5,
    target_reps_max: 6,
    target_sets: 4,
    default_weight_kg: 100,
    default_rest_seconds: 180,
    equipment: 'barbell',
    warmup_required: 1,
    notes: 'Follow with Pull Ups (5 min break)'
  },
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    workout_type: 'Pull',
    target_reps_min: 6,
    target_reps_max: 10,
    target_sets: 3,
    default_weight_kg: 0,
    default_rest_seconds: 120,
    equipment: 'bodyweight',
    warmup_required: 0,
    notes: 'Full dead-hang at bottom, chest to bar at top. Log extra weight if weighted.'
  },
  {
    id: 'meadows-row',
    name: 'MEADOWS ROW',
    workout_type: 'Pull',
    target_reps_min: 8,
    target_reps_max: 12,
    target_sets: 3,
    default_weight_kg: 20,
    default_rest_seconds: 90,
    equipment: 'barbell',
    warmup_required: 0,
    notes: 'Staggered stance. Pull elbow back toward hip for maximum lat activation.'
  },
  {
    id: 'biceps-curl',
    name: 'BICEPS CURL',
    workout_type: 'Pull',
    target_reps_min: 8,
    target_reps_max: 12,
    target_sets: 3,
    default_weight_kg: 10,
    default_rest_seconds: 90,
    equipment: 'dumbbell',
    warmup_required: 0,
    notes: 'standing. No torso swinging, full supination at top.'
  },
  {
    id: 'squats',
    name: 'SQUATS',
    workout_type: 'Legs',
    target_reps_min: 5,
    target_reps_max: 8,
    target_sets: 4,
    default_weight_kg: 70,
    default_rest_seconds: 180,
    equipment: 'barbell',
    warmup_required: 1,
    notes: 'Break parallel depth, push knees out in line with toes.'
  },
  {
    id: 'calf-raises',
    name: 'CALF RAISES',
    workout_type: 'Legs',
    target_reps_min: 10,
    target_reps_max: 15,
    target_sets: 3,
    default_weight_kg: 60,
    default_rest_seconds: 75,
    equipment: 'machine',
    warmup_required: 0,
    notes: '2-second dead pause at deepest stretch, explosive contraction at peak.'
  },
  {
    id: 'rdl',
    name: 'RDL',
    workout_type: 'Legs',
    target_reps_min: 8,
    target_reps_max: 10,
    target_sets: 3,
    default_weight_kg: 50,
    default_rest_seconds: 120,
    equipment: 'barbell',
    warmup_required: 0,
    notes: 'Hinge hips back, soft knee bend, feel hamstring tension under stretch.'
  }
];

let dbInstance: DatabaseSync | null = null;

export function getDatabase(customDir?: string): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dataDir = customDir || path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'gymmy.db');
  console.log(`[Gymmy DB] Initializing SQLite database at ${dbPath}`);
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode for high performance concurrent reads and writes
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Create tables
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

  // Seed exercise definitions if empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM exercise_definitions');
  const result = countStmt.get() as { count: number };
  if (!result || result.count === 0) {
    console.log('[Gymmy DB] Seeding default exercise definitions...');
    const insertStmt = db.prepare(`
      INSERT INTO exercise_definitions (
        id, name, workout_type, target_reps_min, target_reps_max, target_sets,
        default_weight_kg, default_rest_seconds, equipment, warmup_required, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    for (const ex of DEFAULT_EXERCISES) {
      insertStmt.run(
        ex.id,
        ex.name,
        ex.workout_type,
        ex.target_reps_min,
        ex.target_reps_max,
        ex.target_sets,
        ex.default_weight_kg,
        ex.default_rest_seconds,
        ex.equipment,
        ex.warmup_required,
        ex.notes,
        now
      );
    }
    console.log(`[Gymmy DB] Seeded ${DEFAULT_EXERCISES.length} exercises successfully.`);
  }

  dbInstance = db;
  return db;
}

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function gymmySqlitePlugin(): Plugin {
  return {
    name: 'vite-plugin-gymmy-sqlite',
    configureServer(server) {
      const db = getDatabase();
      setupApiMiddleware(server.middlewares, db);
    },
    configurePreviewServer(server) {
      const db = getDatabase();
      setupApiMiddleware(server.middlewares, db);
    }
  };
}

function setupApiMiddleware(middlewares: any, db: DatabaseSync) {
  middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url || '';
    if (!url.startsWith('/api')) {
      return next();
    }

    try {
      const parsedUrl = new URL(url, 'http://localhost');
      const pathname = parsedUrl.pathname;
      const method = req.method?.toUpperCase();

      // GET /api/data: Fetch sessions and exercise definitions
      if (pathname === '/api/data' && method === 'GET') {
        const sessionsQuery = db.prepare('SELECT * FROM workout_sessions ORDER BY date DESC, created_at DESC');
        const sessionRows = sessionsQuery.all() as any[];

        const sessions = sessionRows.map(row => ({
          id: row.id,
          name: row.name,
          splitType: row.split_type,
          date: row.date,
          startTime: row.start_time,
          endTime: row.end_time || undefined,
          durationMinutes: row.duration_minutes,
          exercises: JSON.parse(row.exercises_json),
          totalVolumeKg: row.total_volume_kg,
          completed: Boolean(row.completed),
          notes: row.notes || undefined
        }));

        const exercisesQuery = db.prepare('SELECT * FROM exercise_definitions ORDER BY workout_type, name');
        const exerciseRows = exercisesQuery.all() as any[];

        const exercises = exerciseRows.map(row => ({
          id: row.id,
          name: row.name,
          workoutType: row.workout_type,
          targetRepsMin: row.target_reps_min,
          targetRepsMax: row.target_reps_max,
          targetSets: row.target_sets,
          defaultWeightKg: row.default_weight_kg,
          defaultRestSeconds: row.default_rest_seconds,
          equipment: row.equipment,
          warmupRequired: Boolean(row.warmup_required),
          notes: row.notes || undefined
        }));

        return sendJson(res, 200, { success: true, sessions, exercises });
      }

      // POST /api/sessions: Insert or update session
      if (pathname === '/api/sessions' && method === 'POST') {
        const session = await parseJsonBody(req);
        if (!session.id || !session.date || !session.splitType) {
          return sendJson(res, 400, { success: false, error: 'Missing required session fields' });
        }

        const upsert = db.prepare(`
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
        `);

        const now = new Date().toISOString();
        upsert.run(
          session.id,
          session.name || 'Workout',
          session.splitType,
          session.date,
          session.startTime || now,
          session.endTime || null,
          session.durationMinutes || 0,
          JSON.stringify(session.exercises || []),
          session.totalVolumeKg || 0,
          session.completed ? 1 : 0,
          session.notes || null,
          now
        );

        return sendJson(res, 200, { success: true, session });
      }

      // DELETE /api/sessions/:id
      if (pathname.startsWith('/api/sessions/') && method === 'DELETE') {
        const id = pathname.replace('/api/sessions/', '').trim();
        if (!id) {
          return sendJson(res, 400, { success: false, error: 'Session ID required' });
        }

        const del = db.prepare('DELETE FROM workout_sessions WHERE id = ?');
        del.run(id);
        return sendJson(res, 200, { success: true, deletedId: id });
      }

      // POST /api/exercises: Update exercise definitions
      if (pathname === '/api/exercises' && method === 'POST') {
        const body = await parseJsonBody(req);
        const list = Array.isArray(body) ? body : (body.exercises || [body]);
        const now = new Date().toISOString();

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

        for (const ex of list) {
          upsert.run(
            ex.id,
            ex.name,
            ex.workoutType,
            ex.targetRepsMin,
            ex.targetRepsMax,
            ex.targetSets,
            ex.defaultWeightKg,
            ex.defaultRestSeconds,
            ex.equipment,
            ex.warmupRequired ? 1 : 0,
            ex.notes || null,
            now
          );
        }

        return sendJson(res, 200, { success: true, count: list.length });
      }

      // POST /api/clear: Clear workout sessions
      if (pathname === '/api/clear' && method === 'POST') {
        db.exec('DELETE FROM workout_sessions');
        return sendJson(res, 200, { success: true, message: 'All workout sessions cleared' });
      }

      // POST /api/reset: Reset to factory seed
      if (pathname === '/api/reset' && method === 'POST') {
        db.exec('DELETE FROM workout_sessions');
        db.exec('DELETE FROM exercise_definitions');
        const insertStmt = db.prepare(`
          INSERT INTO exercise_definitions (
            id, name, workout_type, target_reps_min, target_reps_max, target_sets,
            default_weight_kg, default_rest_seconds, equipment, warmup_required, notes, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const now = new Date().toISOString();
        for (const ex of DEFAULT_EXERCISES) {
          insertStmt.run(
            ex.id,
            ex.name,
            ex.workout_type,
            ex.target_reps_min,
            ex.target_reps_max,
            ex.target_sets,
            ex.default_weight_kg,
            ex.default_rest_seconds,
            ex.equipment,
            ex.warmup_required,
            ex.notes,
            now
          );
        }
        return sendJson(res, 200, { success: true, message: 'Reset to factory seed' });
      }

      // Unhandled API route
      return sendJson(res, 404, { error: `Not found: ${method} ${pathname}` });
    } catch (err: any) {
      console.error('[Gymmy DB Error]', err);
      return sendJson(res, 500, { success: false, error: err.message || 'Internal database error' });
    }
  });
}
