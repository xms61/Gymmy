import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elapsedSeconds, formatElapsed, workoutDurationMinutes } from '../src/components/tracker/workoutTime.ts';

const START = '2026-09-24T17:00:00.000Z';

test('measures elapsed time from the start timestamp, including time the tab was paused', () => {
  const CASES: [nowIso: string, expected: number][] = [
    ['2026-09-24T17:00:00.000Z', 0],
    ['2026-09-24T17:00:59.999Z', 59],
    ['2026-09-24T17:47:10.000Z', 2830],
    ['2026-09-24T16:59:00.000Z', 0]
  ];
  for (const [nowIso, expected] of CASES) {
    assert.equal(elapsedSeconds(START, Date.parse(nowIso)), expected, nowIso);
  }
});

test('records a workout duration in whole minutes, at least one', () => {
  const CASES: [endIso: string, expected: number][] = [
    ['2026-09-24T17:00:20.000Z', 1],
    ['2026-09-24T17:29:40.000Z', 30],
    ['2026-09-24T18:15:00.000Z', 75]
  ];
  for (const [endIso, expected] of CASES) {
    assert.equal(workoutDurationMinutes(START, endIso), expected, endIso);
  }
});

test('formats elapsed time as m:ss, or h:mm:ss after an hour', () => {
  const CASES: [seconds: number, expected: string][] = [
    [0, '0:00'],
    [65, '1:05'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [4505, '1:15:05']
  ];
  for (const [seconds, expected] of CASES) {
    assert.equal(formatElapsed(seconds), expected);
  }
});
