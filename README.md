# Gymmy

A mobile-first workout tracker for one Push/Pull/Legs routine, built with React, TypeScript, Tailwind CSS and Vite. It logs each set, suggests the next load with double progression, and keeps the training history in a local SQLite database.

## Setup
Requires Node.js 22.13 or newer (the dev server uses the built-in `node:sqlite` module).

```bash
npm ci
npm run dev
```

The dev server opens `http://localhost:3000`. Gymmy reads no environment variables.

## Commands
See the Commands table in [AGENTS.md](AGENTS.md).

## What it does
- **Routine:** the exercises from sheet "List" of the routine spreadsheet, with a target set count, rep range, starting load and rest time for each. Targets can be edited in Settings.
  - Push: Flat Bench, Overhead Press, Incline DB Press, Lateral Raise, Skullcrusher
  - Pull: Deadlifts, Pull-Ups, Meadows Row, Biceps Curl
  - Legs: Squats, Calf Raises, RDL
- **Next workout:** the dashboard picks the next split in rotation after the last logged session.
- **Load suggestions (double progression):**
  - When every set reaches the top of the rep range, the next session adds 2.5 kg (barbell or machine) or 2 kg (dumbbell).
  - Otherwise the load stays the same and the goal is more reps.
  - Two sessions in a row below the minimum rep count suggest a 10 % deload.
- **Live tracking:**
  - Set logger with weight and rep steppers.
  - Rest timer set per exercise, with a 5-minute break between Deadlifts and Pull-Ups.
  - Chime and vibration when the rest ends.
  - Barbell plate calculator.
- **History:** a monthly calendar colored by split (Push orange, Pull green, Legs blue), with each day's sets, loads, volume and notes.
- **Progress:** estimated 1RM (Brzycki formula), best load and volume for each exercise.
- **Export:** workout history to `.xlsx`, and a full JSON backup.

## Where data lives
- `data/gymmy.db` is the source of truth. It's a SQLite file created by the dev and preview servers, which serve it at `/api/*`.
- The browser keeps a copy in localStorage and IndexedDB. The app falls back to that copy when the API isn't reachable, for example when the `dist/` build is served as static files.
- `data/` holds your real training history and is never committed.
