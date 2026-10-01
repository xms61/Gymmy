---
version: 1
slug: "src-components-tracker-livetracker-tsx"
primary_target: "src/components/tracker/LiveTracker.tsx"
related_targets: ["src/components/tracker"]
---

## Scope
The live workout screen (`src/components/tracker/`), first surface of the Departure Board world. Mode: Operate. Desktop first (laptop within arm's reach in a lit home gym), phone second.

## Job
Between sets, in two seconds: what set is next, how heavy, how many reps, how long the rest. Log the set in one action. Avoid spreadsheet dryness and anything that makes you read mid-set.

## Direction contract
THESIS: The workout is a departure board. The current exercise owns the board; every set is the next departure and the board flips to it. Refuses the category default: a scroll of identical exercise cards with set tables.
OWN-WORLD: Matte warm-black board, off-white characters on split-flap cells with a hairline split, a yellow enamel signage band, Barlow Condensed in caps. Two inks on the flaps; colour only on round route markers (Push orange, Pull green, Legs blue) and the band. Square 3px corners, no shadows, no gradients, no glow.
STORY: You see the exercise, set n of m, the load and reps in big flap digits, and the rest counting down beside them. You tap Done, the set row flips to done, the rest starts, the next set takes the board.
FIRST VIEWPORT: Yellow band across the top: back, route marker, split and date, elapsed, Finish. Left two thirds: exercise name, set count and target, then load and reps as flap cells at 7rem, steppers under each, a wide Done. Set chips in a row below. Right third: rest countdown in flap digits, then the rest of the session as single rows, next in full ink, later ones at half ink. Command line as one quiet row at the foot.
FORM: Departure Board, position 3 of 7 on the ordered list, seed 59a8bffe. Signature: values change by a stepped flap flip, never a fade. Raises: flap-cell grid, stepped motion, nothing labelled twice, one exercise owns the board, dimmed non-current rows, two inks on flaps.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
