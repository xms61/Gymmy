---
version: 1
slug: "src-components-calendar-workoutcalendar-tsx"
primary_target: "src/components/calendar/WorkoutCalendar.tsx"
related_targets: []
---

## Scope
The Calendar screen (`src/components/calendar/WorkoutCalendar.tsx`) inside the Departure Board world (DESIGN.md). Mode: Operate. Desktop web only.

## Job
See when you trained this month, and read any day's workout set by set without a pop-up. Delete a wrongly logged session.

## Direction contract
THESIS: The month and the chosen day side by side on one board; the day's sets read like the workout screen in hindsight. Refuses the category default: a calendar grid that opens a modal per day.
OWN-WORLD: DESIGN.md unchanged. Board cells for days, route markers on training days, two-ink flaps for figures, no yellow below the band.
STORY: You see the month with route markers on training days, the latest training day already open on the right; click another day and the right column turns to it.
FIRST VIEWPORT: Header line: month name, previous, next, Today, then workouts and month volume on flaps. Left (about 7/12): a Monday-first 7-column grid of square board cells, day number top left, route markers for that day's sessions. Right (about 5/12): the selected date, each session's route marker, split, time and volume on flaps, then each exercise with its set tiles and notes.
FORM: Month and Day, position 2 of 7 on the ordered list, seed 60ce4b67.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
