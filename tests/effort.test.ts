import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatReps, rirOf, withRir } from '../src/services/effort.ts';
import type { SetLog } from '../src/types/workout.ts';

const SET: SetLog = { setNumber: 1, weightKg: 60, repsCompleted: 8, targetReps: '6–8', completed: true };

test('RIR is stored as 10 minus RIR in the rpe field', () => {
  assert.equal(withRir(SET, 2).rpe, 8);
  assert.equal(rirOf(withRir(SET, 0)), 0);
  assert.equal(rirOf(SET), null);
});

test('clearing the RIR removes the field instead of storing a placeholder', () => {
  assert.deepEqual(withRir(withRir(SET, 3), null), SET);
  assert.ok(!('rpe' in withRir(withRir(SET, 3), null)));
});

test('reps read "8 @ RIR 2" only when the RIR was logged', () => {
  assert.equal(formatReps(SET), '8');
  assert.equal(formatReps(withRir(SET, 2)), '8 @ RIR 2');
  assert.equal(formatReps({ ...SET, rpe: 8.5 }), '8 @ RIR 1.5');
});
