# Gymmy

A mobile-first workout tracker for one Push/Pull/Legs routine, built with React, TypeScript, Tailwind CSS and Vite. It logs each set, suggests the next load with double progression, and keeps the training history in a local SQLite database.

## Setup
Requires Node.js 22.18 or newer. The dev server uses the built-in `node:sqlite` module, and the tests run TypeScript directly with Node.

```bash
npm ci
npm run dev
```

The dev server opens `http://localhost:3000`. Gymmy reads no environment variables.

## Commands
See the Commands table in [AGENTS.md](AGENTS.md). Every pull request and every push to `main` runs the typecheck, the tests and the production build on GitHub Actions (`.github/workflows/ci.yml`).

## What it does
- **Routine:** the exercises from sheet "List" of the routine spreadsheet, with a target set count, rep range, starting load and rest time for each. Targets can be edited in Settings.
  - Push: Flat Bench, Overhead Press, Incline DB Press, Lateral Raise, Skullcrusher
  - Pull: Deadlifts, Pull-Ups, Meadows Row, Biceps Curl
  - Legs: Squats, Calf Raises, RDL
- **Next workout:** the dashboard picks the next split in rotation after the last logged session.
- **Load suggestions (double progression):**
  - When every set reaches the top of the rep range, the next session adds one loading step: 2 kg for dumbbells, 2.5 kg for everything else.
  - Otherwise the load stays the same and the goal is more reps, including while reps are still climbing toward the range.
  - If average reps drop in two sessions in a row at the same weight, the app suggests a deload: about 10 % lighter for a week, rounded to a loadable weight.
  - If average reps stay below the range for three sessions at the same weight without improving, the app suggests a lighter working weight, one loading step down.
  - Neither goes below an empty 20 kg bar for barbell lifts.
  - A skipped exercise, meaning no completed sets, is ignored.
- **Live tracking:**
  - Set logger with weight and rep steppers.
  - Rest timer set per exercise, with a 5-minute break between Deadlifts and Pull-Ups.
  - Chime and vibration when the rest ends.
  - Barbell plate calculator.
- **History:** a monthly calendar colored by split (Push orange, Pull green, Legs blue), with each day's sets, loads, volume and notes.
- **Progress:** estimated 1RM (Brzycki formula), best load and volume for each exercise.
- **Backup and restore:** a JSON file with every workout and the exercise targets. Restoring previews the changes first and never deletes anything.

## Where data lives
- `data/gymmy.db` is the source of truth. It's a SQLite file created by the dev and preview servers, which serve it at `/api/*`.
- The browser keeps a copy in localStorage. Changes made while the server is unreachable are queued there and sent the next time the app reaches the server. The header badge shows "SQLite" when connected, or "Offline, N pending".
- Version 1.0.0 also kept a copy in IndexedDB. The app moves any sessions found there over, and deletes that copy once the server has them all.
- `data/` holds your real training history and is never committed.
