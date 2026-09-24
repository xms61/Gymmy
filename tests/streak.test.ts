import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weeklyStreak } from '../src/services/streak.ts';
import type { WorkoutSession } from '../src/types/workout.ts';

function sessionOn(date: string, completed = true): WorkoutSession {
  return {
    id: date,
    name: 'Push',
    splitType: 'Push',
    date,
    startTime: `${date}T10:00:00.000Z`,
    durationMinutes: 60,
    totalVolumeKg: 0,
    completed,
    exercises: []
  };
}

// 2026-09-24 is a Thursday; its week runs from Monday 21 to Sunday 27 September.
const THURSDAY = new Date(2026, 8, 24, 12);

test('counts weeks in a row with at least one session', () => {
  const CASES: [label: string, dates: string[], expected: number][] = [
    ['no sessions', [], 0],
    ['this week only', ['2026-09-21'], 1],
    ['three weeks in a row', ['2026-09-22', '2026-09-15', '2026-09-08'], 3],
    ['two sessions in one week count once', ['2026-09-22', '2026-09-23'], 1],
    ['a gap ends the streak', ['2026-09-22', '2026-09-01'], 1],
    ['Sunday belongs to the week before', ['2026-09-21', '2026-09-20'], 2]
  ];
  for (const [label, dates, expected] of CASES) {
    assert.equal(weeklyStreak(dates.map(date => sessionOn(date)), THURSDAY), expected, label);
  }
});

test('a week without a session yet does not break the streak', () => {
  assert.equal(weeklyStreak([sessionOn('2026-09-16'), sessionOn('2026-09-09')], THURSDAY), 2);
});

test('counts across a year boundary and ignores unfinished sessions', () => {
  const newYear = new Date(2026, 0, 2, 12);
  assert.equal(weeklyStreak([sessionOn('2026-01-01'), sessionOn('2025-12-24')], newYear), 2);
  assert.equal(weeklyStreak([sessionOn('2026-09-22', false)], THURSDAY), 0);
});
