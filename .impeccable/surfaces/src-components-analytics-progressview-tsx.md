---
version: 1
slug: "src-components-analytics-progressview-tsx"
primary_target: "src/components/analytics/ProgressView.tsx"
related_targets: []
---

## Scope
The Progress screen (`src/components/analytics/ProgressView.tsx`) inside the Departure Board world (DESIGN.md). Mode: Operate. Desktop web only.

## Job
See whether each lift is going up: its best load, estimated 1RM, the next target, and the trend across every session.

## Direction contract
THESIS: Every exercise is a row on a rail with its current 1RM on flaps; the chosen one fills the board with its record, curves and history. Refuses the category default: pill tabs over a card of stat boxes.
OWN-WORLD: DESIGN.md unchanged. The rail uses the session-row grammar of the workout screen; charts draw in ink on the board, never yellow.
STORY: You scan the rail for the lift you care about, its 1RM already visible; click it and the board shows best load and 1RM in big flaps, what to lift next, the 1RM and volume curves, and every session.
FIRST VIEWPORT: Left rail (about 18rem): exercises grouped under their split's route marker, each row name and latest 1RM on small flaps; the chosen row on surface. Right: name and meta line, best load and estimated 1RM on 4.5rem flaps, the next target line with status, the two charts side by side, then session history rows (date, load, reps per set, 1RM).
FORM: Exercise Rail, position 1 of 7 on the ordered list, seed 0c5f67d8.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
