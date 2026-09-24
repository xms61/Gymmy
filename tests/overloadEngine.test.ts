import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimate1RM, getRecommendation as recommendFromLogs } from '../src/services/overloadEngine.ts';
import { indexCompletedLogs, logsFor } from '../src/services/exerciseLogs.ts';
import type { EquipmentType, ExerciseDefinition, OverloadStatus, WorkoutSession } from '../src/types/workout.ts';

function getRecommendation(exercise: ExerciseDefinition, sessions: WorkoutSession[]) {
  return recommendFromLogs(exercise, logsFor(indexCompletedLogs(sessions, [exercise]), exercise));
}

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

test('deloads about 10 % when reps drop two sessions in a row, even inside the range', () => {
  const history = [
    benchSession('2026-09-01', 80, [8, 7, 7]),
    benchSession('2026-09-03', 80, [7, 7, 6]),
    benchSession('2026-09-05', 80, [7, 6, 6])
  ];
  const rec = getRecommendation(flatBench(), history);
  assert.equal(rec.status, 'deload');
  assert.equal(rec.recommendedWeightKg, 72.5);
});

test('does not deload after two sessions below the minimum without a downward trend', () => {
  const history = [benchSession('2026-09-01', 80, [4, 4, 3]), benchSession('2026-09-03', 80, [4, 3, 3])];
  const rec = getRecommendation(flatBench(), history);
  assert.equal(rec.status, 'progress_reps');
  assert.equal(rec.recommendedWeightKg, 80);
});

test('a single drop is not a trend', () => {
  const history = [
    benchSession('2026-09-01', 70, [6, 6, 6]),
    benchSession('2026-09-03', 70, [7, 7, 7]),
    benchSession('2026-09-05', 70, [6, 6, 6])
  ];
  assert.equal(getRecommendation(flatBench(), history).status, 'progress_reps');
});

test('holds the load while reps rise toward the range', () => {
  const history = [
    benchSession('2026-09-01', 70, [4, 4, 4]),
    benchSession('2026-09-03', 70, [5, 4, 4]),
    benchSession('2026-09-05', 70, [5, 5, 4])
  ];
  const rec = getRecommendation(flatBench(), history);
  assert.deepEqual([rec.status, rec.recommendedWeightKg], ['progress_reps', 70]);
  assert.match(rec.reason, /below the 6–8 range/);
});

test('compares only sessions at the current weight', () => {
  const history = [
    benchSession('2026-09-01', 60, [8, 8, 7]),
    benchSession('2026-09-03', 62.5, [7, 6, 6]),
    benchSession('2026-09-05', 62.5, [6, 6, 5])
  ];
  assert.equal(getRecommendation(flatBench(), history).status, 'progress_reps');
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
    ['barbell', 20, 'deload', 17.5],
    ['barbell', 10, 'progress_reps', 10],
    ['dumbbell', 10, 'deload', 7.5],
    ['dumbbell', 2.5, 'progress_reps', 2.5],
    ['landmine', 20, 'deload', 17.5],
    ['machine', 60, 'deload', 55],
    ['bodyweight', 10, 'deload', 7.5],
    ['bodyweight', 0, 'progress_reps', 0]
  ];
  for (const [equipment, weightKg, status, recommendedKg] of CASES) {
    const history = [
      liftSession('2026-09-01', weightKg, [6, 6, 6]),
      liftSession('2026-09-03', weightKg, [5, 5, 5]),
      liftSession('2026-09-05', weightKg, [5, 4, 4])
    ];
    const rec = getRecommendation(lift(equipment), history);
    assert.deepEqual([rec.status, rec.recommendedWeightKg], [status, recommendedKg], `${equipment} ${weightKg} kg`);
  }
});

test('suggests one loading step lighter after three flat sessions below the range', () => {
  const CASES: [equipment: EquipmentType, weightKg: number, status: OverloadStatus, recommendedKg: number][] = [
    ['dumbbell', 5, 'reduce_load', 2.5],
    ['dumbbell', 10, 'reduce_load', 7.5],
    ['barbell', 30, 'reduce_load', 27.5],
    ['barbell', 10, 'progress_reps', 10],
    ['landmine', 20, 'reduce_load', 18.75],
    ['bodyweight', 0, 'progress_reps', 0]
  ];
  for (const [equipment, weightKg, status, recommendedKg] of CASES) {
    const history = [
      liftSession('2026-09-01', weightKg, [5, 4, 3]),
      liftSession('2026-09-03', weightKg, [5, 4, 3]),
      liftSession('2026-09-05', weightKg, [4, 4, 4])
    ];
    const rec = getRecommendation(lift(equipment), history);
    assert.deepEqual([rec.status, rec.recommendedWeightKg], [status, recommendedKg], `${equipment} ${weightKg} kg`);
  }
});

test('adds one loading step when every set reaches the top of the range', () => {
  const CASES: [equipment: EquipmentType, weightKg: number, recommendedKg: number][] = [
    ['barbell', 60, 62.5],
    ['dumbbell', 20, 22.5],
    ['landmine', 20, 21.25],
    ['machine', 60, 62.5],
    ['bodyweight', 0, 2.5]
  ];
  for (const [equipment, weightKg, recommendedKg] of CASES) {
    const rec = getRecommendation(lift(equipment), [liftSession('2026-09-01', weightKg, [8, 8, 8])]);
    assert.deepEqual([rec.status, rec.recommendedWeightKg], ['increase_load', recommendedKg], `${equipment} ${weightKg} kg`);
  }
});

test('holds at the heaviest load the equipment makes', () => {
  const CASES: [equipment: EquipmentType, weightKg: number][] = [
    ['barbell', 142.5],
    ['dumbbell', 25]
  ];
  for (const [equipment, weightKg] of CASES) {
    const rec = getRecommendation(lift(equipment), [liftSession('2026-09-01', weightKg, [8, 8, 8])]);
    assert.deepEqual([rec.status, rec.recommendedWeightKg], ['progress_reps', weightKg], `${equipment} ${weightKg} kg`);
  }
});

test('says how much weight to add', () => {
  const rec = getRecommendation(lift('landmine'), [liftSession('2026-09-01', 20, [8, 8, 8])]);
  assert.equal(rec.reason, 'Every set reached the top of the range (8 reps). Add 1.25 kg.');
});

function dumbbellLift(targetRepsMin: number, targetRepsMax: number): ExerciseDefinition {
  return { ...lift('dumbbell'), targetRepsMin, targetRepsMax };
}

test('earns a big dumbbell jump with extra reps first', () => {
  const CASES: [label: string, min: number, max: number, weightKg: number, reps: number, status: OverloadStatus, recommendedKg: number][] = [
    ['Lateral Raise at the top of 10-15', 10, 15, 5, 15, 'progress_reps', 5],
    ['Lateral Raise at 19 reps', 10, 15, 5, 19, 'increase_load', 7.5],
    ['Incline DB Press at the top of 8-12', 8, 12, 10, 12, 'progress_reps', 10],
    ['Incline DB Press at 14 reps', 8, 12, 10, 14, 'increase_load', 12.5],
    ['a jump under 15 %', 8, 12, 17.5, 12, 'increase_load', 20]
  ];
  for (const [label, min, max, weightKg, reps, status, recommendedKg] of CASES) {
    const rec = getRecommendation(dumbbellLift(min, max), [liftSession('2026-09-01', weightKg, [reps, reps, reps])]);
    assert.deepEqual([rec.status, rec.recommendedWeightKg], [status, recommendedKg], label);
  }
});

test('names the reps a big jump needs', () => {
  const rec = getRecommendation(dumbbellLift(10, 15), [liftSession('2026-09-01', 5, [15, 15, 15])]);
  assert.equal(rec.reason, 'Every set reached the top of the range, but the next load, 7.5 kg, is 50 % heavier.');
  assert.equal(rec.nextStepGoal, 'Build to 19 reps on every set at 5 kg, then move to 7.5 kg for 10 reps.');
});

test('never asks for more than 30 reps before a jump', () => {
  const rec = getRecommendation(dumbbellLift(25, 28), [liftSession('2026-09-01', 2.5, [28, 28, 28])]);
  assert.equal(rec.nextStepGoal, 'Build to 30 reps on every set at 2.5 kg, then move to 5 kg for 25 reps.');
});

function mixedBenchSession(date: string, sets: [weightKg: number, reps: number][]): WorkoutSession {
  const session = benchSession(date, 0, []);
  session.exercises[0]!.sets = sets.map(([weightKg, repsCompleted], i) => ({
    setNumber: i + 1,
    weightKg,
    repsCompleted,
    targetReps: '6-8',
    completed: true
  }));
  return session;
}

test('judges a ramped session by its working sets, not its first set', () => {
  const rec = getRecommendation(flatBench(), [mixedBenchSession('2026-09-01', [[60, 8], [70, 8], [70, 8], [70, 8]])]);
  assert.deepEqual([rec.status, rec.currentWeightKg, rec.recommendedWeightKg], ['increase_load', 70, 72.5]);
  assert.equal(rec.lastRepsSummary, '8 / 8 / 8');
});

test('a lighter back-off set does not drag the trend down', () => {
  const history = [
    mixedBenchSession('2026-09-01', [[80, 7], [80, 7], [80, 7], [70, 3]]),
    mixedBenchSession('2026-09-03', [[80, 7], [80, 7], [80, 7], [70, 2]]),
    mixedBenchSession('2026-09-05', [[80, 7], [80, 7], [80, 7], [70, 1]])
  ];
  assert.equal(getRecommendation(flatBench(), history).status, 'progress_reps');
});
