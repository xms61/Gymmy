# Server (SQLite API)

Entry: `server/vitePlugin.ts`: a Vite plugin that serves `/api/*` from the dev and preview servers, backed by `data/gymmy.db`. There is no separate backend process; a static `dist/` build has no API.
- `server/vitePlugin.ts`: HTTP plumbing only. Reads the body (1 MB cap, JSON), calls `handleApiRequest`, writes the response. Opens one database per process.
- `server/api.ts`: `handleApiRequest(db, { method, pathname, host, origin, contentType, body })`. Routes, validates with `src/validation.ts`, calls `db.ts`. No SQL and no HTTP objects, so tests call it directly.
- `server/db.ts`: `openDatabase(dataDir)`, the schema, seeding and every query.

## Rules
- Every request body is checked by a parser in `src/validation.ts` before it reaches `db.ts`. The browser uses the same parsers, so the two sides accept the same shapes. A new payload gets a new parser there, not an inline check.
- SQL lives only in `db.ts`. Routes in `api.ts` call its functions.
- The seed routine comes from `src/data/seedData.ts`. It is inserted only when `exercise_definitions` is empty.
- Table and column names are stored data: never rename them (see `AGENTS.md`).
- Schema changes go in `MIGRATIONS` in `db.ts`: append a function, never edit an old one. `PRAGMA user_version` records how many have run. Before the first pending migration on an existing file, `openDatabase` writes a copy to `data/gymmy.before-schema-v<N>.db`, and each migration runs in a transaction.
- A write that touches more than one row runs inside `inTransaction`, so it lands completely or not at all (`upsertExercises`, migrations).
- Exercises are listed by `sort_order`, which `/api/exercises` sets from each item's position in the submitted list.

- The API has no login, so `rejectUntrustedRequest` in `api.ts` runs before every route:
  - `Host` must be `localhost`, `*.localhost` or an IP address. This blocks DNS rebinding; Vite's own host check runs after plugin middleware, so it doesn't cover `/api`.
  - `Origin`, when sent, must equal this server.
  - A POST must be `application/json`, even without a body (`/api/clear`).

## Data / API
| Route | Body | Response |
|---|---|---|
| `GET /api/data` | none | `{ success, sessions, exercises }`, sessions newest date first, exercises in routine order |
| `POST /api/sessions` | one `WorkoutSession` | `{ success, session }`; inserts or replaces by `id` |
| `DELETE /api/sessions/:id` | none | `{ success, deletedId }`; `:id` is URI-encoded |
| `POST /api/exercises` | `ExerciseDefinition[]` | `{ success, count }`; inserts or replaces by `id` |
| `POST /api/clear` | none | deletes every session, keeps exercises |

Errors: 403 for a foreign `Host` or `Origin`, 415 for a POST that isn't JSON, 400 for an invalid body (the message names the first bad field, for example `session.date must be a string`), 404 for an unknown route, 413 for a body over 1 MB, 500 for a database error (logged once).

| Table | Key | Notes |
|---|---|---|
| `workout_sessions` | `id` | `exercises_json` holds the session's `ExerciseSessionLog[]` as JSON |
| `exercise_definitions` | `id` | `warmup_required` is 0/1; `sort_order` (schema v1) is the routine position |

## Gotchas
- Requests need a localhost or IP-address `Host`. A test client or `curl` has to send one; a request for `http://mypc:3000` gets 403. Use `localhost` or the machine's IP address instead.

## Tests
- `tests/server/db.test.ts`: migrating a 1.0.0 database (order, sessions kept, backup), reopening it, and all-or-nothing exercise writes.
- `tests/server/api.test.ts`: every route against a temp-dir database, including validation failures, reopening an existing file, and the host, origin and content-type checks.
- `tests/validation.test.ts`: which session and exercise shapes are accepted, and the error for each invalid field.
