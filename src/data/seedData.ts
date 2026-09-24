import type { ExerciseDefinition } from '../types/workout.ts';

export const EXERCISE_DEFINITIONS: ExerciseDefinition[] = [
  // Push Workout Exercises
  {
    id: 'flat-bench',
    name: 'FLAT BENCH',
    workoutType: 'Push',
    targetRepsMin: 6,
    targetRepsMax: 8,
    targetSets: 4,
    defaultWeightKg: 60,
    defaultRestSeconds: 150, // 2.5 mins
    equipment: 'barbell',
    warmupRequired: true,
    notes: 'Primary heavy chest press. Pause slightly at chest, drive through feet.'
  },
  {
    id: 'overhead-press',
    name: 'OVERHEAD PRESS',
    workoutType: 'Push',
    targetRepsMin: 6,
    targetRepsMax: 8,
    targetSets: 3,
    defaultWeightKg: 25,
    defaultRestSeconds: 120, // 2 mins
    equipment: 'barbell',
    warmupRequired: true,
    notes: 'Full lockout overhead. Squeeze glutes and core to protect lower back.'
  },
  {
    id: 'incline-db-press',
    name: 'INCLINE DB PRESS',
    workoutType: 'Push',
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetSets: 3,
    defaultWeightKg: 10,
    defaultRestSeconds: 105,
    equipment: 'dumbbell',
    notes: 'Set bench to 30-degree incline. Emphasize upper chest stretch.'
  },
  {
    id: 'lateral-raise',
    name: 'LATERAL RAISE',
    workoutType: 'Push',
    targetRepsMin: 10,
    targetRepsMax: 15,
    targetSets: 3,
    defaultWeightKg: 5,
    defaultRestSeconds: 75,
    equipment: 'dumbbell',
    notes: 'Strict lateral abduction without shrugging traps. Lead with elbows.'
  },
  {
    id: 'skullcrusher',
    name: 'SKULLCRUSHER',
    workoutType: 'Push',
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetSets: 3,
    defaultWeightKg: 22.5,
    defaultRestSeconds: 90,
    equipment: 'barbell',
    notes: 'Lower bar just past crown of head for deep triceps long head stretch.'
  },

  // Pull Workout Exercises
  {
    id: 'deadlifts',
    name: 'Deadlifts',
    workoutType: 'Pull',
    targetRepsMin: 5,
    targetRepsMax: 6,
    targetSets: 4,
    defaultWeightKg: 100,
    defaultRestSeconds: 180, // 3 mins
    equipment: 'barbell',
    warmupRequired: true,
    notes: 'Follow with Pull Ups (5 min break)'
  },
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    workoutType: 'Pull',
    targetRepsMin: 6,
    targetRepsMax: 10,
    targetSets: 3,
    defaultWeightKg: 0,
    defaultRestSeconds: 120,
    equipment: 'bodyweight',
    notes: 'Full dead-hang at bottom, chest to bar at top. Log extra weight if weighted.'
  },
  {
    id: 'meadows-row',
    name: 'MEADOWS ROW',
    workoutType: 'Pull',
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetSets: 3,
    defaultWeightKg: 20,
    defaultRestSeconds: 90,
    equipment: 'barbell',
    notes: 'Staggered stance. Pull elbow back toward hip for maximum lat activation.'
  },
  {
    id: 'biceps-curl',
    name: 'BICEPS CURL',
    workoutType: 'Pull',
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetSets: 3,
    defaultWeightKg: 10,
    defaultRestSeconds: 90,
    equipment: 'dumbbell',
    notes: 'standing. No torso swinging, full supination at top.'
  },

  // Legs Workout Exercises
  {
    id: 'squats',
    name: 'SQUATS',
    workoutType: 'Legs',
    targetRepsMin: 5,
    targetRepsMax: 8,
    targetSets: 4,
    defaultWeightKg: 70,
    defaultRestSeconds: 180, // 3 mins
    equipment: 'barbell',
    warmupRequired: true,
    notes: 'Break parallel depth, push knees out in line with toes.'
  },
  {
    id: 'calf-raises',
    name: 'CALF RAISES',
    workoutType: 'Legs',
    targetRepsMin: 10,
    targetRepsMax: 15,
    targetSets: 3,
    defaultWeightKg: 60,
    defaultRestSeconds: 75,
    equipment: 'machine',
    notes: '2-second dead pause at deepest stretch, explosive contraction at peak.'
  },
  {
    id: 'rdl',
    name: 'RDL',
    workoutType: 'Legs',
    targetRepsMin: 8,
    targetRepsMax: 10,
    targetSets: 3,
    defaultWeightKg: 50,
    defaultRestSeconds: 120,
    equipment: 'barbell',
    notes: 'Hinge hips back, soft knee bend, feel hamstring tension under stretch.'
  }
];

