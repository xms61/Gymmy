import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasUnsavedTargets, rebaseTargetEdits } from '../src/components/settings/targetEdits.ts';
import type { ExerciseDefinition } from '../src/types/workout.ts';

function exercise(id: string, targetSets: number, targetRepsMin = 6, targetRepsMax = 8): ExerciseDefinition {
  return {
    id,
    name: id.toUpperCase(),
    workoutType: 'Push',
    targetRepsMin,
    targetRepsMax,
    targetSets,
    defaultWeightKg: 60,
    defaultRestSeconds: 150,
    equipment: 'barbell',
    warmupRequired: false,
    notes: ''
  };
}

test('a sync that lands while Settings is open shows the new targets where the user changed nothing', () => {
  const opened = [exercise('flat-bench', 4), exercise('ohp', 3)];
  const synced = [exercise('flat-bench', 5), exercise('ohp', 3)];
  const rebased = rebaseTargetEdits(opened, synced, opened);
  assert.deepEqual(rebased, synced);
  assert.equal(hasUnsavedTargets(rebased, synced), false);
});

test("a sync keeps the user's own unsaved edits and takes every other field", () => {
  const opened = [exercise('flat-bench', 4, 6, 8), exercise('ohp', 3)];
  const edited = [exercise('flat-bench', 4, 5, 8), exercise('ohp', 3)];
  const synced = [exercise('flat-bench', 5, 6, 8), exercise('ohp', 2)];
  const rebased = rebaseTargetEdits(opened, synced, edited);
  assert.deepEqual(rebased, [exercise('flat-bench', 5, 5, 8), exercise('ohp', 2)]);
  assert.equal(hasUnsavedTargets(rebased, synced), true);
});

test('exercises are matched by id, so a reordered or longer list is not a change', () => {
  const stored = [exercise('flat-bench', 4), exercise('ohp', 3)];
  assert.equal(hasUnsavedTargets([exercise('ohp', 3), exercise('flat-bench', 4)], stored), false);
  const withNew = [...stored, exercise('dips', 3)];
  assert.deepEqual(rebaseTargetEdits(stored, withNew, stored), withNew);
});
