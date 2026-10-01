import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthGrid } from '../src/components/calendar/monthGrid.ts';

test('starts on the Monday on or before the 1st and ends on a Sunday', () => {
  // October 2026 starts on a Thursday and ends on a Saturday.
  const days = monthGrid(2026, 9);
  assert.equal(days[0]!.date, '2026-09-28');
  assert.equal(days[days.length - 1]!.date, '2026-11-01');
  assert.equal(days.length, 35);
});

test('marks only the month’s own days as in the month', () => {
  const days = monthGrid(2026, 9);
  assert.equal(days.filter(d => d.inMonth).length, 31);
  assert.deepEqual(days.slice(2, 5).map(d => [d.dayNumber, d.inMonth]), [[30, false], [1, true], [2, true]]);
});

test('adds no leading days when the 1st is a Monday', () => {
  // June 2026 starts on a Monday.
  const days = monthGrid(2026, 5);
  assert.equal(days[0]!.date, '2026-06-01');
  assert.equal(days.length % 7, 0);
});

test('takes six weeks when the month needs them', () => {
  // August 2026 starts on a Saturday and has 31 days.
  assert.equal(monthGrid(2026, 7).length, 42);
});
