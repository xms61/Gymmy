---
version: 1
slug: "src-components-settings-settingsview-tsx"
primary_target: "src/components/settings/SettingsView.tsx"
related_targets: []
---

## Scope
The Settings screen (`src/components/settings/SettingsView.tsx`) and the dialogs, inside the Departure Board world (DESIGN.md). Mode: Operate. Desktop web only.

## Approval
The user chose "Own screen" over keeping the pop-up: "Settings becomes a full screen like Calendar and Progress, opened from the gear in the header. Exercise targets get a proper table with room for all 12 exercises; data and backup sit beside it." No structure round: the contents are fixed (sync status, backup and restore, clear history, exercise targets).

## Build path
`.impeccable/config.json` records comp-first, the user's choice at init. This build, like every surface of this world, ran code-first because no image generation was available in the session; no comp round took place.

## Job
Change an exercise's sets or rep range and save it; see whether the server is reachable; download or restore a backup; clear the history.

## Direction contract
THESIS: Settings is a board screen, not a pop-up: the targets of every exercise in one table, the data tools in a column beside it. Refuses the category default: a tabbed modal of stacked panels.
OWN-WORLD: DESIGN.md unchanged. Split groups under route marker and name, Barlow Condensed headings on hairlines, bordered secondary buttons, Departure White for Save, `bad-ink` only for clearing history.
STORY: You open Settings from the gear, change a rep range in the table, save, and leave; leaving with unsaved changes asks first.
FIRST VIEWPORT: Left (3/5): Exercise targets at Display size with Save beside it, then the table grouped by split. Right (2/5): Data, Backup and restore, Clear history.
FORM: Own screen, the user's choice; no seed.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
