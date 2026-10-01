---
version: 1
slug: "src-components-dashboard-homedashboard-tsx"
primary_target: "src/components/dashboard/HomeDashboard.tsx"
related_targets: []
---

## Scope
The home screen (`src/components/dashboard/HomeDashboard.tsx`) inside the Departure Board world (DESIGN.md). Mode: Operate. Desktop web only.

## Job
Open the app, see which workout is next and what to lift in it, start it in one click. An unfinished workout takes the sign's place until it is resumed or discarded.

## Direction contract
THESIS: The next workout hangs as a platform sign; everything else sits quietly under it. Refuses the category default: a hero card over a grid of same-size stat cards.
OWN-WORLD: DESIGN.md unchanged: warm-black board, off-white two-ink flaps, Barlow Condensed caps, 3px corners, no shadows or gradients. The sign is a yellow enamel panel with black lettering, the one yellow area under the header band.
STORY: You read NEXT · PULL and its last-workout line, scan four target rows (load on flaps, rep range, status), press Start. A draft turns the sign into UNFINISHED · PUSH with Resume and Discard.
FIRST VIEWPORT: The yellow sign spans the content width: route marker, NEXT, the split name in 6rem caps, the after-line, and a black Start button on its right. Below, one row per exercise: name, target load on flaps, rep range, status. At the foot one strip: weekly streak, sessions and volume on flaps, and start rows for the other two splits.
FORM: Platform Sign, position 4 of 5 on the ordered list, seed aa90a80a. Signature: the sign's split name and the target loads are flaps that turn over when the rotation moves on.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
