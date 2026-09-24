import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indexCompletedLogs, logsFor, workingSets, workingWeight } from '../src/services/exerciseLogs.ts';
import { EXERCISE_DEFINITIONS } from '../src/data/seedData.ts';
import type { SetLog, WorkoutSession } from '../src/types/workout.ts';

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

function session(id: string, date: string, logs: { exerciseId: string; exerciseName: string; sets: SetLog[] }[], completed = true): WorkoutSession {
  return {
    id,
    name: 'Legs',
    splitType: 'Legs',
    date,
    startTime: `${date}T09:00:00.000Z`,
    durationMinutes: 50,
    totalVolumeKg: 0,
    completed,
    exercises: logs
  };
}

const SQUATS = EXERCISE_DEFINITIONS.find(e => e.id === 'squats')!;
const RDL = EXERCISE_DEFINITIONS.find(e => e.id === 'rdl')!;

test('indexes every exercise in one pass, oldest session first', () => {
  const sessions = [
    session('b', '2026-09-08', [{ exerciseId: 'squats', exerciseName: 'SQUATS', sets: [set(72.5, 6)] }]),
    session('a', '2026-09-01', [
      { exerciseId: 'squats', exerciseName: 'SQUATS', sets: [set(70, 8)] },
      { exerciseId: 'rdl', exerciseName: 'RDL', sets: [set(50, 10)] }
    ])
  ];
  const index = indexCompletedLogs(sessions, [SQUATS, RDL]);
  assert.deepEqual(logsFor(index, SQUATS).map(log => log.session.id), ['a', 'b']);
  assert.deepEqual(logsFor(index, RDL).map(log => log.session.id), ['a']);
});

test('files a log with an unknown id under the exercise with its name', () => {
  const index = indexCompletedLogs([session('a', '2026-09-01', [{ exerciseId: 'old-squat', exerciseName: 'Squats', sets: [set(70, 8)] }])], [SQUATS]);
  assert.equal(logsFor(index, SQUATS).length, 1);
});

test('leaves out unfinished sessions and logs without a completed set', () => {
  const unticked = { ...set(70, 8), completed: false };
  const sessions = [
    session('unfinished', '2026-09-01', [{ exerciseId: 'squats', exerciseName: 'SQUATS', sets: [set(70, 8)] }], false),
    session('skipped', '2026-09-03', [{ exerciseId: 'squats', exerciseName: 'SQUATS', sets: [unticked, set(70, 0)] }]),
    session('done', '2026-09-05', [{ exerciseId: 'squats', exerciseName: 'SQUATS', sets: [set(70, 8), unticked] }])
  ];
  const logs = logsFor(indexCompletedLogs(sessions, [SQUATS]), SQUATS);
  assert.deepEqual(logs.map(log => [log.session.id, log.sets.length]), [['done', 1]]);
});

test('counts only the first log of an exercise in a session', () => {
  const sessions = [
    session('a', '2026-09-01', [
      { exerciseId: 'squats', exerciseName: 'SQUATS', sets: [set(70, 8)] },
      { exerciseId: 'old-squat', exerciseName: 'SQUATS', sets: [set(60, 10)] }
    ])
  ];
  const logs = logsFor(indexCompletedLogs(sessions, [SQUATS]), SQUATS);
  assert.deepEqual(logs.map(log => log.sets[0]!.weightKg), [70]);
});
