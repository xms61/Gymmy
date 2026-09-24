# Changelog

All notable changes to **Gymmy** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Restore from a JSON backup (Settings, Backup and Restore). The app shows what the file would add or replace before anything changes, never deletes, and also reads backups exported by 1.0.0.
- A workout in progress survives a reload or a closed tab. The app shows "Unfinished Push workout" with Resume and Discard, and resuming restores the ticked sets, notes and start time.
- Local git repository, release process (`.github/RELEASE_PROCESS.md`), agent doc map (`AGENTS.md`), code style and testing docs.

### Fixed
- The rest-timer chime uses one shared audio context, started by the tap that completes a set. Before, every chime created a new context outside a user gesture, which iOS Safari keeps muted, and none were ever closed.
- Tapping Finish twice no longer saves the workout twice.
- A workout is dated by the day it started, so one resumed the next day or finished after midnight stays on the right calendar day.
- Workout duration is measured from the start time. It used to count timer ticks, which phones slow down or pause while the screen is locked, so the recorded duration came out too short. The clock also shows hours after the first hour.
- `src/data/seedData.ts` is committed. The `.gitignore` pattern for the local `data/` folder also matched `src/data/`, so a fresh clone could not build.
- Workouts saved or deleted while the server was down are no longer lost or brought back. Every change waits in a local queue until the server stores it, and on start the app applies unsent changes on top of the server's data. The first start after upgrading also queues any sessions that 1.0.0 had left only in the browser.
- The "SQLite" badge in the header and Settings shows the real connection state, and the number of changes waiting to be sent.
- Settings no longer lets you save a min rep count above the max. The exercise shows a warning and Save is disabled until it is fixed.
- Skipping an exercise no longer resets its suggested load to the starting weight, or counts as a failed session toward a deload.
- The estimated 1RM uses the best single set. Before, it combined the heaviest weight with the most reps, even when they came from different sets (60 kg x 6 and 50 kg x 12 gave 86.4 kg instead of 72 kg).
- Deloads round to the equipment's loading step and are only suggested when they actually lower the load. Meadows Row at 20 kg showed a "deload" to 20 kg. Deloads now also apply below 15 kg, which the old rule skipped.
- Saving exercise targets and resetting to the seed routine are all-or-nothing. Before, an error partway through left some rows updated and others not.
- Exercises appear in routine order again (Squats first on leg day, Deadlifts then Pull-Ups on pull day) instead of alphabetically. The database gets a `sort_order` column the first time the server starts; it backs the file up to `data/gymmy.before-schema-v1.db` first.

### Removed
- Excel import and export, and the `xlsx` dependency. The import only checked for a sheet named "List" and then reported success without importing anything. The `xlsx` package on npm (0.18.5) has two high-severity advisories with no fixed release (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9). JSON backup and restore replaces both, and the app bundle drops from 677 kB to 258 kB.

### Security
- Other websites can no longer read or change your data through the API. It rejects requests from other origins (403), requests addressed to a host name other than localhost or an IP address (DNS rebinding, 403), and POSTs that aren't JSON (415). Before, any page open in the same browser could wipe the history with `/api/clear`.

### Changed
- JSON backups use one versioned format (`format: "gymmy-backup"`, `version: 1`) for both export and import, validated with the same rules as the server.
- The live tracker no longer redraws every exercise each second: only the clock ticks, and recommendations are computed once per workout.
- The browser keeps its copy in localStorage only. Sessions from the old IndexedDB copy are moved over, and that copy is deleted once the server has confirmed them all.
- The overload engine is plain functions (`getRecommendation`, `estimate1RM`, `calculatePlates`), and the Progress view's per-exercise history is computed by `exerciseHistory` in `src/services/progress.ts`, with tests.
- The API server is split into `server/` (`vitePlugin.ts` for HTTP, `api.ts` for routes, `db.ts` for SQL) and reads the seed routine from `src/data/seedData.ts` instead of its own copy. `/api/data` returns the same data as before.
- `POST /api/sessions` and `POST /api/exercises` check the whole body with `src/validation.ts` and answer 400 with the first bad field. Before, a bad body caused a 500 or a partial write. `/api/exercises` now takes only a list.
- Request bodies over 1 MB get a 413, and bodies that are not valid JSON get a 400.
- Tests run on Node's built-in test runner (`npm test`, `npm run test:ci` with coverage thresholds) and live in `tests/`. The `scripts/verify*` files are removed; `verifyDb.mjs` wrote a test session into the real database.
- Everything is TypeScript: the Tailwind config is `tailwind.config.ts`, PostCSS settings moved into `vite.config.ts`, and the server plugin and configs are now type-checked (`tsconfig.node.json`).
- Requires Node.js 22.18 or newer (`engines` in `package.json`).
- `README.md` rewritten from the repository template: setup, features and where data is stored.

---

## [1.0.0] - 2026-09-07

### Added
- Push/Pull/Legs tracker with a live set logger, rest timer, plate calculator, calendar, progress view, and Excel/JSON export.
- Local SQLite storage (`data/gymmy.db`) served by the Vite dev server, with a copy in browser storage.

---

Older releases (none yet) are in [docs/CHANGELOG-archive.md](docs/CHANGELOG-archive.md).
