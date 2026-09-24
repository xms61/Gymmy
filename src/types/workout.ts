export const SPLIT_TYPES = ['Push', 'Pull', 'Legs', 'Other'] as const;
export type SplitType = (typeof SPLIT_TYPES)[number];

// landmine: one end of a barbell rests on the floor and only the other end carries plates.
export const EQUIPMENT_TYPES = ['barbell', 'dumbbell', 'cable', 'bodyweight', 'machine', 'landmine'] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export interface ExerciseDefinition {
  id: string;
  name: string;
  workoutType: SplitType;
  targetRepsMin: number;
  targetRepsMax: number;
  targetSets: number;
  defaultWeightKg: number;
  defaultRestSeconds: number;
  equipment: EquipmentType;
  notes?: string;
  warmupRequired?: boolean;
}

export interface SetLog {
  setNumber: number;
  weightKg: number;
  repsCompleted: number;
  targetReps: string;
  completed: boolean;
  rpe?: number;
}

export interface ExerciseSessionLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  notes?: string;
  equipment?: EquipmentType;
}

export interface WorkoutSession {
  id: string;
  name: string;
  splitType: SplitType;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO string
  endTime?: string;
  durationMinutes: number;
  exercises: ExerciseSessionLog[];
  totalVolumeKg: number;
  completed: boolean;
  notes?: string;
}

// The one file format for exporting and importing data. Bump version when the shape changes,
// and keep parseBackup able to read every older version.
export interface GymmyBackup {
  format: 'gymmy-backup';
  version: 1;
  exportedAt: string; // ISO string
  sessions: WorkoutSession[];
  exercises: ExerciseDefinition[];
}

// A workout in progress, kept in the browser so a reload can resume it.
export interface WorkoutDraft {
  version: 1;
  workoutType: SplitType;
  startTime: string; // ISO string
  sessionNotes: string;
  exerciseLogs: ExerciseSessionLog[];
}

// deload: reps are falling (fatigue), so ease off for a week.
// reduce_load: reps are stuck below the range, so the working weight is too heavy for it.
export type OverloadStatus = 'increase_load' | 'progress_reps' | 'maintain' | 'deload' | 'reduce_load';

export interface ProgressRecommendation {
  exerciseId: string;
  exerciseName: string;
  status: OverloadStatus;
  currentWeightKg: number;
  recommendedWeightKg: number;
  recommendedRepRange: string;
  reason: string;
  lastRepsSummary: string;
  nextStepGoal: string;
}

