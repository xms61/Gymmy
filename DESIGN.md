---
status: draft
last-verified: 2026-10-01
name: Gymmy
description: A Push/Pull/Legs workout tracker drawn as a station departure board.
colors:
  bg: "#15130F"
  surface: "#201E1A"
  flap-low: "#1A1814"
  inset: "#0D0C0A"
  control: "#2E2B26"
  control-hover: "#3B3832"
  line: "#2E2B26"
  edge: "#7A766C"
  ink: "#F2EEE3"
  ink-soft: "#D8D4C8"
  ink-muted: "#A8A498"
  ink-faint: "#85827A"
  accent: "#F5C400"
  accent-hover: "#FFD43A"
  on-accent: "#15130F"
  accent-ink: "#F5C400"
  good: "#F2EEE3"
  good-hover: "#FFFFFF"
  on-good: "#15130F"
  good-ink: "#8FCB9B"
  warn-ink: "#FFB547"
  bad-ink: "#FF7A6B"
  info-ink: "#93BDF2"
  push: "#E8702A"
  pull: "#45A462"
  legs: "#4E8EEA"
  other: "#A08BE0"
  on-split: "#15130F"
  plate-25: "#D2372B"
  plate-20: "#2B6CD4"
  plate-15: "#F2C230"
  plate-10: "#2B7F44"
  plate-5: "#F2EEE3"
  plate-2-5: "#3A3A36"
  plate-1-25: "#5C5B55"
  on-plate: "#FFFFFF"
  on-plate-light: "#15130F"
  bar: "#A8A498"
typography:
  sign:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "6rem"
    fontWeight: 600
    lineHeight: 0.85
    letterSpacing: "0.02em"
  flap:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "4.5rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
  flap-xl:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "6.5rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
  flap-row:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
  display:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "3.75rem"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "0.02em"
  headline:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.02em"
  title:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.02em"
  body:
    fontFamily: "'Barlow', 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  data:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.55
    fontFeature: "tnum"
  button:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    letterSpacing: "0.06em"
  label:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  chip: "2px"
  panel: "3px"
  control: "3px"
  card: "4px"
  pill: "9999px"
spacing:
  tap: "2.5rem"
  tap-lg: "3rem"
  gutter: "1.5rem"
  section: "2rem"
  column-gap: "2.5rem"
  band: "4rem"
components:
  band:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.headline}"
    height: "{spacing.band}"
    padding: "0 1.5rem"
  band-tab-current:
    backgroundColor: "{colors.on-accent}"
    textColor: "{colors.accent}"
    padding: "0 1.25rem"
  flap-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.flap}"
    rounded: "{rounded.panel}"
    width: "0.66em"
    height: "1.16em"
  button-good:
    backgroundColor: "{colors.good}"
    textColor: "{colors.on-good}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    height: "4rem"
  button-good-hover:
    backgroundColor: "{colors.good-hover}"
  button-secondary:
    backgroundColor: "{colors.control}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    height: "{spacing.tap-lg}"
    padding: "0 1rem"
  button-secondary-hover:
    backgroundColor: "{colors.control-hover}"
  button-danger:
    textColor: "{colors.bad-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    height: "{spacing.tap-lg}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.chip}"
    padding: "0.5rem 0.75rem"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
  panel:
    backgroundColor: "{colors.inset}"
    rounded: "{rounded.panel}"
  set-tile:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.ink}"
    typography: "{typography.data}"
    rounded: "{rounded.control}"
    height: "{spacing.tap-lg}"
    padding: "0 0.75rem"
  set-tile-current:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  route-marker:
    textColor: "{colors.on-split}"
    rounded: "{rounded.pill}"
    size: "2rem"
  route-marker-sm:
    textColor: "{colors.on-split}"
    rounded: "{rounded.pill}"
    size: "1.5rem"
  route-marker-lg:
    textColor: "{colors.on-split}"
    rounded: "{rounded.pill}"
    size: "5rem"
  platform-sign:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.card}"
    padding: "1.25rem 2rem"
---

# Design System: Gymmy

Token values live in `src/theme/tokens.ts`; how they reach the page, and the token rules, are in [THEME.md](src/theme/THEME.md). This file describes how the tokens are applied. Where the two agree, THEME.md owns the rule.

## Overview

**Creative North Star: "The Departure Board"**

The workout is a station departure board. The current exercise owns the board, and each set is the next departure: when a value changes, its split-flap cells turn over to it. A matte warm-black board carries off-white characters on two-leaf flap cells with a hairline split. A yellow enamel signage band runs across the top. Barlow Condensed in capitals sets every heading, label and button.

The board is read between sets at arm's length on a laptop, so it is sparse and large: one exercise, its load and reps in flap digits, the rest countdown beside them, and the other exercises as single rows. Colour is rare. The flaps hold two inks; colour belongs to the band, the home platform sign and round route markers for Push, Pull and Legs. Surfaces are flat, with square 3px corners, and values change by a stepped flip, never by a fade.

The live workout screen, home, the calendar and progress are built in this world. Settings still has its earlier layout and only inherits the tokens; redoing it is milestone 5 of the [Departure Board exec plan](docs/exec-plans/active/2026-10-01-departure-board.md). It is a known gap, not a reference for new work.

**Key Characteristics:**
- Matte warm-black board with off-white flap characters.
- Split-flap cells: two leaves, the lower one a shade darker, a 1px split in board colour.
- One yellow signage band, and on home one yellow platform sign for the next workout; yellow elsewhere only on the focus ring and the text caret.
- Round route markers carry the split colours.
- Barlow Condensed in capitals for display, labels, buttons and numbers; Barlow for prose.
- Flat: no drop shadows, gradients, glows or blur.
- Stepped flap motion at 90ms per half-turn.
- Desktop browser only.

## Colors

A near-monochrome board of warm blacks and off-whites, with one signage yellow and four route colours kept to small areas.

### Primary
- **Signage Yellow** (`accent`): the band across the top of every screen, the platform sign on home, the 2px focus ring, the text caret and text selection. Its hover step (`accent-hover`) belongs to the same family. Text on it is `on-accent`, the board black.

### Secondary
- **Route colours** (`push` orange, `pull` green, `legs` blue, `other` violet): only as the fill of a round route marker, with `on-split` black lettering.

### Tertiary
- **Status inks** (`good-ink`, `warn-ink`, `bad-ink`, `info-ink`): coloured text for status, warnings and destructive actions. A progression status is an icon and a word in its ink with no box, so it never reads as a button; danger buttons use a 15% tint of `bad-ink` with a 40% border. `bad-ink` marks delete and danger actions; `warn-ink` marks an unloadable weight under the load flaps.
- **Plate colours** (`plate-*`, `bar`, `on-plate`, `on-plate-light`): the competition plate colours, only in the plate calculator.

### Neutral
- **Board Black** (`bg`): the page background and the hairline split of each flap.
- **Flap Face** (`surface`): the upper leaf of a flap, cards, fields, the current set tile, the current session row, the chosen calendar day and the chosen progress rail row.
- **Flap Underside** (`flap-low`): the lower leaf of a flap only.
- **Well Black** (`inset`): panels, idle set tiles and the command row at the foot.
- **Control Grey** (`control`, `control-hover`): the fill of bordered secondary buttons and unpicked RIR choices.
- **Line** (`line`): card borders, flap outlines and dividers between session rows.
- **Edge** (`edge`): the visible border of inputs, steppers and secondary buttons (3:1 against the board).
- **Inks** (`ink`, `ink-soft`, `ink-muted`, `ink-faint`): four text levels, from flap characters and headings down to placeholders.
- **Departure White** (`good`, `good-hover`, `on-good`): an off-white flap used as the board's one filled primary button, as a picked RIR choice, and as the chip behind today's date in the calendar.

### Named Rules
**The Two Inks Rule.** Flap cells show `ink` characters on `surface` over `flap-low`, nothing else. Colour never goes on a flap.

**The Signage Rule.** Yellow is the band, the home platform sign, the focus ring, the caret and selection. Buttons on the board are never yellow; the filled primary is Departure White. On a yellow sign, actions are board-black.

**The Route Marker Rule.** A split colour appears only as the fill of a round marker with its first letter in `on-split`, and the split's full name always sits beside the marker, so Push and Pull (both P) never rest on colour alone.

## Typography

**Display Font:** Barlow Condensed (with Arial Narrow, sans-serif), weights 500, 600, 700, bundled through @fontsource.
**Body Font:** Barlow (with Segoe UI, sans-serif), weights 400, 500, 600.
**Data Font:** Barlow Condensed with tabular figures (`font-mono` maps to it).

**Character:** A narrow transport-signage face in capitals for everything that is read at a glance, and a plain humanist sans for the few sentences the board carries.

### Hierarchy
- **Sign** (600, 4.5rem, 6rem from 1280px wide): the split name on the home platform sign, on flap cells; the state word before it (Next, Unfinished) at 2.25rem, 3rem from 1280px.
- **Flap** (600, 4.5rem, 6.5rem from 1280px wide; 1): load and reps on the board and the rest clock. Home target rows and record figures use the same cells at 2.25rem, session rows at 1.25rem.
- **Display** (600, 3.75rem, 0.95, 0.02em, capitals): the name of the exercise that owns the board.
- **Headline** (600, 1.875rem, 1, capitals): the band title: the app name, or the split of the workout.
- **Title** (600, 1.5rem, capitals): section headings in the side column, such as Rest and This workout.
- **Body** (400, 1rem, 1.625, at most 62ch): the progression sentence, notes and dialog messages. Dialog messages use 1.125rem in `ink`.
- **Data** (1.125rem, tabular): set tiles, the elapsed clock, the command row. 400 is not bundled for Barlow Condensed, so it renders at 500.
- **Button** (600, 0.06em, capitals): 0.875rem on small controls up to 1.5rem on the Log set button.
- **Label** (600, 0.75rem, 0.08em, capitals, `ink-muted`): the name of a field or value group, such as Load, kg or Workout notes.

### Named Rules
**The Capitals Rule.** Headings, labels, buttons and tabs are Barlow Condensed in capitals with positive tracking. Prose stays in sentence case Barlow.

**The Once Only Rule.** A value is labelled once. A label names the field it sits on; no headline sits above another headline.

## Layout

Desktop browser only; there are no phone layouts and no bottom navigation. Every screen opens with the 4rem yellow band and centres its content in a 90rem column with 1.5rem gutters.

The live workout fills the window: the band, then one scrolling main area, then the command row in flow at the foot. The main area is two columns: the board (`minmax(0, 1fr)`) and a side column of 18 to 26rem, 2.5rem apart (3rem from 1280px wide), with 2rem above and below. The side column stacks the rest timer, the session board and the workout notes 2rem apart.

On the board, the load and reps steppers sit side by side at a 1.45 to 1 ratio, 1.5rem apart. The minus and plus buttons under each value are as wide as its flap group. Set tiles wrap in one row 0.5rem apart. Steppers, set tiles and timer buttons are at least `tap-lg` tall; Plates and RIR choices use `tap`.

### Named Rules
**The One Board Rule.** One exercise owns the board at a time. Other exercises are single rows: the current row on `surface`, the next row with open sets in full ink, the rest at 50% opacity.

## Elevation & Depth

The system is flat. Depth comes from tone: the board, then the darker wells (`inset`) for panels, idle tiles and the command row, then `surface` for raised faces such as cards, fields and the current tile. Dialogs sit on an 85% board-black scrim with no blur. The only box-shadow in the build is the 1px route marker ring at 40% `on-split`, which draws an edge, not a lift.

### Named Rules
**The Flat Board Rule.** No drop shadows, gradients, glows or backdrop blur. A surface steps forward by tone, never by shadow.

## Shapes

Square corners with a slight break: 3px on flap cells, panels and controls, 4px on cards, 2px on fields, chips and RIR choices. The full circle is reserved for route markers and small attention dots. Borders are 1px: `line` for decoration, `edge` where a control needs a visible boundary, and a dashed `edge` for the add-set button. The flap cell is the recurring silhouette: 0.66em by 1.16em for every character, punctuation included, with 0.06em between cells, so every flap row sits on one uniform grid.

## Components

### Buttons
Square, capitalised and flat.
- **Shape:** slightly broken corners (`control`, 3px).
- **Good (filled primary):** Departure White fill with board-black text. On the board it is the full-width Log set button, 4rem tall at 1.5rem. Dialogs use it for OK and non-destructive confirms. Disabled turns it to `control` with `ink-faint` text.
- **Secondary:** `control` fill, `ink-soft` text and a 1px `edge` border. Skip, the timer adjustments, Plates, Not done, Show notes, Cancel and the steppers all use it.
- **Danger:** `bad-ink` text on a 15% `bad-ink` tint with a 40% border; 25% tint on hover.
- **Icon button:** no fill at rest, `ink-muted` icon, `control` fill and `ink` icon on hover.
- **Band buttons:** on the band, actions are board-black on yellow, with a 10% board-black wash on hover. Finish is the inverse, yellow text on a board-black fill.
- **Hover / Focus:** colour steps over 90ms. Focus is a 2px yellow outline offset 2px.

### Cards / Containers
- **Corner Style:** 4px for cards, 3px for panels.
- **Background:** cards on `surface`, panels on `inset`.
- **Shadow Strategy:** none; see Elevation & Depth.
- **Border:** 1px `line`.
- **Internal Padding:** 1.5rem in dialogs.

### Inputs / Fields
- **Style:** `surface` fill, 1px `edge` border, 2px corners, `ink` text, `ink-faint` placeholder.
- **Focus:** the border turns yellow. The flap fields show the 2px yellow outline offset 4px around the whole flap group.
- **Error:** an unloadable load sets `aria-invalid` and shows one `warn-ink` sentence under the steppers.
- **Command row:** a borderless transparent input in `data` type on the `inset` foot row, after a label.

### Navigation
The band holds the app name, then tabs with an icon and a capitalised label at full band height. The current tab inverts to yellow text on a board-black fill; others take a 10% board-black wash on hover. The sync status and settings sit at the right end. In a workout, the band holds back, the route marker, the split, the date, the elapsed clock and Finish.

### Dialog
Every modal is a card on the board-black scrim, at most 90% of the window tall. It takes focus, keeps Tab inside, closes on Escape and returns focus. Confirmations and notices go through the in-app confirm host: the message in `ink`, then Cancel and the confirm action at the right. The browser's confirm and alert boxes are not used.

### Split-flap cells (signature)
Each character sits on its own cell: an upper leaf on `surface` and a lower leaf on `flap-low`, each holding the whole character and clipped to its half, with a 1px board-black split across the middle and a 1px `line` outline. When a character changes, the old upper leaf falls to the split in two steps, then the new lower leaf lands in two steps (90ms each, `steps(2)`); unchanged cells hold still. Rows pad on the left with blank cells so their width does not change. A screen reader hears the whole value once. With reduced motion, the new value appears at once.

The flaps are both the readout and the field: a transparent number input covers the load and reps flaps, so clicking them and typing edits the value.

### Set strip
Every set of the board's exercise as a tile: set number in `ink-faint`, then load and reps in data type, and a check once done. Idle tiles are `inset` with a `line` border; the set on the board is `surface` with an `ink` border. Done sets drop to `ink-muted`.

### Platform sign (home)
A yellow `accent` panel with 4px corners across the content column, always one line: a large route marker (3.5rem, 5rem from 1280px wide), then one heading line, the state word (Next or Unfinished; 2.25rem, 3rem from 1280px) and the split name on flap cells (4.5rem, 6rem from 1280px) that turn over when the rotation moves on, with one detail line under it. The flaps keep their two inks on the yellow. The actions sit at the right as board-black buttons (Start, or Discard outlined and Resume filled). It is the only yellow area below the band. Under it, the split's targets are board rows: exercise name, target load and rep range on 2.25rem flaps (BW for a bodyweight lift with no load; the rep range takes two cells either side of the dash, so the dashes of every row stand in one column), and a status only when the target changes. The record runs along the foot: weekly streak, workouts and volume on flaps, then start buttons for the other two splits.

### Route marker
A circle filled with the split colour, the split's first letter in bold Barlow Condensed `on-split`, and a ring: 1.5rem (`sm`) on start buttons and in calendar day cells, 2rem (`md`) in the band, beside saved-workout titles and on the progress rail's split headings, 3.5rem (`lg`, 5rem from 1280px wide) on the platform sign.

### Month board (calendar)
The month and the chosen day side by side, no pop-up. Left: a Monday-first grid of square board cells (`inset`, `line` border), the day number in data type at the top left, and a route marker for each session that day; the chosen day is `surface` with an `ink` border, days of the neighbouring months sit at 40% opacity, and today's number sits on a small Departure White chip. Each training day shows a small route marker with the split's name beside it, one line per session. Right: the chosen date as the column's one heading, then each session as a row: route marker and split name, its time and volume on flaps and a delete button, then each exercise with its done sets as Set strip tiles (set number in `ink-faint`, load × reps in data type at 1.125rem, `ink-muted`, `tap-lg` tall) and its notes. The month's workouts and volume sit on flaps in the header. It opens on the latest training day, in its month; moving to another month opens that month's latest training day, or its 1st.

### Exercise rail (progress)
A rail of every exercise, grouped under its split's route marker, each row its name and latest estimated 1RM on flaps; the chosen row is on `surface`, and exercises with no sessions read "No sessions" at 50% opacity. Beside it, the chosen exercise: its name at Display size, its best load and best estimated 1RM on flaps (3.75rem, 4.5rem from 1280px wide), the next target and its status, two trend charts, then every session as a table row, newest first.

### Trend chart
A 2px `ink` line over a 10% `ink` wash on hairline gridlines, with the latest point ringed in board black. A crosshair follows the pointer or the arrow keys and names the session in a small tooltip. Charts are never yellow; the session table below is the chart's text version.

## Do's and Don'ts

### Do:
- **Do** put changing numbers on flap cells and let them turn over in stepped motion.
- **Do** use Departure White (`good`) for the single filled primary action on the board.
- **Do** give every secondary action the bordered `control` button with an `edge` border.
- **Do** keep yellow to the band, the home platform sign, the focus ring, the caret and selection.
- **Do** show the split as a round route marker.
- **Do** dim exercises that are neither current nor next to 50% opacity.
- **Do** ask for confirmation in the in-app dialog.
- **Do** use only token classes, as [THEME.md](src/theme/THEME.md) sets out.

### Don't:
- **Don't** fade, slide or scale a changing value; it flips in steps.
- **Don't** put colour on a flap or a third ink on the flaps.
- **Don't** fill a button on the board with yellow.
- **Don't** add drop shadows, gradients, glows or blur.
- **Don't** round corners beyond 4px, except the circle of a route marker.
- **Don't** label a value twice or stack a small heading above a heading.
- **Don't** use window.confirm or window.alert.
- **Don't** design phone layouts or bottom navigation.
