---
status: draft
last-verified: 2026-10-01
---

# Architecture

The shape of the system: what each part owns and which way dependencies point. Keep it to what changes rarely; details belong in the area docs next to the code.

## Bird's-eye view
Gymmy is a single-user Push/Pull/Legs workout tracker. A React client, bundled by Vite, keeps a copy of the training history in localStorage and syncs it through an outbox to `/api/*`. The API is a Vite plugin, so it runs inside `npm run dev` and `npm run preview` and stores everything in one SQLite file, `data/gymmy.db`. There is no separate backend process, and a static `dist/` build has no API.

## Code map
- `server/`: the `/api` backend ([SERVER.md](server/SERVER.md)). `vitePlugin.ts` is the HTTP plumbing, `api.ts` routes and validates, `db.ts` holds the schema, migrations and every query, and `accessKey.ts` guards the API from other devices. It imports only `src/validation.ts`, `src/types/` and `src/data/seedData.ts` from the client.
- `src/`: the React client. `main.tsx` mounts `App.tsx`, which holds the screens and the sync status.
  - `src/components/`: the screens and their parts, one folder per screen: `dashboard/`, `tracker/` (the live workout, [TRACKER.md](src/components/tracker/TRACKER.md)), `calendar/`, `analytics/` and `settings/`. `ui/` holds the shared primitives (dialog, gauge, badges).
  - `src/services/`: the logic, with no React. `storage.ts` and `sync.ts` are the browser storage and the outbox ([STORAGE.md](src/services/STORAGE.md)). `overloadEngine.ts` (load suggestions), `loading.ts` (loads the equipment makes), `rotation.ts`, `progress.ts`, `streak.ts`, `effort.ts`, `exerciseLogs.ts` and `backup.ts` are pure functions over sessions.
  - `src/theme/`: the themes, their tokens and the stored choice ([THEME.md](src/theme/THEME.md)).
  - `src/data/`: the seed routine (`seedData.ts`) and the home equipment (`gymInventory.ts`).
  - `src/types/workout.ts`: the shared data types. `src/validation.ts`: the parsers and `LIMITS` that both the browser and the server use.
  - `src/utils/`: dates and the rest-timer chime.
- `tests/`: `node:test` tests of the pure modules, and `tests/server/` for the API against temp-dir databases ([TESTING.md](docs/TESTING.md)).
- `vite.config.ts`: wires in the API plugin and puts the theme tokens and boot script in `<head>`.
- `scripts/`: the repo checks (`check-docs.mjs`, `check-tracked-files.mjs`) and their tests.
- `docs/`: the knowledge base ([KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md)).

## Layers
- `server/` may import `src/validation.ts`, `src/types/` and `src/data/`, and nothing else from `src/`. `src/` never imports `server/`.
- `src/services/`, `src/data/`, `src/types/`, `src/utils/` and `src/validation.ts` never import `src/components/` or React. Only components, `App.tsx` and `src/theme/` render.
- No tool enforces these yet ([tech-debt tracker](docs/exec-plans/tech-debt-tracker.md)); check imports in review.

## Invariants
- Every write to the history goes through `StorageService` and its outbox; components never call `/api/*` or localStorage directly ([STORAGE.md](src/services/STORAGE.md)).
- Every request body is parsed by `src/validation.ts` before it reaches `db.ts`, and SQL lives only in `db.ts` ([SERVER.md](server/SERVER.md)).
- Node runs the server and tests by stripping TypeScript types, with no build step. So relative imports name the real file with its extension, type-only imports use `import type`, and code uses only erasable syntax. `tsc` enforces all three (`allowImportingTsExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`).
- Stored names never change: the localStorage keys, the `/api/*` paths, the exercise `id`s in `seedData.ts`, and the SQLite table and column names ([AGENTS.md](AGENTS.md)).
- Nothing in git holds training data, databases, secrets, or details of the owner's machine. `scripts/check-tracked-files.mjs` and gitleaks enforce this ([guardrails](.github/RELEASE_PROCESS.md)).

## Cross-cutting concerns
Each has an owner doc; link to it instead of restating it: failures, timeouts and logging in [RELIABILITY.md](docs/RELIABILITY.md), the access key and input checks in [SECURITY.md](docs/SECURITY.md), test seams in [TESTING.md](docs/TESTING.md), colors and fonts in [THEME.md](src/theme/THEME.md).

## Area docs
Each area of code has a doc next to it, made from the [area doc template](docs/AREA_DOC_TEMPLATE.md) and listed in the map in [AGENTS.md](AGENTS.md).
