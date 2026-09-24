import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyWeightKg,
  isLoadable,
  loadedEnds,
  lightestLoad,
  loadableWeights,
  nearestLoad,
  plateLayout,
  platesInUse,
  stepLoad
} from '../src/services/loading.ts';
import type { EquipmentType } from '../src/types/workout.ts';

function stepsOf(from: number, to: number, stepKg: number): number[] {
  return Array.from({ length: Math.round((to - from) / stepKg) + 1 }, (_, i) => from + i * stepKg);
}

test('lists every load the home plates make', () => {
  assert.deepEqual(loadableWeights('barbell'), stepsOf(10, 142.5, 2.5));
  assert.deepEqual(loadableWeights('dumbbell'), stepsOf(0, 25, 2.5));
  assert.deepEqual(loadableWeights('landmine'), stepsOf(0, 132.5, 1.25));
});

test('lays out the plates for one end, heaviest first', () => {
  const CASES: [equipment: 'barbell' | 'dumbbell' | 'landmine', weightKg: number, expected: number[] | null][] = [
    ['barbell', 10, []],
    ['barbell', 100, [20, 15, 10]],
    ['barbell', 27.5, [5, 2.5, 1.25]],
    ['barbell', 142.5, [20, 15, 10, 5, 5, 5, 2.5, 2.5, 1.25]],
    ['barbell', 145, null],
    ['barbell', 61, null],
    ['dumbbell', 12.5, [5, 1.25]],
    ['dumbbell', 27.5, null],
    ['landmine', 21.25, [20, 1.25]],
    ['landmine', 40, [20, 20]]
  ];
  for (const [equipment, weightKg, expected] of CASES) {
    assert.deepEqual(plateLayout(weightKg, equipment), expected, `${equipment} ${weightKg} kg`);
  }
});

test('steps to the next load up or down, and stops at the limits', () => {
  const CASES: [equipment: EquipmentType, weightKg: number, direction: 1 | -1, expected: number | null][] = [
    ['barbell', 60, 1, 62.5],
    ['barbell', 61, 1, 62.5],
    ['barbell', 61, -1, 60],
    ['barbell', 142.5, 1, null],
    ['barbell', 10, -1, null],
    ['dumbbell', 5, 1, 7.5],
    ['dumbbell', 25, 1, null],
    ['dumbbell', 2.5, -1, null],
    ['landmine', 20, 1, 21.25],
    ['landmine', 1.25, -1, null],
    ['machine', 60, 1, 62.5],
    ['machine', 3, -1, 2.5],
    ['machine', 2.5, -1, null],
    ['bodyweight', 0, 1, 2.5]
  ];
  for (const [equipment, weightKg, direction, expected] of CASES) {
    assert.equal(stepLoad(weightKg, equipment, direction), expected, `${equipment} ${weightKg} kg ${direction}`);
  }
});

test('knows the lightest load worth suggesting', () => {
  const CASES: [equipment: EquipmentType, expected: number][] = [
    ['barbell', 10],
    ['dumbbell', 2.5],
    ['landmine', 1.25],
    ['machine', 2.5],
    ['bodyweight', 0]
  ];
  for (const [equipment, expected] of CASES) {
    assert.equal(lightestLoad(equipment), expected, equipment);
  }
});

test('rounds to the nearest load that can be made, the lighter one on a tie', () => {
  const CASES: [equipment: EquipmentType, weightKg: number, expected: number][] = [
    ['barbell', 72, 72.5],
    ['barbell', 71.25, 70],
    ['barbell', 5, 10],
    ['barbell', 500, 142.5],
    ['dumbbell', 9, 10],
    ['machine', 54, 55]
  ];
  for (const [equipment, weightKg, expected] of CASES) {
    assert.equal(nearestLoad(weightKg, equipment), expected, `${equipment} ${weightKg} kg`);
  }
});

test('tells loads the plates make from those they cannot', () => {
  assert.equal(isLoadable(62.5, 'barbell'), true);
  assert.equal(isLoadable(61, 'barbell'), false);
  assert.equal(isLoadable(7.5, 'dumbbell'), true);
  assert.equal(isLoadable(61, 'machine'), true);
});

test('describes each plate-loaded implement', () => {
  assert.deepEqual([emptyWeightKg('barbell'), loadedEnds('barbell')], [10, 2]);
  assert.deepEqual([emptyWeightKg('dumbbell'), loadedEnds('dumbbell')], [0, 2]);
  assert.deepEqual([emptyWeightKg('landmine'), loadedEnds('landmine')], [0, 1]);
});

test('counts the plates a layout takes on the whole implement', () => {
  assert.deepEqual(platesInUse([20, 15, 2.5], 'barbell'), [
    { kg: 20, inUse: 2, owned: 2 },
    { kg: 15, inUse: 2, owned: 2 },
    { kg: 2.5, inUse: 2, owned: 4 }
  ]);
  assert.deepEqual(platesInUse([5, 5, 1.25], 'landmine'), [
    { kg: 5, inUse: 2, owned: 6 },
    { kg: 1.25, inUse: 1, owned: 2 }
  ]);
  assert.deepEqual(platesInUse([], 'dumbbell'), []);
});
