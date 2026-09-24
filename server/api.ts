// Routes /api/* requests to the database. Kept free of HTTP plumbing so tests can call it
// directly with a plain request object.
import { isIP } from 'node:net';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { parseExerciseDefinitions, parseWorkoutSession } from '../src/validation.ts';
import {
  clearSessions,
  deleteSession,
  listExercises,
  listSessions,
  upsertExercises,
  upsertSession
} from './db.ts';
import { keysMatch } from './accessKey.ts';

export interface ApiRequest {
  method: string;
  pathname: string;
  host?: string;
  origin?: string;
  contentType?: string;
  fromThisMachine: boolean; // the connection comes from the loopback address
  accessKey?: string; // the X-Gymmy-Key header
  body?: unknown;
}

// What the API answers with: the database, and the key other devices must send.
export interface ApiContext {
  db: DatabaseSync;
  accessKey: string;
}

export interface ApiResponse {
  status: number;
  body: unknown;
}

const SESSION_PATH_PREFIX = '/api/sessions/';

export function handleApiRequest({ db, accessKey }: ApiContext, request: ApiRequest): ApiResponse {
  try {
    return rejectUntrustedRequest(request, accessKey) ?? route(db, request);
  } catch (err) {
    // The details go to the server log only: they can hold SQL and file paths.
    console.error('[Gymmy DB] Request failed:', request.method, request.pathname, err);
    return { status: 500, body: { success: false, error: 'Internal database error' } };
  }
}

function route(db: DatabaseSync, { method, pathname, body }: ApiRequest): ApiResponse {
  if (method === 'GET' && pathname === '/api/data') {
    return ok({ sessions: listSessions(db), exercises: listExercises(db) });
  }
  if (method === 'POST' && pathname === '/api/sessions') return saveSession(db, body);
  if (method === 'DELETE' && pathname.startsWith(SESSION_PATH_PREFIX)) {
    const id = decodePathSegment(pathname.slice(SESSION_PATH_PREFIX.length));
    return id === null ? badRequest('Session ID is not valid URI encoding') : removeSession(db, id);
  }
  if (method === 'POST' && pathname === '/api/exercises') return saveExercises(db, body);
  if (method === 'POST' && pathname === '/api/clear') {
    const backupFile = clearSessions(db);
    return ok({ message: 'All workout sessions cleared', backup: path.basename(backupFile) });
  }
  return { status: 404, body: { success: false, error: `Not found: ${method} ${pathname}` } };
}

// The API has no login, so it only answers the app itself:
// - Host must be localhost or an IP address. A DNS-rebinding page reaches the server under
//   its own domain name, which this rejects. IP addresses stay allowed for `vite --host`.
// - A client on another device (with `vite --host`) must send the access key. Clients on this
//   machine need none.
// - Origin, when the browser sends one, must be this server. Browsers always send it on
//   cross-site requests, including the simple POSTs that skip CORS preflight.
// - POST bodies must be JSON, which forces a preflight on any cross-site attempt.
function rejectUntrustedRequest(request: ApiRequest, accessKey: string): ApiResponse | null {
  const { method, host, origin, contentType } = request;
  if (!isLocalHost(host)) return forbidden('Host is not allowed');
  if (!request.fromThisMachine && !keysMatch(request.accessKey, accessKey)) {
    return { status: 401, body: { success: false, error: 'Open the link with the access key that the server printed' } };
  }
  if (origin !== undefined && !isSameOrigin(origin, host)) return forbidden('Requests from other sites are not allowed');
  if (method === 'POST' && !isJson(contentType)) {
    return { status: 415, body: { success: false, error: 'Content-Type must be application/json' } };
  }
  return null;
}

function isLocalHost(host: string | undefined): host is string {
  const hostname = parseUrl(`http://${host ?? ''}`)?.hostname;
  if (!hostname) return false;
  return hostname === 'localhost' || hostname.endsWith('.localhost') || isIP(hostname.replace(/^\[|\]$/g, '')) !== 0;
}

function isSameOrigin(origin: string, host: string): boolean {
  return parseUrl(origin)?.host === host;
}

function isJson(contentType: string | undefined): boolean {
  return contentType?.split(';')[0]?.trim().toLowerCase() === 'application/json';
}

function decodePathSegment(text: string): string | null {
  try {
    return decodeURIComponent(text);
  } catch {
    return null;
  }
}

function parseUrl(text: string): URL | null {
  return URL.canParse(text) ? new URL(text) : null;
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

function forbidden(error: string): ApiResponse {
  return { status: 403, body: { success: false, error } };
}
