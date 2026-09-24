import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDayMonth, formatDisplayDate, formatSessionDate, toLocalDateString } from '../src/utils/date.ts';

test('formats a local date as YYYY-MM-DD without shifting to UTC', () => {
  const CASES: [date: Date, expected: string][] = [
    [new Date(2026, 8, 7), '2026-09-07'],
    [new Date(2026, 8, 7, 23, 59), '2026-09-07'],
    [new Date(2026, 0, 1, 0, 0), '2026-01-01'],
    [new Date(2026, 11, 31, 23, 59), '2026-12-31']
  ];
  for (const [date, expected] of CASES) {
    assert.equal(toLocalDateString(date), expected);
  }
});

test('shows a stored date as the same calendar day', () => {
  assert.equal(formatDisplayDate('2026-09-07'), 'Monday, Sep 7, 2026');
});

test('writes a session date out only for themes that ask for it', () => {
  assert.equal(formatSessionDate('2026-09-24', 'numeric'), '2026-09-24');
  assert.equal(formatSessionDate('2026-09-24', 'written'), 'Thursday, 24 September');
  assert.equal(formatSessionDate('2026-01-01', 'written'), 'Thursday, 1 January');
});

test('shortens a date to day and month for a stamp', () => {
  assert.equal(formatDayMonth('2026-09-24'), '24 Sep');
});
