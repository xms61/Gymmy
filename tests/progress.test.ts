import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exerciseHistory } from '../src/services/progress.ts';
import { EXERCISE_DEFINITIONS } from '../src/data/seedData.ts';
import type { ExerciseDefinition, SetLog, WorkoutSession } from '../src/types/workout.ts';

function squats(): ExerciseDefinition {
  const definition = EXERCISE_DEFINITIONS.find(e => e.id === 'squats');
  assert.ok(definition);
  return definition;
}

function set(weightKg: number, repsCompleted: number, completed = true): SetLog {
  return { setNumber: 1, weightKg, repsCompleted, targetReps: '5–8', completed };
}

function legsSession(date: string, sets: SetLog[], exerciseName = 'SQUATS'): WorkoutSession {
  return {
    id: `legs-${date}`,
    name: 'Legs',
    splitType: 'Legs',
    date,
    startTime: `${date}T09:00:00.000Z`,
    durationMinutes: 50,
    totalVolumeKg: 0,
    completed: true,
    exercises: [{ exerciseId: exerciseName === 'SQUATS' ? 'squats' : 'other', exerciseName, sets }]
  };
}

test('lists sessions oldest first', () => {
  const sessions = [legsSession('2026-09-15', [set(72.5, 6)]), legsSession('2026-09-01', [set(70, 8)])];
  assert.deepEqual(exerciseHistory(squats(), sessions).map(h => h.date), ['2026-09-01', '2026-09-15']);
});

test('leaves out sessions where the exercise has no completed sets', () => {
  const sessions = [
    legsSession('2026-09-01', [set(70, 8)]),
    legsSession('2026-09-04', [set(70, 8, false), set(70, 8, false)]),
    legsSession('2026-09-08', [set(70, 0)])
  ];
  assert.deepEqual(exerciseHistory(squats(), sessions).map(h => h.date), ['2026-09-01']);
});

test('reports the heaviest weight and the reps of every completed set', () => {
  const [entry] = exerciseHistory(squats(), [legsSession('2026-09-01', [set(70, 8), set(75, 6), set(80, 3, false)])]);
  assert.equal(entry?.weight, 75);
  assert.equal(entry?.repsString, '8 / 6');
});

test('matches a logged exercise by name when its id differs', () => {
  const history = exerciseHistory(squats(), [legsSession('2026-09-01', [set(70, 8)], 'Squats')]);
  assert.equal(history.length, 1);
});

test('estimates 1RM from the best single set, not the heaviest weight with the most reps', () => {
  const [entry] = exerciseHistory(squats(), [legsSession('2026-09-01', [set(60, 6), set(50, 12)])]);
  // 60 kg x 6 estimates 69.7 kg and 50 kg x 12 estimates 72 kg; mixing them (60 kg x 12) gave 86.4 kg.
  assert.equal(entry?.estimated1RM, 72);
});
