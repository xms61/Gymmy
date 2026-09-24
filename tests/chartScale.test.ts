import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nearestIndex, pointX, pointY, valueAxis } from '../src/components/analytics/chartScale.ts';

test('the value axis covers every value with round ticks', () => {
  const CASES: [values: number[], expected: number[]][] = [
    [[69.7, 72.4, 75.1], [68, 70, 72, 74, 76]],
    [[1200, 1850, 2400], [1000, 1500, 2000, 2500]],
    [[5, 6.25], [5, 5.5, 6, 6.5]]
  ];
  for (const [values, expected] of CASES) {
    const axis = valueAxis(values);
    assert.deepEqual(axis.ticks, expected, values.join(','));
    assert.ok(axis.min <= Math.min(...values) && axis.max >= Math.max(...values));
  }
});

test('a flat series sits inside the axis, not on its edge', () => {
  const axis = valueAxis([80, 80]);
  assert.ok(axis.min < 80 && axis.max > 80, JSON.stringify(axis));
});

test('points spread across the width, and one point sits in the middle', () => {
  assert.deepEqual([0, 1, 2].map(i => pointX(i, 3, 300)), [0, 150, 300]);
  assert.equal(pointX(0, 1, 300), 150);
});

test('higher values sit higher on the chart', () => {
  const axis = { min: 0, max: 100, ticks: [0, 50, 100] };
  assert.deepEqual([0, 50, 100].map(v => pointY(v, axis, 120)), [120, 60, 0]);
});

test('hovering picks the closest session', () => {
  assert.deepEqual([0, 70, 80, 300, 500, -20].map(x => nearestIndex(x, 3, 300)), [0, 0, 1, 2, 2, 0]);
  assert.equal(nearestIndex(120, 1, 300), 0);
});
