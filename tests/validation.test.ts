import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampTo,
  hasValidRepRange,
  LIMITS,
  parseExerciseDefinitions,
  parseWorkoutDraft,
  parseWorkoutSession
} from '../src/validation.ts';
import { EXERCISE_DEFINITIONS } from '../src/data/seedData.ts';
import type { WorkoutDraft, WorkoutSession } from '../src/types/workout.ts';

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
    [withField(['exercises', 0, 'equipment'], 'kettlebell'), 'session.exercises[0].equipment must be one of barbell, dumbbell, cable, bodyweight, machine, landmine'],
    [withField(['exercises', 0, 'sets', 0, 'setNumber'], 0), 'session.exercises[0].sets[0].setNumber must be a whole number from 1 to 50'],
    [withField(['exercises', 0, 'sets', 0, 'repsCompleted'], '8'), 'session.exercises[0].sets[0].repsCompleted must be a whole number from 0 to 1000'],
    [withField(['exercises', 0, 'sets', 0, 'rpe'], -2), 'session.exercises[0].sets[0].rpe must be a number from 0 to 10']
  ];
  for (const [input, error] of CASES) {
    assert.deepEqual(parseWorkoutSession(input), { ok: false, error });
  }
});

test('refuses values beyond the limits that would stall the tracker or bloat storage', () => {
  const longText = 'x'.repeat(10_001);
  const oneSet = legsSession().exercises[0]!.sets[0]!;
  const CASES: [label: string, input: unknown, error: string][] = [
    ['absurd weight', withField(['exercises', 0, 'sets', 0, 'weightKg'], 1001), 'session.exercises[0].sets[0].weightKg must be a number from 0 to 1000'],
    ['absurd reps', withField(['exercises', 0, 'sets', 0, 'repsCompleted'], 1001), 'session.exercises[0].sets[0].repsCompleted must be a whole number from 0 to 1000'],
    ['RPE above 10', withField(['exercises', 0, 'sets', 0, 'rpe'], 11), 'session.exercises[0].sets[0].rpe must be a number from 0 to 10'],
    ['too many sets', withField(['exercises', 0, 'sets'], Array(51).fill(oneSet)), 'session.exercises[0].sets must have at most 50 items'],
    ['too many exercises', withField(['exercises'], Array(51).fill(legsSession().exercises[0])), 'session.exercises must have at most 50 items'],
    ['long notes', withField(['notes'], longText), 'session.notes must be at most 10000 characters'],
    ['long name', withField(['name'], 'x'.repeat(201)), 'session.name must be at most 200 characters']
  ];
  for (const [label, input, error] of CASES) {
    assert.deepEqual(parseWorkoutSession(input), { ok: false, error }, label);
  }
});

test('accepts values at the limits', () => {
  const CASES: [label: string, input: unknown][] = [
    ['heaviest weight', withField(['exercises', 0, 'sets', 0, 'weightKg'], 1000)],
    ['longest notes', withField(['notes'], 'x'.repeat(10_000))],
    ['a very long workout', withField(['durationMinutes'], 4 * 24 * 60)]
  ];
  for (const [label, input] of CASES) {
    assert.equal(parseWorkoutSession(input).ok, true, label);
  }
});

test('refuses dates and times that do not exist', () => {
  const CASES: [label: string, input: unknown, error: string][] = [
    ['30 February', withField(['date'], '2026-02-30'), 'session.date must be a real calendar date'],
    ['month 13', withField(['date'], '2026-13-01'), 'session.date must be a real calendar date'],
    ['29 February outside a leap year', withField(['date'], '2026-02-29'), 'session.date must be a real calendar date'],
    ['start time that is not a time', withField(['startTime'], 'banana'), 'session.startTime must be a date and time'],
    ['end time that is not a time', withField(['endTime'], 'later'), 'session.endTime must be a date and time']
  ];
  for (const [label, input, error] of CASES) {
    assert.deepEqual(parseWorkoutSession(input), { ok: false, error }, label);
  }
  assert.equal(parseWorkoutSession(withField(['date'], '2028-02-29')).ok, true, '29 February in a leap year');
});

test('clamps an input to its limits', () => {
  const CASES: [value: number, expected: number][] = [
    [62.5, 62.5],
    [-5, 0],
    [5000, 1000],
    [Number.NaN, 0]
  ];
  for (const [value, expected] of CASES) {
    assert.equal(clampTo(LIMITS.weightKg, value), expected, String(value));
  }
  assert.equal(clampTo(LIMITS.durationMinutes, 1e6), 1e6, 'no upper limit');
});

test('accepts the seed routine as exercise definitions', () => {
  assert.deepEqual(parseExerciseDefinitions(EXERCISE_DEFINITIONS), { ok: true, value: EXERCISE_DEFINITIONS });
});

test('names the first invalid exercise definition field', () => {
  const [bench] = EXERCISE_DEFINITIONS;
  const CASES: [input: unknown, error: string][] = [
    [bench, 'exercises must be an array'],
    [[{ ...bench, name: ' ' }], 'exercises[0].name must not be empty'],
    [[{ ...bench, targetSets: 0 }], 'exercises[0].targetSets must be a whole number from 1 to 20'],
    [[{ ...bench, targetSets: 1e9 }], 'exercises[0].targetSets must be a whole number from 1 to 20'],
    [[{ ...bench, defaultRestSeconds: 3601 }], 'exercises[0].defaultRestSeconds must be a whole number from 0 to 3600'],
    [Array(201).fill(bench), 'exercises must have at most 200 items'],
    [[{ ...bench, targetRepsMin: 9, targetRepsMax: 8 }], 'exercises[0].targetRepsMin must not be greater than targetRepsMax'],
    [[{ ...bench, warmupRequired: 1 }], 'exercises[0].warmupRequired must be true or false'],
    [[bench, { ...bench, workoutType: 'Cardio' }], 'exercises[1].workoutType must be one of Push, Pull, Legs, Other']
  ];
  for (const [input, error] of CASES) {
    assert.deepEqual(parseExerciseDefinitions(input), { ok: false, error });
  }
});

test('a rep range is valid when min is not above max', () => {
  const CASES: [min: number, max: number, expected: boolean][] = [
    [6, 8, true],
    [8, 8, true],
    [9, 8, false]
  ];
  for (const [targetRepsMin, targetRepsMax, expected] of CASES) {
    assert.equal(hasValidRepRange({ targetRepsMin, targetRepsMax }), expected, `${targetRepsMin}-${targetRepsMax}`);
  }
});

function pullDraft(): WorkoutDraft {
  return {
    version: 1,
    workoutType: 'Pull',
    startTime: '2026-09-24T17:02:00.000Z',
    sessionNotes: '',
    exerciseLogs: [
      {
        exerciseId: 'deadlifts',
        exerciseName: 'Deadlifts',
        equipment: 'barbell',
        notes: 'Follow with Pull Ups (5 min break)',
        sets: [
          { setNumber: 1, weightKg: 100, repsCompleted: 5, targetReps: '5–6', completed: true },
          { setNumber: 2, weightKg: 100, repsCompleted: 5, targetReps: '5–6', completed: false }
        ]
      }
    ]
  };
}

test('restores a saved workout draft unchanged', () => {
  assert.deepEqual(parseWorkoutDraft(pullDraft()), { ok: true, value: pullDraft() });
});

test('refuses a corrupt or outdated workout draft', () => {
  const CASES: [label: string, input: unknown, error: string][] = [
    ['not an object', 'Pull', 'draft must be an object'],
    ['no version (older format)', { ...pullDraft(), version: undefined }, 'draft.version must be 1'],
    ['newer version', { ...pullDraft(), version: 2 }, 'draft.version must be 1'],
    ['unknown split', { ...pullDraft(), workoutType: 'Arms' }, 'draft.workoutType must be one of Push, Pull, Legs, Other'],
    ['bad start time', { ...pullDraft(), startTime: 'yesterday' }, 'draft.startTime must be a date and time'],
    ['broken set', { ...pullDraft(), exerciseLogs: [{ ...pullDraft().exerciseLogs[0], sets: [{}] }] }, 'draft.exerciseLogs[0].sets[0].setNumber must be a whole number from 1 to 50']
  ];
  for (const [label, input, error] of CASES) {
    assert.deepEqual(parseWorkoutDraft(input), { ok: false, error }, label);
  }
});
