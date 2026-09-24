// Serves /api/* from the Vite dev and preview servers, backed by data/gymmy.db.
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DatabaseSync } from 'node:sqlite';
import type { Connect, Plugin, PreviewServer, ViteDevServer } from 'vite';
import { handleApiRequest, type ApiContext, type ApiResponse } from './api.ts';
import { DATABASE_FILE_NAME, openDatabase } from './db.ts';
import { isLoopbackAddress, loadAccessKey } from './accessKey.ts';

const MAX_BODY_BYTES = 1024 * 1024;

class RequestBodyError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let context: ApiContext | null = null;

export function gymmySqlitePlugin(): Plugin {
  return {
    name: 'gymmy-sqlite-api',
    configureServer(server) {
      server.middlewares.use(apiMiddleware(getContext()));
      printAccessLinks(server);
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware(getContext()));
      printAccessLinks(server);
    }
  };
}

// One connection per process: Vite calls configureServer again when it restarts.
function getContext(): ApiContext {
  if (!context) {
    const dataDir = path.join(process.cwd(), 'data');
    console.log(`[Gymmy DB] Using ${path.join(dataDir, DATABASE_FILE_NAME)}`);
    const db: DatabaseSync = openDatabase(dataDir);
    context = { db, accessKey: loadAccessKey(dataDir) };
  }
  return context;
}

// With `--host`, other devices need the access key. The key rides in the #fragment, which browsers
// never send to the server, and the app moves it into localStorage on first open.
function printAccessLinks(server: ViteDevServer | PreviewServer): void {
  server.httpServer?.once('listening', () => {
    setTimeout(() => {
      for (const url of server.resolvedUrls?.network ?? []) {
        console.log(`[Gymmy] On another device, open ${url}#key=${getContext().accessKey}`);
      }
    });
  });
}

function apiMiddleware(api: ApiContext): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = new URL(req.url ?? '', 'http://localhost');
    if (!url.pathname.startsWith('/api')) return next();

    readJsonBody(req)
      .then(body =>
        handleApiRequest(api, {
          method: req.method?.toUpperCase() ?? 'GET',
          pathname: url.pathname,
          host: req.headers.host,
          origin: req.headers.origin,
          contentType: req.headers['content-type'],
          fromThisMachine: isLoopbackAddress(req.socket.remoteAddress),
          accessKey: headerValue(req.headers['x-gymmy-key']),
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

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function sendJson(res: ServerResponse, { status, body }: ApiResponse): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}
