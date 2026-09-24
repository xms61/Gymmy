// Serves /api/* from the Vite dev and preview servers, backed by data/gymmy.db.
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DatabaseSync } from 'node:sqlite';
import type { Connect, Plugin } from 'vite';
import { handleApiRequest, type ApiResponse } from './api.ts';
import { DATABASE_FILE_NAME, openDatabase } from './db.ts';

const MAX_BODY_BYTES = 1024 * 1024;

class RequestBodyError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let database: DatabaseSync | null = null;

export function gymmySqlitePlugin(): Plugin {
  return {
    name: 'gymmy-sqlite-api',
    configureServer(server) {
      server.middlewares.use(apiMiddleware(getDatabase()));
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware(getDatabase()));
    }
  };
}

// One connection per process: Vite calls configureServer again when it restarts.
function getDatabase(): DatabaseSync {
  if (!database) {
    const dataDir = path.join(process.cwd(), 'data');
    console.log(`[Gymmy DB] Using ${path.join(dataDir, DATABASE_FILE_NAME)}`);
    database = openDatabase(dataDir);
  }
  return database;
}

function apiMiddleware(db: DatabaseSync): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = new URL(req.url ?? '', 'http://localhost');
    if (!url.pathname.startsWith('/api')) return next();

    readJsonBody(req)
      .then(body =>
        handleApiRequest(db, {
          method: req.method?.toUpperCase() ?? 'GET',
          pathname: url.pathname,
          host: req.headers.host,
          origin: req.headers.origin,
          contentType: req.headers['content-type'],
          body
        })
      )
      .catch((err: unknown): ApiResponse => {
        if (err instanceof RequestBodyError) return { status: err.status, body: { success: false, error: err.message } };
        console.error('[Gymmy DB] Could not read request body:', req.method, url.pathname, err);
        return { status: 500, body: { success: false, error: 'Could not read request body' } };
      })
      .then(response => sendJson(res, response));
  };
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    // An oversized body is read to the end but not kept, so the socket stays open for the 413.
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size <= MAX_BODY_BYTES) chunks.push(chunk);
    });
    req.on('end', () => {
      if (size > MAX_BODY_BYTES) return reject(new RequestBodyError(413, 'Request body is larger than 1 MB'));
      const text = Buffer.concat(chunks).toString('utf8');
      if (text === '') return resolve(undefined);
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new RequestBodyError(400, 'Request body is not valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, { status, body }: ApiResponse): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}
