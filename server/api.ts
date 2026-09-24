// Routes /api/* requests to the database. Kept free of HTTP plumbing so tests can call it
// directly with a plain request object.
import type { DatabaseSync } from 'node:sqlite';
import { parseExerciseDefinitions, parseWorkoutSession } from '../src/validation.ts';
import {
  clearSessions,
  deleteSession,
  listExercises,
  listSessions,
  resetToSeed,
  upsertExercises,
  upsertSession
} from './db.ts';

export interface ApiRequest {
  method: string;
  pathname: string;
  body?: unknown;
}

export interface ApiResponse {
  status: number;
  body: unknown;
}

const SESSION_PATH_PREFIX = '/api/sessions/';

export function handleApiRequest(db: DatabaseSync, request: ApiRequest): ApiResponse {
  try {
    return route(db, request);
  } catch (err) {
    console.error('[Gymmy DB] Request failed:', request.method, request.pathname, err);
    return { status: 500, body: { success: false, error: err instanceof Error ? err.message : 'Internal database error' } };
  }
}

function route(db: DatabaseSync, { method, pathname, body }: ApiRequest): ApiResponse {
  if (method === 'GET' && pathname === '/api/data') {
    return ok({ sessions: listSessions(db), exercises: listExercises(db) });
  }
  if (method === 'POST' && pathname === '/api/sessions') return saveSession(db, body);
  if (method === 'DELETE' && pathname.startsWith(SESSION_PATH_PREFIX)) {
    return removeSession(db, decodeURIComponent(pathname.slice(SESSION_PATH_PREFIX.length)));
  }
  if (method === 'POST' && pathname === '/api/exercises') return saveExercises(db, body);
  if (method === 'POST' && pathname === '/api/clear') {
    clearSessions(db);
    return ok({ message: 'All workout sessions cleared' });
  }
  if (method === 'POST' && pathname === '/api/reset') {
    resetToSeed(db);
    return ok({ message: 'Reset to factory seed' });
  }
  return { status: 404, body: { success: false, error: `Not found: ${method} ${pathname}` } };
}

function saveSession(db: DatabaseSync, body: unknown): ApiResponse {
  const parsed = parseWorkoutSession(body);
  if (!parsed.ok) return badRequest(parsed.error);
  upsertSession(db, parsed.value);
  return ok({ session: parsed.value });
}

function removeSession(db: DatabaseSync, id: string): ApiResponse {
  if (id.trim() === '') return badRequest('Session ID required');
  deleteSession(db, id);
  return ok({ deletedId: id });
}

function saveExercises(db: DatabaseSync, body: unknown): ApiResponse {
  const parsed = parseExerciseDefinitions(body);
  if (!parsed.ok) return badRequest(parsed.error);
  upsertExercises(db, parsed.value);
  return ok({ count: parsed.value.length });
}

function ok(fields: Record<string, unknown>): ApiResponse {
  return { status: 200, body: { success: true, ...fields } };
}

function badRequest(error: string): ApiResponse {
  return { status: 400, body: { success: false, error } };
}
