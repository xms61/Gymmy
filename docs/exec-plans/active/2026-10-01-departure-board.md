---
status: draft
last-verified: 2026-10-01
---

# Departure Board design

## Purpose
Gymmy gets one design in place of its five themes: the Departure Board, a station split-flap board in matte black with off-white flap characters, a yellow signage band, and the Push, Pull and Legs colours kept to small route markers. The live workout screen is built first and sets the system; the other screens take its tokens at once and get their own layouts in later milestones. Seen working: `npm run dev`, start a workout, and the tracker shows the current exercise as a board with the rest of the session as one-line rows.

## Context
- Product facts and constraints: [PRODUCT.md](../../../PRODUCT.md).
- Tokens and how components use them: [src/theme/THEME.md](../../../src/theme/THEME.md).
- The tracker's rules (timestamps, drafts, chime, wake lock, commands): [src/components/tracker/TRACKER.md](../../../src/components/tracker/TRACKER.md).
- `gymmy_theme_v1` stays listed in [src/services/STORAGE.md](../../../src/services/STORAGE.md) as retired, so the key is never reused for something else.

## Plan
1. Replace the five themes with one token set (`src/theme/tokens.ts`), written to `:root`. Remove theme switching, the Appearance tab, the theme traits and blocks, and the fonts, components and packages only the old themes used.
2. Rebuild the live workout screen as the board: yellow band header, the current exercise owning the board, flap-cell load and reps, the rest countdown in flap digits, the remaining exercises as single rows, and the command line as a quiet input row.
3. Give the home dashboard its board layout: the next split as the next departure.
4. Give history and progress their board layouts.
5. Settings and dialogs in the board's grammar.

## Progress
- [x] 2026-10-01 Milestone 1: one token set, theme system removed
- [x] 2026-10-01 Milestone 2: live workout screen as the board (finish review: three fix rounds; DESIGN.md written)
- [x] 2026-10-01 Milestone 3: home dashboard as a platform sign
- [x] 2026-10-01 Milestone 4: calendar as month and day side by side, progress as an exercise rail
- [ ] Milestone 5: settings and dialogs

## Decision log
- 2026-10-01: Departure Board chosen from a concept round (seed 59a8bffe), code-first because image generation was unavailable. Rejected: Calibrated Plates (plate hues collide with the split colours), the standard dark logger.
- 2026-10-01: The command line and single-key shortcuts stay, for everyone, because Gymmy is mostly used on a laptop within reach. Rejected: dropping them with the Terminal theme.
- 2026-10-01: Finishing a workout shows the summary with a flap "Logged" line instead of confetti, so `canvas-confetti` goes. Rejected: keeping confetti, which breaks the board's stepped motion.
- 2026-10-01: Session dates in lists are written "Thu 1 Oct", one style for every screen.
- 2026-10-01: Desktop web only, at the user's request: no phone layouts, no bottom navigation. The tabs moved into a yellow header band, the rest timer always sits beside the board, and the command row is in the page flow at the foot. Rejected: the phone rest bar, which covered the board.
- 2026-10-01: Confirmations use an in-app dialog (`ConfirmHost`), because the embedded browser answered `window.confirm` with no and Discard did nothing.
- 2026-10-01: Home is a yellow platform sign for the next workout (or the unfinished one, with Resume and Discard), the targets as board rows under it, and the record along the foot. Chosen from a structure round (seed aa90a80a). Rejected: Split Board (too close to the workout screen), Week Timetable (the week would outrank starting the workout). DESIGN.md admits the sign as the one yellow area below the band.
- 2026-10-01: Calendar shows the month and the chosen day side by side, Monday first, opening on the latest training day; the day pop-up is gone. Progress is a rail of every exercise with its 1RM, the chosen one beside it with records, next target, charts in ink and a session table. Chosen in structure rounds (seeds 60ce4b67, 0c5f67d8). Rejected: Split Ledger and Day Board for the calendar, History Rows and Record Board for progress.
- 2026-10-01: Barlow and Barlow Condensed, bundled with `@fontsource`, a grotesk drawn from road and rail signage with tabular figures. Rejected: the system sans (no character), the old themes' faces.

## Surprises
- Tailwind purged the flap leaf classes while their names were built from a template string, so old and new digits drew over each other. The names are now written out in full.
- The dev server reads the tokens when it starts: a new token needs a restart.

## Validation
`npm run test:ci`, `npm run build`, `node scripts/check-docs.mjs`; the tracker checked in `npm run dev` at 1440, 1280 and 920 px wide with a synthetic draft and `/api` blocked, without finishing a workout against `data/gymmy.db`.
