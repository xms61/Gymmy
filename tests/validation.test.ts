import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseExerciseDefinitions, parseWorkoutSession } from '../src/validation.ts';
import { EXERCISE_DEFINITIONS } from '../src/data/seedData.ts';
import type { WorkoutSession } from '../src/types/workout.ts';

function legsSession(): WorkoutSession {
  return {
    id: 'session-legs',
    name: 'Legs',
    splitType: 'Legs',
    date: '2026-09-20',
    startTime: '2026-09-20T09:00:00.000Z',
    durationMinutes: 55,
    totalVolumeKg: 1120,
    completed: true,
    exercises: [
      {
        exerciseId: 'squats',
        exerciseName: 'SQUATS',
        sets: [{ setNumber: 1, weightKg: 70, repsCompleted: 8, targetReps: '5–8', completed: true, rpe: 8.5 }]
      }
    ]
  };
}

function withField(path: (string | number)[], value: unknown): unknown {
  const copy = structuredClone(legsSession()) as unknown as Record<string | number, unknown>;
  let target = copy;
  for (const key of path.slice(0, -1)) target = target[key] as Record<string | number, unknown>;
  target[path[path.length - 1]!] = value;
  return copy;
}

test('accepts a valid session and adds no missing optional fields', () => {
  assert.deepEqual(parseWorkoutSession(legsSession()), { ok: true, value: legsSession() });
});

test('keeps optional session fields when they are present', () => {
  const session = { ...legsSession(), endTime: '2026-09-20T09:55:00.000Z', notes: 'Deep squats' };
  assert.deepEqual(parseWorkoutSession(session), { ok: true, value: session });
});

test('drops fields that are not part of a session', () => {
  const parsed = parseWorkoutSession({ ...legsSession(), extra: 'ignored' });
  assert.deepEqual(parsed, { ok: true, value: legsSession() });
});

test('names the first invalid session field', () => {
  const CASES: [input: unknown, error: string][] = [
    [null, 'session must be an object'],
    [[], 'session must be an object'],
    [withField(['id'], ''), 'session.id must not be empty'],
    [withField(['splitType'], 'Arms'), 'session.splitType must be one of Push, Pull, Legs, Other'],
    [withField(['date'], '20/09/2026'), 'session.date must be a date in YYYY-MM-DD form'],
    [withField(['durationMinutes'], 12.5), 'session.durationMinutes must be a whole number >= 0'],
    [withField(['totalVolumeKg'], -1), 'session.totalVolumeKg must be a number >= 0'],
    [withField(['totalVolumeKg'], Number.NaN), 'session.totalVolumeKg must be a number >= 0'],
    [withField(['completed'], 'yes'), 'session.completed must be true or false'],
    [withField(['notes'], 5), 'session.notes must be a string'],
    [withField(['exercises'], {}), 'session.exercises must be an array'],
    [withField(['exercises', 0, 'equipment'], 'kettlebell'), 'session.exercises[0].equipment must be one of barbell, dumbbell, cable, bodyweight, machine'],
    [withField(['exercises', 0, 'sets', 0, 'setNumber'], 0), 'session.exercises[0].sets[0].setNumber must be a whole number >= 1'],
    [withField(['exercises', 0, 'sets', 0, 'repsCompleted'], '8'), 'session.exercises[0].sets[0].repsCompleted must be a whole number >= 0'],
    [withField(['exercises', 0, 'sets', 0, 'rpe'], -2), 'session.exercises[0].sets[0].rpe must be a number >= 0']
  ];
  for (const [input, error] of CASES) {
    assert.deepEqual(parseWorkoutSession(input), { ok: false, error });
  }
});

test('accepts the seed routine as exercise definitions', () => {
  assert.deepEqual(parseExerciseDefinitions(EXERCISE_DEFINITIONS), { ok: true, value: EXERCISE_DEFINITIONS });
});

test('names the first invalid exercise definition field', () => {
  const [bench] = EXERCISE_DEFINITIONS;
  const CASES: [input: unknown, error: string][] = [
    [bench, 'exercises must be an array'],
    [[{ ...bench, name: ' ' }], 'exercises[0].name must not be empty'],
    [[{ ...bench, targetSets: 0 }], 'exercises[0].targetSets must be a whole number >= 1'],
    [[{ ...bench, targetRepsMin: 9, targetRepsMax: 8 }], 'exercises[0].targetRepsMin must not be greater than targetRepsMax'],
    [[{ ...bench, warmupRequired: 1 }], 'exercises[0].warmupRequired must be true or false'],
    [[bench, { ...bench, workoutType: 'Cardio' }], 'exercises[1].workoutType must be one of Push, Pull, Legs, Other']
  ];
  for (const [input, error] of CASES) {
    assert.deepEqual(parseExerciseDefinitions(input), { ok: false, error });
  }
});
