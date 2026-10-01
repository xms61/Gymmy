---
status: draft
last-verified: 2026-10-01
---

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
One lifter, the owner, training a Push/Pull/Legs routine in a home gym with a 10 kg barbell, one dumbbell, bodyweight and a fixed set of plates. Gymmy is used in a desktop browser on a laptop within arm's reach of the rack, in a normally lit room, glanced at between sets: logging a workout, reading history and progress, and changing targets. There is no second user, no account and no coach.

## Product Purpose
Gymmy tells the lifter what to lift next and keeps an honest record of what was lifted. Each session it picks the next split in rotation, suggests a load and rep goal per exercise, times the rests, and stores every set. Success is a lifter who opens the app, does the suggested work, logs it without friction, and over months sees the estimated 1RM and volume climb.

## Positioning
A progression engine built around one real gym, not a generic logger. Load suggestions are limited to the weights the owner's own plates, bar and dumbbell can make (`src/data/gymInventory.ts`), and the double-progression rules (top of range moves the load, jumps over 15 % are earned with extra reps by Brzycki, deload after two drops, lighter weight after three stalled sessions) are written for that equipment. The training history never leaves the owner's machine.

## Operating Context
- Sessions follow the Push, Pull, Legs rotation; an "Other" workout does not move it.
- A live workout runs a set logger with weight and rep steppers, optional RIR (0 to 5), a per-exercise rest timer with a chime and vibration, and a plate calculator.
- Between workouts the owner reads the monthly calendar, the weekly streak, per-exercise progress charts, and edits targets in Settings.
- Backups are JSON files; restoring previews the changes and never deletes.

## Capabilities and Constraints
- React, TypeScript, Tailwind CSS and Vite. The Vite dev and preview servers expose `/api/*` over a local SQLite file, `data/gymmy.db`, which is the source of truth.
- Offline-first: the browser keeps a localStorage copy and an outbox of changes made while the server is unreachable. No cloud service, no remote sync.
- Other devices need the access key from `data/access-key`.
- The routine is expected to change: exercises, splits and equipment may be edited over time, so features must not hard-code today's exercise list beyond the seed data. Exercise `id`s, localStorage keys, `/api/*` paths and SQLite table and column names are never renamed (see [AGENTS.md](AGENTS.md)).
- One design, the Departure Board ([src/theme/THEME.md](src/theme/THEME.md)), replaced the five themes on 2026-10-01. The workout screen is done; the other screens follow ([exec plan](docs/exec-plans/active/2026-10-01-departure-board.md)).
- A web app for desktop browsers. Phone layouts are not a design target: no bottom navigation, no phone-only controls. Other devices on the network can still open it through the access-key link.
- Stays single-user. Sharing, accounts and other people's routines are out of scope.

## Brand Commitments
- Name: Gymmy.
- Voice in code, logs and docs: plain and factual, no emoji or marketing words ([docs/CODE_STYLE.md](docs/CODE_STYLE.md)).
- Split colors in history and badges: Push orange, Pull green, Legs blue.

## Evidence on Hand
- Real training history in `data/gymmy.db` and the routine in `Fundamentals Workout.xlsx`. Both are private, read-only for analysis, and never committed or shown in published work.
- The exercise list and starting targets in `src/data/seedData.ts`; the equipment in `src/data/gymInventory.ts`.
- No testimonials, other users, benchmarks or published results exist, and none may be invented.

## Product Principles
1. The next action is always clear: what to lift, how heavy, how many reps, how long to rest.
2. Suggestions are only ever loads the owner's equipment can make, and the progression rules are product truth; change them deliberately, never as a side effect of a UI change.
3. The record is trustworthy: nothing is lost offline, restores never delete, and data stays local.
4. Logging costs as little attention as possible during a workout.
5. Built for one routine at a time, but that routine can change.

## Accessibility & Inclusion
The design tokens pass the contrast table in `tests/theme.test.ts` (4.5:1 for text, 3:1 for placeholders and control edges). `prefers-reduced-motion` turns off animations and the finish confetti. Charts can be read with the keyboard. Dialogs trap focus and close on Escape.
