import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlates, estimate1RM, getRecommendation } from '../src/services/overloadEngine.ts';
import type { EquipmentType, ExerciseDefinition, OverloadStatus, WorkoutSession } from '../src/types/workout.ts';

function flatBench(): ExerciseDefinition {
  return {
    id: 'flat-bench',
    name: 'FLAT BENCH',
    workoutType: 'Push',
    targetRepsMin: 6,
    targetRepsMax: 8,
    targetSets: 3,
    defaultWeightKg: 60,
    defaultRestSeconds: 150,
    equipment: 'barbell'
  };
}

function benchSession(date: string, weightKg: number, reps: number[]): WorkoutSession {
  return {
    id: `session-${date}`,
    name: 'Push',
    splitType: 'Push',
    date,
    startTime: `${date}T10:00:00.000Z`,
    durationMinutes: 60,
    completed: true,
    totalVolumeKg: reps.reduce((sum, r) => sum + r * weightKg, 0),
    exercises: [
      {
        exerciseId: 'flat-bench',
        exerciseName: 'FLAT BENCH',
        sets: reps.map((repsCompleted, i) => ({
          setNumber: i + 1,
          weightKg,
          repsCompleted,
          targetReps: '6-8',
          completed: true
        }))
      }
    ]
  };
}

test('recommends the default load when there is no history', () => {
  const rec = getRecommendation(flatBench(), []);
  assert.equal(rec.status, 'maintain');
  assert.equal(rec.recommendedWeightKg, 60);
});

test('adds 2.5 kg to a barbell lift when every set reaches the top of the range', () => {
  const rec = getRecommendation(flatBench(), [benchSession('2026-09-01', 60, [8, 8, 8])]);
  assert.equal(rec.status, 'increase_load');
  assert.equal(rec.recommendedWeightKg, 62.5);
});

test('keeps the load and asks for reps when later sets fall short', () => {
  const rec = getRecommendation(flatBench(), [benchSession('2026-09-02', 60, [8, 6, 5])]);
  assert.equal(rec.status, 'progress_reps');
  assert.equal(rec.recommendedWeightKg, 60);
});

test('uses the most recent session when history is out of order', () => {
  const history = [benchSession('2026-09-01', 60, [8, 8, 8]), benchSession('2026-09-05', 62.5, [7, 6, 6])];
  const rec = getRecommendation(flatBench(), history);
  assert.equal(rec.currentWeightKg, 62.5);
  assert.equal(rec.status, 'progress_reps');
});

test('suggests a 10 % deload after two sessions below the minimum reps', () => {
  const history = [benchSession('2026-09-01', 80, [4, 4, 3]), benchSession('2026-09-03', 80, [4, 3, 3])];
  const rec = getRecommendation(flatBench(), history);
  assert.equal(rec.status, 'deload');
  assert.equal(rec.recommendedWeightKg, 72.5);
});

test('splits a barbell load into plates per side', () => {
  const CASES: [targetKg: number, expected: Record<number, number>][] = [
    [20, {}],
    [62.5, { 20: 1, 1.25: 1 }],
    [100, { 25: 1, 15: 1 }],
    [140, { 25: 2, 10: 1 }]
  ];
  for (const [targetKg, expected] of CASES) {
    assert.deepEqual(calculatePlates(targetKg), expected, `${targetKg} kg`);
  }
});

test('estimates 1RM with the Brzycki formula', () => {
  const CASES: [weightKg: number, reps: number, expected: number][] = [
    [100, 0, 0],
    [100, 1, 100],
    [100, 6, 116.1],
    [60, 10, 80]
  ];
  for (const [weightKg, reps, expected] of CASES) {
    assert.equal(estimate1RM(weightKg, reps), expected, `${weightKg} kg x ${reps}`);
  }
});

function lift(equipment: EquipmentType): ExerciseDefinition {
  return { ...flatBench(), id: 'test-lift', name: 'TEST LIFT', equipment, targetRepsMin: 6, targetRepsMax: 8 };
}

function liftSession(date: string, weightKg: number, reps: number[], completed = true): WorkoutSession {
  return {
    ...benchSession(date, weightKg, reps),
    id: `lift-${date}`,
    exercises: [
      {
        exerciseId: 'test-lift',
        exerciseName: 'TEST LIFT',
        sets: reps.map((repsCompleted, i) => ({ setNumber: i + 1, weightKg, repsCompleted, targetReps: '6–8', completed }))
      }
    ]
  };
}

test('a skipped exercise keeps the last real weight', () => {
  const history = [benchSession('2026-09-01', 62.5, [7, 6, 6]), { ...benchSession('2026-09-05', 60, [6, 6, 6]), exercises: [] }];
  const skipped = benchSession('2026-09-08', 60, [6, 6, 6]);
  skipped.exercises[0]!.sets = skipped.exercises[0]!.sets.map(s => ({ ...s, completed: false }));
  const rec = getRecommendation(flatBench(), [...history, skipped]);
  assert.equal(rec.currentWeightKg, 62.5);
  assert.equal(rec.lastRepsSummary, '7 / 6 / 6');
});

test('a skipped exercise does not count toward a deload', () => {
  const history = [liftSession('2026-09-01', 80, [4, 4, 3]), liftSession('2026-09-05', 80, [4, 4, 3], false)];
  const rec = getRecommendation(lift('barbell'), history);
  assert.notEqual(rec.status, 'deload');
  assert.equal(rec.currentWeightKg, 80);
});

test('deloads by about 10 % in loadable steps, never below the lowest load', () => {
  const CASES: [equipment: EquipmentType, weightKg: number, status: OverloadStatus, recommendedKg: number][] = [
    ['barbell', 80, 'deload', 72.5],
    ['barbell', 20, 'progress_reps', 20],
    ['dumbbell', 10, 'deload', 8],
    ['dumbbell', 2, 'progress_reps', 2],
    ['machine', 60, 'deload', 55],
    ['bodyweight', 10, 'deload', 7.5],
    ['bodyweight', 0, 'progress_reps', 0]
  ];
  for (const [equipment, weightKg, status, recommendedKg] of CASES) {
    const history = [liftSession('2026-09-01', weightKg, [4, 4, 3]), liftSession('2026-09-03', weightKg, [4, 3, 3])];
    const rec = getRecommendation(lift(equipment), history);
    assert.deepEqual([rec.status, rec.recommendedWeightKg], [status, recommendedKg], `${equipment} ${weightKg} kg`);
  }
});

test('adds one loading step when every set reaches the top of the range', () => {
  const CASES: [equipment: EquipmentType, weightKg: number, recommendedKg: number][] = [
    ['barbell', 60, 62.5],
    ['dumbbell', 10, 12],
    ['machine', 60, 62.5],
    ['bodyweight', 0, 2.5]
  ];
  for (const [equipment, weightKg, recommendedKg] of CASES) {
    const rec = getRecommendation(lift(equipment), [liftSession('2026-09-01', weightKg, [8, 8, 8])]);
    assert.deepEqual([rec.status, rec.recommendedWeightKg], ['increase_load', recommendedKg], `${equipment} ${weightKg} kg`);
  }
});
