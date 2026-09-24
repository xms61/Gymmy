# Live tracker

Entry: `src/components/tracker/LiveTracker.tsx`: the screen for logging one workout, from the first set to Finish. `App.tsx` opens it with a split type and, when resuming, a `WorkoutDraft`.
- `ElapsedClock.tsx`: the on-screen workout clock. It ticks on its own so the tracker does not re-render every second.
- `workoutTime.ts`: elapsed time, duration and formatting, computed from timestamps.
- `workoutDraft.ts`: saves, loads and clears the workout in progress (`gymmy_workout_draft_v1`).
- `ResumeWorkoutBanner.tsx`: the "Unfinished … workout" banner with Resume and Discard.
- `RestTimer.tsx`: the rest countdown after each completed set. It plays `playTimerChime` from `src/utils/audio.ts`.
- `PlateCalculatorModal.tsx`: plates per side for barbell lifts (`calculatePlates`).

## Rules
- Time comes from timestamps (`startTime`, `Date.now()`), never from counting timer ticks. Browsers slow down or pause timers in background tabs.
- Recommendations are computed once per workout (`recommendations` map). History does not change while the tracker is open.
- The draft is saved on every change to sets or notes. It is cleared in the same step that saves the finished session, and when the user leaves the workout. The rules for resuming and discarding live in `App.tsx`.
- `hasFinishedRef` guards Finish. A double tap fires both clicks before React re-renders, so state alone cannot stop the second save.
- A finished session is dated by the day `startTime` falls on.
- Audio starts only from a tap: `unlockAudio()` runs when a set is marked complete, and the chime reuses that one context.

## Data
A finished session stores every exercise of the split, including sets that were never ticked (`completed: false`). History readers must go through `completedExerciseLogs` (`src/services/exerciseLogs.ts`), which skips them.

## Gotchas
- The 5-minute break after the last Deadlifts set is chosen by the exercise name containing "deadlift", not by an id or a setting.
- A draft from another version is refused, not migrated (`parseWorkoutDraft`). A draft only lives for one workout.
- Test UI changes in the running app against a copy of the database. Finishing a workout against the real server writes to `data/gymmy.db`.

## Tests
- `tests/workoutTime.test.ts`: elapsed time, duration and formatting.
- `tests/validation.test.ts`: draft parsing, including corrupt and outdated drafts.

The React components are checked in the running app.
