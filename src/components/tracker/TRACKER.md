---
status: draft
last-verified: 2026-10-01
---

# Live tracker

Entry: `src/components/tracker/LiveTracker.tsx`: the screen for logging one workout, from the first set to Finish. `App.tsx` opens it with a split type and, when resuming, a `WorkoutDraft`.
- `ElapsedClock.tsx`: the on-screen workout clock. It ticks on its own so the tracker does not re-render every second.
- `workoutTime.ts`: elapsed time, duration and formatting, computed from timestamps.
- `workoutDraft.ts`: saves, loads and clears the workout in progress (`gymmy_workout_draft_v1`).
- `ResumeWorkoutBanner.tsx`: the "Unfinished … workout" banner with Resume and Discard.
- `ExerciseBoard.tsx`: the exercise on the board: its name and target, the set on the board with load and reps on flap digits and a stepper under each, Log set (or, for a done set, the RIR pick and Not done), every set of the exercise as a strip of tiles, and its notes. `SetControls.tsx` holds the stepper, the RIR pick and the load stepping.
- `SessionBoard.tsx`: every exercise of the workout as one row, with its load and sets done. A row opens that exercise on the board.
- `RestTimer.tsx`: the rest countdown after each completed set, in flap digits beside the board; on a phone it rides at the foot of the screen. `RestIdle` shows the rest the next logged set starts. The chime comes from `src/utils/audio.ts`.
- `CompletionSummary.tsx`: the saved workout, with "Logged" on the flaps.
- `CommandLine.tsx` and `setCommand.ts`: the row at the foot of the tracker for typing sets (from tablet width on), and the pure parser and set lookups behind it. `COMMAND_HELP` in `setCommand.ts` lists the commands; `?` prints it.
- `plateStyle.ts`: the plate colors and sizes the calculator draws.
- `PlateCalculatorModal.tsx`: the home plates on each end for barbell, dumbbell and landmine lifts (`plateLayout` in `src/services/loading.ts`).

## Rules
- Time comes from timestamps (`startTime`, `Date.now()`), never from counting timer ticks. Browsers slow down or pause timers in background tabs.
- The weight steppers call `stepLoad` in `src/services/loading.ts`, so they step through the loads the home equipment makes. A typed weight the plates can't make gets a warning border and names the nearest loads.
- Weight, reps, the number of sets and note lengths are clamped to `LIMITS` in `src/validation.ts`, the bounds the server accepts. Add Set stops at 50 sets.
- The tracker gets `sessions` and `exercises` from `App` and keeps the copy it opened with, so recommendations are computed once per workout (`recommendations` map) and saving the workout doesn't move its own targets.
- `App` enables the Start buttons only after the first sync with the server, or after 5 s if the server is slow, so a new or cleared browser doesn't start from an empty history and the seeded starting loads.
- The draft is saved on every change to sets or notes. It is cleared in the same step that saves the finished session, and when the user leaves the workout. The rules for resuming and discarding live in `App.tsx`.
- `hasFinishedRef` guards Finish. A double tap fires both clicks before React re-renders, so state alone cannot stop the second save.
- A finished session is dated by the day `startTime` falls on.
- Audio starts only from a tap: `unlockAudio()` runs when a set is marked complete, and the chime reuses that one context.
- The rest timer schedules its chime on the audio clock when it starts (`scheduleTimerChime`), and reschedules or cancels it on pause, +/- time and skip, because browsers slow down or pause timers in background tabs. The countdown's own tick only updates the display and vibrates.
- The tracker holds a screen wake lock while it is open, and asks again when the tab comes back to the front.
- One exercise owns the board at a time: the one the set cursor is on. Logging a set moves the cursor to the next open set, in the same exercise or the next one with open sets, so the next set takes the board.
- Reps in reserve (RIR) is optional. Once a set is done, a 0–5 picker appears under it; picking the chosen value again clears it. It is stored in `SetLog.rpe` as 10 − RIR (`src/services/effort.ts`), so the stored format is unchanged, and history shows it as "8 @ RIR 2". Nothing in the load suggestions reads it yet.
- Commands act on the next open set, starting at the exercise under the cursor: `62.5x8@2` sets load, reps and RIR and marks the set done (which starts the rest timer like a tap), `x9` and `65x` change one value, `+` and `-` step the load through `stepLoad`, `d` and `u` mark done and undo. `fin` asks before saving, and `q` goes through the same confirmation as the back button.
- Keyboard: `j` and `k` move it, Space ticks the set under it, `n` and `p` jump between exercises, and `/` or `:` focuses the prompt. Shortcuts are ignored while a text field has focus, a modifier is held, or a dialog is open (`isShortcutFree` in `src/components/keyboardShortcuts.ts`).
- The exercise note is a one-row textarea that stays on one line, so Journal can let it wrap and grow in the margin.

## Data
A finished session stores every exercise of the split, including sets that were never ticked (`completed: false`). History readers must go through `indexCompletedLogs` and `logsFor` (`src/services/exerciseLogs.ts`), which skip them.

## Gotchas
- The 5-minute break after the last Deadlifts set is chosen by the exercise name containing "deadlift", not by an id or a setting.
- A draft from another version is refused, not migrated (`parseWorkoutDraft`). A draft only lives for one workout.
- Test UI changes in the running app against a copy of the database. Finishing a workout against the real server writes to `data/gymmy.db`.

## Tests
- `tests/workoutTime.test.ts`: elapsed time, duration and formatting.
- `tests/validation.test.ts`: draft parsing, including corrupt and outdated drafts.

The React components are checked in the running app.
