# Server (SQLite API)

Entry: `server/vitePlugin.ts`: a Vite plugin that serves `/api/*` from the dev and preview servers, backed by `data/gymmy.db`. There is no separate backend process; a static `dist/` build has no API.
- `server/vitePlugin.ts`: HTTP plumbing only. Reads the body (1 MB cap, JSON), calls `handleApiRequest`, writes the response. Opens one database per process, loads the access key, and with `--host` prints each network address as a link with `#key=…`.
- `server/api.ts`: `handleApiRequest({ db, accessKey }, { method, pathname, host, origin, contentType, fromThisMachine, accessKey, body })`. Routes, validates with `src/validation.ts`, calls `db.ts`. No SQL and no HTTP objects, so tests call it directly.
- `server/db.ts`: `openDatabase(dataDir)`, the schema, seeding and every query.
- `server/accessKey.ts`: the per-install access key in `data/access-key` (created on first start, mode 600), a constant-time comparison, and the loopback check.

## Rules
- Every request body is checked by a parser in `src/validation.ts` before it reaches `db.ts`. The browser uses the same parsers, so the two sides accept the same shapes. A new payload gets a new parser there, not an inline check.
- The parsers enforce `LIMITS` in `src/validation.ts` (at most 50 sets per exercise and 50 exercises per session, 20 target sets, 1000 kg, 1000 reps, RPE 10, notes of 10 000 characters, real calendar dates and times). The tracker and Settings inputs clamp to the same `LIMITS`, so the app never sends a value the server refuses. Durations and volume have no upper limit, because a draft resumed days later records a long workout.
- SQL lives only in `db.ts`. Routes in `api.ts` call its functions.
- The seed routine comes from `src/data/seedData.ts`. It is inserted only when `exercise_definitions` is empty.
- Table and column names are stored data: never rename them (see `AGENTS.md`).
- Schema changes, and one-time fixes to stored rows, go in `MIGRATIONS` in `db.ts`: append a function, never edit an old one. Version 2 (`matchHomeEquipment`) moved Calf Raises to `barbell` and Meadows Row to `landmine`, leaving definitions the user had changed. `PRAGMA user_version` records how many have run. Before the first pending migration on an existing file, `openDatabase` writes a copy to `data/gymmy.before-schema-v<N>.db`, and each migration runs in a transaction.
- Anything that deletes more than one row copies the database file first (`backUp`, `VACUUM INTO`): migrations and `POST /api/clear`.
- A write that touches more than one row runs inside `inTransaction`, so it lands completely or not at all (`upsertExercises`, migrations).
- Exercises are listed by `sort_order`, which `/api/exercises` sets from each item's position in the submitted list.

- The API has no login, so `rejectUntrustedRequest` in `api.ts` runs before every route:
  - `Host` must be `localhost`, `*.localhost` or an IP address. This blocks DNS rebinding; Vite's own host check runs after plugin middleware, so it doesn't cover `/api`.
  - A connection that doesn't come from this machine's loopback address must send the access key in `X-Gymmy-Key`, or gets 401. That only happens with `npm run dev -- --host` (or `preview --host`), where any device on the network could otherwise read, overwrite or clear the history. The check uses the socket's peer address, which a client can't choose the way it chooses `Host`. The browser takes the key from the printed link (`src/services/accessKey.ts`).
  - `Origin`, when sent, must equal this server.
  - A POST must be `application/json`, even without a body (`/api/clear`).
- `vite.config.ts` denies `data/**` to Vite's file serving (`server.fs.deny`) and turns off Vite's CORS answers, so no page can download `data/gymmy.db` as a static file. Keep both when changing the config. Both servers send `X-Frame-Options: DENY`, so other sites cannot frame the app.

## Data / API
| Route | Body | Response |
|---|---|---|
| `GET /api/data` | none | `{ success, sessions, exercises }`, sessions newest date first, exercises in routine order |
| `POST /api/sessions` | one `WorkoutSession` | `{ success, session }`; inserts or replaces by `id` |
| `DELETE /api/sessions/:id` | none | `{ success, deletedId }`; `:id` is URI-encoded |
| `POST /api/exercises` | `ExerciseDefinition[]` | `{ success, count }`; inserts or replaces by `id` |
| `POST /api/clear` | none | `{ success, backup }`; copies the database to `data/gymmy.before-clear-<time>.db`, then deletes every session and keeps exercises |

Errors: 401 for another device without the access key, 403 for a foreign `Host` or `Origin`, 415 for a POST that isn't JSON, 400 for an invalid body (the message names the first bad field, for example `session.date must be a string`) or a session id with broken URI encoding, 404 for an unknown route, 413 for a body over 1 MB, 500 for a database error. A 500 says only `Internal database error`; the details go to the server log once, because they can hold SQL and file paths.

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
