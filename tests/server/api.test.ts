import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { handleApiRequest, type ApiRequest } from '../../server/api.ts';
import { openDatabase } from '../../server/db.ts';
import { EXERCISE_DEFINITIONS } from '../../src/data/seedData.ts';
import type { ExerciseDefinition, WorkoutSession } from '../../src/types/workout.ts';

interface DataBody {
  sessions: WorkoutSession[];
  exercises: ExerciseDefinition[];
}

// Databases must be closed before this cleanup runs: Windows can't delete an open file.
function tempDataDir(t: TestContext): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gymmy-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function emptyDatabase(t: TestContext): DatabaseSync {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gymmy-'));
  const db = openDatabase(dir);
  t.after(() => {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return db;
}

function pushSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: 'session-1',
    name: 'Push',
    splitType: 'Push',
    date: '2026-09-21',
    startTime: '2026-09-21T17:00:00.000Z',
    endTime: '2026-09-21T18:05:00.000Z',
    durationMinutes: 65,
    totalVolumeKg: 960,
    completed: true,
    notes: 'Felt strong',
    exercises: [
      {
        exerciseId: 'flat-bench',
        exerciseName: 'FLAT BENCH',
        equipment: 'barbell',
        sets: [
          { setNumber: 1, weightKg: 60, repsCompleted: 8, targetReps: '6–8', completed: true },
          { setNumber: 2, weightKg: 60, repsCompleted: 8, targetReps: '6–8', completed: true }
        ]
      }
    ],
    ...overrides
  };
}

// What the app itself sends: same-origin requests to the dev server with JSON bodies.
const SAME_ORIGIN = { host: 'localhost:3000', origin: 'http://localhost:3000', contentType: 'application/json' };

function send(db: DatabaseSync, request: ApiRequest) {
  return handleApiRequest(db, { ...SAME_ORIGIN, ...request });
}

function fetchData(db: DatabaseSync): DataBody {
  const response = send(db, { method: 'GET', pathname: '/api/data' });
  assert.equal(response.status, 200);
  return response.body as DataBody;
}

function sortedIds(items: { id: string }[]): string[] {
  return items.map(item => item.id).sort();
}

test('seeds the routine into a new database', t => {
  const data = fetchData(emptyDatabase(t));
  assert.deepEqual(data.sessions, []);
  assert.deepEqual(sortedIds(data.exercises), sortedIds(EXERCISE_DEFINITIONS));
});

test('returns exercises in routine order', t => {
  const exercises = fetchData(emptyDatabase(t)).exercises;
  const namesOf = (split: string) => exercises.filter(e => e.workoutType === split).map(e => e.name);
  assert.deepEqual(namesOf('Legs'), ['SQUATS', 'CALF RAISES', 'RDL']);
  assert.deepEqual(namesOf('Pull'), ['Deadlifts', 'Pull-Ups', 'MEADOWS ROW', 'BICEPS CURL']);
  assert.deepEqual(namesOf('Push'), ['FLAT BENCH', 'OVERHEAD PRESS', 'INCLINE DB PRESS', 'LATERAL RAISE', 'SKULLCRUSHER']);
});

test('keeps the order in which exercises are saved', t => {
  const db = emptyDatabase(t);
  const reversed = [...EXERCISE_DEFINITIONS].reverse();
  send(db, { method: 'POST', pathname: '/api/exercises', body: reversed });
  assert.deepEqual(fetchData(db).exercises.map(e => e.id), reversed.map(e => e.id));
});

test('keeps edited exercises when an existing database is reopened', t => {
  const dir = tempDataDir(t);
  const first = openDatabase(dir);
  const edited = EXERCISE_DEFINITIONS.map(e => (e.id === 'squats' ? { ...e, targetSets: 5 } : e));
  send(first, { method: 'POST', pathname: '/api/exercises', body: edited });
  first.close();

  const reopened = openDatabase(dir);
  const exercises = fetchData(reopened).exercises;
  reopened.close();
  assert.equal(exercises.length, EXERCISE_DEFINITIONS.length);
  assert.equal(exercises.find(e => e.id === 'squats')?.targetSets, 5);
});

test('saves a session and returns it unchanged', t => {
  const db = emptyDatabase(t);
  const session = pushSession();
  const saved = send(db, { method: 'POST', pathname: '/api/sessions', body: session });
  assert.equal(saved.status, 200);
  assert.deepEqual(fetchData(db).sessions, [session]);
});

test('saving a session with an existing id replaces it', t => {
  const db = emptyDatabase(t);
  send(db, { method: 'POST', pathname: '/api/sessions', body: pushSession() });
  send(db, { method: 'POST', pathname: '/api/sessions', body: pushSession({ notes: 'Edited' }) });
  const sessions = fetchData(db).sessions;
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0]?.notes, 'Edited');
});

test('lists sessions newest date first', t => {
  const db = emptyDatabase(t);
  for (const [id, date] of [['a', '2026-09-01'], ['b', '2026-09-15'], ['c', '2026-09-08']]) {
    send(db, { method: 'POST', pathname: '/api/sessions', body: pushSession({ id, date }) });
  }
  assert.deepEqual(fetchData(db).sessions.map(s => s.date), ['2026-09-15', '2026-09-08', '2026-09-01']);
});

test('deletes a session by id', t => {
  const db = emptyDatabase(t);
  send(db, { method: 'POST', pathname: '/api/sessions', body: pushSession({ id: 'keep' }) });
  send(db, { method: 'POST', pathname: '/api/sessions', body: pushSession({ id: 'drop me' }) });
  const response = send(db, { method: 'DELETE', pathname: '/api/sessions/drop%20me' });
  assert.equal(response.status, 200);
  assert.deepEqual(sortedIds(fetchData(db).sessions), ['keep']);
});

test('rejects an invalid session without saving it', t => {
  const db = emptyDatabase(t);
  const response = send(db, { method: 'POST', pathname: '/api/sessions', body: { ...pushSession(), date: undefined } });
  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { success: false, error: 'session.date must be a string' });
  assert.deepEqual(fetchData(db).sessions, []);
});

test('rejects a delete without a session id', t => {
  const response = send(emptyDatabase(t), { method: 'DELETE', pathname: '/api/sessions/' });
  assert.equal(response.status, 400);
});

test('saves changed exercise targets', t => {
  const db = emptyDatabase(t);
  const edited = EXERCISE_DEFINITIONS.map(e => (e.id === 'rdl' ? { ...e, targetRepsMin: 6, targetRepsMax: 8 } : e));
  const response = send(db, { method: 'POST', pathname: '/api/exercises', body: edited });
  assert.deepEqual(response.body, { success: true, count: EXERCISE_DEFINITIONS.length });
  const rdl = fetchData(db).exercises.find(e => e.id === 'rdl');
  assert.deepEqual([rdl?.targetRepsMin, rdl?.targetRepsMax], [6, 8]);
});

test('rejects exercise targets that are not a list', t => {
  const response = send(emptyDatabase(t), { method: 'POST', pathname: '/api/exercises', body: EXERCISE_DEFINITIONS[0] });
  assert.equal(response.status, 400);
});

test('clearing removes every session and keeps the exercises', t => {
  const db = emptyDatabase(t);
  send(db, { method: 'POST', pathname: '/api/sessions', body: pushSession() });
  assert.equal(send(db, { method: 'POST', pathname: '/api/clear' }).status, 200);
  const data = fetchData(db);
  assert.deepEqual(data.sessions, []);
  assert.equal(data.exercises.length, EXERCISE_DEFINITIONS.length);
});

test('reset removes sessions and restores the seed targets', t => {
  const db = emptyDatabase(t);
  send(db, { method: 'POST', pathname: '/api/sessions', body: pushSession() });
  const edited = EXERCISE_DEFINITIONS.map(e => ({ ...e, targetSets: 9 }));
  send(db, { method: 'POST', pathname: '/api/exercises', body: edited });

  assert.equal(send(db, { method: 'POST', pathname: '/api/reset' }).status, 200);
  const data = fetchData(db);
  assert.deepEqual(data.sessions, []);
  assert.deepEqual(data.exercises.map(e => e.targetSets).sort(), EXERCISE_DEFINITIONS.map(e => e.targetSets).sort());
});

test('answers 404 for an unknown route', t => {
  const response = send(emptyDatabase(t), { method: 'GET', pathname: '/api/nope' });
  assert.deepEqual(response, { status: 404, body: { success: false, error: 'Not found: GET /api/nope' } });
});

test('accepts requests addressed to localhost or an IP address', t => {
  const db = emptyDatabase(t);
  for (const host of ['localhost:3000', 'gymmy.localhost:3000', '127.0.0.1:3000', '[::1]:3000', '192.168.1.20:3000']) {
    const response = send(db, { method: 'GET', pathname: '/api/data', host, origin: undefined });
    assert.equal(response.status, 200, host);
  }
});

test('rejects requests addressed to another host name (DNS rebinding)', t => {
  const db = emptyDatabase(t);
  for (const host of ['evil.example:3000', 'localhost.evil.example', undefined]) {
    const response = send(db, { method: 'GET', pathname: '/api/data', host, origin: undefined });
    assert.deepEqual(response, { status: 403, body: { success: false, error: 'Host is not allowed' } }, String(host));
  }
});

test('rejects requests sent by another site', t => {
  const db = emptyDatabase(t);
  send(db, { method: 'POST', pathname: '/api/sessions', body: pushSession() });
  for (const origin of ['https://evil.example', 'http://localhost:5173', 'null']) {
    const response = send(db, { method: 'POST', pathname: '/api/clear', origin });
    assert.deepEqual(response, { status: 403, body: { success: false, error: 'Requests from other sites are not allowed' } }, origin);
  }
  assert.equal(fetchData(db).sessions.length, 1);
});

test('rejects reads by another local site', t => {
  const response = send(emptyDatabase(t), { method: 'GET', pathname: '/api/data', origin: 'http://localhost:5173' });
  assert.equal(response.status, 403);
});

test('rejects a POST that is not JSON', t => {
  const db = emptyDatabase(t);
  for (const contentType of ['text/plain', 'application/x-www-form-urlencoded', undefined]) {
    const response = send(db, { method: 'POST', pathname: '/api/sessions', contentType, body: pushSession() });
    assert.deepEqual(response, { status: 415, body: { success: false, error: 'Content-Type must be application/json' } }, String(contentType));
  }
  assert.deepEqual(fetchData(db).sessions, []);
});

test('accepts a JSON content type with parameters', t => {
  const response = send(emptyDatabase(t), {
    method: 'POST',
    pathname: '/api/sessions',
    contentType: 'application/json; charset=utf-8',
    body: pushSession()
  });
  assert.equal(response.status, 200);
});
