export const SPLIT_TYPES = ['Push', 'Pull', 'Legs', 'Other'] as const;
export type SplitType = (typeof SPLIT_TYPES)[number];

export const EQUIPMENT_TYPES = ['barbell', 'dumbbell', 'cable', 'bodyweight', 'machine'] as const;
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

export type OverloadStatus = 'increase_load' | 'progress_reps' | 'maintain' | 'deload';

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

export interface CalendarDayStats {
  date: string; // YYYY-MM-DD
  sessions: WorkoutSession[];
  totalVolume: number;
}
