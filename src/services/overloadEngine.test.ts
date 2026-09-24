import { OverloadEngine } from './overloadEngine';
import { ExerciseDefinition, WorkoutSession } from '../types/workout';

// Simple lightweight assertion runner for the overload engine
export function runTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(msg);
      console.error('Test Failed:', msg);
    }
  };

  const sampleExercise: ExerciseDefinition = {
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

  // Test 1: Hit ceiling on all sets -> increase load by 2.5kg
  const maxHitSession: WorkoutSession = {
    id: 's1',
    name: 'Push',
    splitType: 'Push',
    date: '2026-09-01',
    startTime: '',
    durationMinutes: 60,
    completed: true,
    totalVolumeKg: 1440,
    exercises: [
      {
        exerciseId: 'flat-bench',
        exerciseName: 'FLAT BENCH',
        sets: [
          { setNumber: 1, weightKg: 60, repsCompleted: 8, targetReps: '6-8', completed: true },
          { setNumber: 2, weightKg: 60, repsCompleted: 8, targetReps: '6-8', completed: true },
          { setNumber: 3, weightKg: 60, repsCompleted: 8, targetReps: '6-8', completed: true }
        ]
      }
    ]
  };

  const rec1 = OverloadEngine.getRecommendation(sampleExercise, [maxHitSession]);
  assert(rec1.status === 'increase_load', `Expected status increase_load, got ${rec1.status}`);
  assert(rec1.recommendedWeightKg === 62.5, `Expected recommended weight 62.5, got ${rec1.recommendedWeightKg}`);

  // Test 2: First set hit max, but later sets dropped -> maintain load, progress reps
  const fatigueSession: WorkoutSession = {
    id: 's2',
    name: 'Push',
    splitType: 'Push',
    date: '2026-09-02',
    startTime: '',
    durationMinutes: 60,
    completed: true,
    totalVolumeKg: 1140,
    exercises: [
      {
        exerciseId: 'flat-bench',
        exerciseName: 'FLAT BENCH',
        sets: [
          { setNumber: 1, weightKg: 60, repsCompleted: 8, targetReps: '6-8', completed: true },
          { setNumber: 2, weightKg: 60, repsCompleted: 6, targetReps: '6-8', completed: true },
          { setNumber: 3, weightKg: 60, repsCompleted: 5, targetReps: '6-8', completed: true }
        ]
      }
    ]
  };

  const rec2 = OverloadEngine.getRecommendation(sampleExercise, [fatigueSession]);
  assert(rec2.status === 'progress_reps', `Expected status progress_reps, got ${rec2.status}`);
  assert(rec2.recommendedWeightKg === 60, `Expected maintain weight 60, got ${rec2.recommendedWeightKg}`);

  // Test 3: Plate calculation for 62.5kg
  const plates = OverloadEngine.calculatePlates(62.5, 20);
  // (62.5 - 20) / 2 = 21.25 per side -> 20kg (1), 1.25kg (1)
  assert(plates[20] === 1, `Expected 1x20kg plate per side, got ${plates[20]}`);
  assert(plates[1.25] === 1, `Expected 1x1.25kg plate per side, got ${plates[1.25]}`);

  // Test 4: 1RM Brzycki estimation for 100kg x 6 reps
  const est1RM = OverloadEngine.estimate1RM(100, 6);
  // 100 * (36 / 31) = ~116.1
  assert(est1RM >= 115 && est1RM <= 117, `Expected 1RM ~116kg, got ${est1RM}`);

  return { passed, failed, errors };
}
