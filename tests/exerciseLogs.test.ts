import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workingSets, workingWeight } from '../src/services/exerciseLogs.ts';
import type { SetLog } from '../src/types/workout.ts';

function set(weightKg: number, repsCompleted: number): SetLog {
  return { setNumber: 1, weightKg, repsCompleted, targetReps: '6–8', completed: true };
}

test('the working sets are the ones at the heaviest weight', () => {
  const CASES: [label: string, sets: SetLog[], expected: SetLog[]][] = [
    ['straight sets', [set(60, 8), set(60, 7)], [set(60, 8), set(60, 7)]],
    ['a ramp-up set first', [set(40, 10), set(60, 8), set(60, 8)], [set(60, 8), set(60, 8)]],
    ['a back-off set last', [set(60, 8), set(60, 7), set(50, 12)], [set(60, 8), set(60, 7)]]
  ];
  for (const [label, sets, expected] of CASES) {
    assert.deepEqual(workingSets(sets), expected, label);
  }
  assert.equal(workingWeight([set(40, 10), set(60, 8)]), 60);
});
