import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latestSession, nextSplit } from '../src/services/rotation.ts';
import type { SplitType, WorkoutSession } from '../src/types/workout.ts';

function session(splitType: SplitType, date: string, time = '10:00', completed = true): WorkoutSession {
  return {
    id: `${splitType}-${date}-${time}`,
    name: splitType,
    splitType,
    date,
    startTime: `${date}T${time}:00.000Z`,
    durationMinutes: 60,
    totalVolumeKg: 0,
    completed,
    exercises: []
  };
}

test('starts with Push and follows Push, Pull, Legs', () => {
  const CASES: [label: string, sessions: WorkoutSession[], expected: SplitType][] = [
    ['no history', [], 'Push'],
    ['after Push', [session('Push', '2026-09-01')], 'Pull'],
    ['after Pull', [session('Push', '2026-09-01'), session('Pull', '2026-09-03')], 'Legs'],
    ['after Legs', [session('Legs', '2026-09-05'), session('Pull', '2026-09-03')], 'Push']
  ];
  for (const [label, sessions, expected] of CASES) {
    assert.equal(nextSplit(sessions), expected, label);
  }
});

test('breaks a same-day tie by start time, whatever the list order', () => {
  const evening = session('Pull', '2026-09-10', '18:00');
  const morning = session('Push', '2026-09-10', '07:00');
  assert.equal(nextSplit([evening, morning]), 'Legs');
  assert.equal(nextSplit([morning, evening]), 'Legs');
});

test('an Other workout or an unfinished one does not move the rotation', () => {
  assert.equal(nextSplit([session('Push', '2026-09-01'), session('Other', '2026-09-02')]), 'Pull');
  assert.equal(nextSplit([session('Push', '2026-09-01'), session('Pull', '2026-09-02', '10:00', false)]), 'Pull');
});

test('the latest session includes every split', () => {
  const other = session('Other', '2026-09-02');
  assert.equal(latestSession([session('Push', '2026-09-01'), other]), other);
  assert.equal(latestSession([]), null);
});
