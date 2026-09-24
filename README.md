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
  - Equipment: a barbell, a dumbbell and bodyweight; no machines. Meadows Row is a landmine row: one end of the bar rests on the floor and only the other end carries plates.
- **Next workout:** the dashboard picks the next split in rotation after the last logged Push, Pull or Legs session. Two sessions on one day are ordered by start time, and an "Other" workout doesn't move the rotation.
- **Load suggestions (double progression):**
  - Loads come from the home equipment in `src/data/gymInventory.ts`: a 10 kg barbell, one dumbbell (handle not counted, 25 kg at most) and 2×20, 2×15, 2×10, 6×5, 4×2.5 and 2×1.25 kg plates. The barbell makes every 2.5 kg step from 10 to 142.5 kg, the dumbbell every 2.5 kg step up to 25 kg, and the landmine row (plates on one end) every 1.25 kg step.
  - When every set reaches the top of the rep range, the next session moves to the next load the equipment makes. At the heaviest load it keeps the weight and asks for more reps.
  - When the next load is more than 15 % heavier (Lateral Raise 5 to 7.5 kg is +50 %), the jump is earned with extra reps first: the reps at the current weight that predict the same one-rep max as the bottom of the range at the next weight (Brzycki), at most 30. Lateral Raise needs 19 reps at 5 kg, Incline DB Press and Biceps Curl 14 reps at 10 kg. Bodyweight lifts are exempt.
  - Otherwise the load stays the same and the goal is more reps, including while reps are still climbing toward the range.
  - If average reps drop in two sessions in a row at the same weight, the app suggests a deload: about 10 % lighter for a week, rounded to a loadable weight.
  - If average reps stay below the range for three sessions at the same weight without improving, the app suggests a lighter working weight, one loading step down.
  - Neither goes below the empty 10 kg bar for barbell lifts, or below the lightest plate for dumbbell and landmine lifts.
  - A session is judged by its working sets, the completed sets at its heaviest weight. Lighter ramp-up and back-off sets don't count.
  - A skipped exercise, meaning no completed sets, is ignored.
- **Live tracking:**
  - Set logger with weight and rep steppers.
  - Rest timer set per exercise, with a 5-minute break between Deadlifts and Pull-Ups.
  - Chime and vibration when the rest ends.
  - Plate calculator for barbell, dumbbell and landmine lifts: which of the home plates go on each end, and the nearest loads when a weight can't be made. The weight steppers step through the loads the plates make, and a weight they can't make is marked.
- **History:** a monthly calendar colored by split (Push orange, Pull green, Legs blue), with each day's sets, loads, volume and notes, and a weekly streak: weeks in a row, Monday to Sunday, with at least one workout.
- **Progress:** estimated 1RM (Brzycki formula), best load and volume for each exercise.
- **Backup and restore:** a JSON file with every workout and the exercise targets. Restoring previews the changes first and never deletes anything.
- **Themes:** the Appearance tab in Settings switches between Classic, Industrial Brutalism (iron, chalk and caution yellow, square corners, 56 px steppers, load stacked over reps, and a full-width rest timer) and Golden Era Journal (parchment, a ruled ledger for the sets, handwritten margin notes, ink stamps for done sets and finished workouts, and dates written out). The choice is stored on each device. The fonts are bundled, so they work offline.

## Where data lives
- `data/gymmy.db` is the source of truth. It's a SQLite file created by the dev and preview servers, which serve it at `/api/*`.
- The browser keeps a copy in localStorage. Changes made while the server is unreachable are queued there and sent the next time the app reaches the server. The header badge shows "SQLite" when connected, or "Offline, N pending".
- `data/` holds your real training history and is never committed.
