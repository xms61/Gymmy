# Changelog

All notable changes to **Gymmy** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed
- Exercises can use a new equipment type, `landmine`: one end of a barbell on the floor, plates on the other. Meadows Row is a landmine lift, and Calf Raises is a barbell lift instead of a machine lift, to match the home gym. A one-time database update (schema version 2) changes the stored definitions, after the usual backup copy, and leaves any definition you already changed. Backups that contain `landmine` can't be read by 1.x, so the next release is 2.0.0.

---

## [1.2.0] - 2026-09-24

### Added
- CI on GitHub Actions (`.github/workflows/ci.yml`). Every pull request and every push to `main` runs the typecheck, the tests with their coverage thresholds, and the production build. The actions are pinned to commits.
- Dependabot (`.github/dependabot.yml`) proposes npm and GitHub Actions updates weekly, with minor and patch npm updates grouped into one pull request.

### Changed
- "Clear Workout History" keeps a copy of the database first, in `data/gymmy.before-clear-<time>.db`, so a mistaken tap can be undone. It used to delete every session with nothing to restore from except a backup file downloaded earlier.
- Sessions, exercise targets, backups and drafts are checked against upper limits: at most 50 sets per exercise and 50 exercises per session, 20 target sets, 1000 kg, 1000 reps, RPE 10 and 10 000 characters of notes. A backup with a billion target sets used to pass and would have frozen the tracker. Dates must exist (`2026-02-30` is refused), and start and end times must be real times. The tracker and Settings inputs stay inside the same limits, and Add Set stops at 50 sets.
- `AGENTS.md` and `.github/RELEASE_PROCESS.md` describe the GitHub flow: one branch per change, merged into `main` through a pull request once CI passes. They used to say the repository had no remote.
- Every color, corner radius and font comes from design tokens (`src/theme/themes.ts`) instead of classes repeated in each screen, in preparation for themes. The look is the same, except that the Start button on the dashboard uses the split color with dark text.
- Deloads follow the performance trend instead of the rep range. The app suggests one only when average reps drop in two sessions in a row at the same weight, the stall-or-decline signal strength coaches use (Bell et al. 2023 consensus; Rogerson et al. 2024 survey). Reps below the range that are still rising now mean "hold the weight" (Incline DB Press and Biceps Curl no longer get a deload). Three flat sessions below the range suggest a lighter working weight, shown as a new "Lighter Weight" status (Lateral Raise: 5 to 4 kg).

### Fixed
- Changes the server refused, and saves the browser could not store because its storage is full, are no longer silent. The header badge says "1 not saved" or "browser storage full" with a warning dot, and Settings offers the refused changes as a file before they can be dismissed. Before, a refused workout disappeared from the calendar on the next start and only the browser console mentioned it.
- Changes made while the server was unreachable are sent as soon as it is back, while the app stays open: when the browser goes online, when the tab returns to the front, and every 30 s. They used to wait for the next change or a reload, and the header kept saying "Offline". Requests also give up after 8 s instead of hanging.
- Two open tabs no longer erase each other's unsent changes. Each tab wrote its own copy of the outbox, so a change queued in one tab while the server was down could be overwritten by the other.
- The dev server no longer serves `data/gymmy.db` as a static file. Any other page on the same machine could download the whole training history from `/data/gymmy.db`, because Vite answered cross-origin requests from any `localhost` origin. It now refuses `data/**` with 403 and sends no CORS headers.
- Deleting a session whose id has broken URI encoding answers 400 instead of 500, and a database error no longer sends its message, which can include SQL and file paths, to the browser.
- Other sites can no longer load Gymmy in a frame (`X-Frame-Options: DENY` and `frame-ancestors 'none'` on the dev and preview servers).
- The plate calculator draws the 10 and 15 kg plates. They had no height, so the bar looked lighter than the list below it.
- Pinch-zoom works on phones again. Form fields use 16 px text on small screens, so focusing one no longer makes iOS Safari zoom in, which the page used to prevent by disabling zoom altogether.

---

## [1.1.0] - 2026-09-24

### Added
- Restore from a JSON backup (Settings, Backup and Restore). The app shows what the file would add or replace before anything changes, never deletes, and also reads backups exported by 1.0.0.
- A workout in progress survives a reload or a closed tab. The app shows "Unfinished Push workout" with Resume and Discard, and resuming restores the ticked sets, notes and start time.
- Local git repository, release process (`.github/RELEASE_PROCESS.md`), agent doc map (`AGENTS.md`), code style and testing docs.

### Changed
- Plainer wording in the app: "Workout Saved" instead of "Workout Crushed!", "Add Weight" instead of "Weight Up Ready!", no exclamation marks, and the browser tab is titled "Gymmy".
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

### Removed
- The `POST /api/reset` route. Nothing in the app called it; clearing workouts (`/api/clear`) and restoring a backup cover the same needs.
- Excel import and export, and the `xlsx` dependency. The import only checked for a sheet named "List" and then reported success without importing anything. The `xlsx` package on npm (0.18.5) has two high-severity advisories with no fixed release (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9). JSON backup and restore replaces both, and the app bundle drops from 677 kB to 258 kB.

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
- Saving exercise targets is all-or-nothing. Before, an error partway through left some exercises updated and others not.
- Exercises appear in routine order again (Squats first on leg day, Deadlifts then Pull-Ups on pull day) instead of alphabetically. The database gets a `sort_order` column the first time the server starts; it backs the file up to `data/gymmy.before-schema-v1.db` first.

### Security
- Other websites can no longer read or change your data through the API. It rejects requests from other origins (403), requests addressed to a host name other than localhost or an IP address (DNS rebinding, 403), and POSTs that aren't JSON (415). Before, any page open in the same browser could wipe the history with `/api/clear`.

---

## [1.0.0] - 2026-09-07

### Added
- Push/Pull/Legs tracker with a live set logger, rest timer, plate calculator, calendar, progress view, and Excel/JSON export.
- Local SQLite storage (`data/gymmy.db`) served by the Vite dev server, with a copy in browser storage.

---

Older releases (none yet) are in [docs/CHANGELOG-archive.md](docs/CHANGELOG-archive.md).
