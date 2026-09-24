import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OverloadEngine } from '../src/services/overloadEngine.ts';
import type { ExerciseDefinition, WorkoutSession } from '../src/types/workout.ts';

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
  const rec = OverloadEngine.getRecommendation(flatBench(), []);
  assert.equal(rec.status, 'maintain');
  assert.equal(rec.recommendedWeightKg, 60);
});

test('adds 2.5 kg to a barbell lift when every set reaches the top of the range', () => {
  const rec = OverloadEngine.getRecommendation(flatBench(), [benchSession('2026-09-01', 60, [8, 8, 8])]);
  assert.equal(rec.status, 'increase_load');
  assert.equal(rec.recommendedWeightKg, 62.5);
});

test('keeps the load and asks for reps when later sets fall short', () => {
  const rec = OverloadEngine.getRecommendation(flatBench(), [benchSession('2026-09-02', 60, [8, 6, 5])]);
  assert.equal(rec.status, 'progress_reps');
  assert.equal(rec.recommendedWeightKg, 60);
});

test('uses the most recent session when history is out of order', () => {
  const history = [benchSession('2026-09-01', 60, [8, 8, 8]), benchSession('2026-09-05', 62.5, [7, 6, 6])];
  const rec = OverloadEngine.getRecommendation(flatBench(), history);
  assert.equal(rec.currentWeightKg, 62.5);
  assert.equal(rec.status, 'progress_reps');
});

test('suggests a 10 % deload after two sessions below the minimum reps', () => {
  const history = [benchSession('2026-09-01', 80, [4, 4, 3]), benchSession('2026-09-03', 80, [4, 3, 3])];
  const rec = OverloadEngine.getRecommendation(flatBench(), history);
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
    assert.deepEqual(OverloadEngine.calculatePlates(targetKg), expected, `${targetKg} kg`);
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
    assert.equal(OverloadEngine.estimate1RM(weightKg, reps), expected, `${weightKg} kg x ${reps}`);
  }
});
