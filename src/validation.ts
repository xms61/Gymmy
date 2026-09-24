// Checks data that comes from outside the app's own code (API request bodies, and later
// backup files and stored drafts) and turns it into typed values. Shared by the server and
// the browser so both accept exactly the same shapes.
import { EQUIPMENT_TYPES, SPLIT_TYPES } from './types/workout.ts';
import type { ExerciseDefinition, ExerciseSessionLog, SetLog, WorkoutDraft, WorkoutSession } from './types/workout.ts';

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseWorkoutSession(value: unknown): ParseResult<WorkoutSession> {
  return attempt(() => readWorkoutSession(value, 'session'));
}

export function parseExerciseDefinitions(value: unknown): ParseResult<ExerciseDefinition[]> {
  return attempt(() => {
    if (!Array.isArray(value)) fail('exercises', 'must be an array');
    return value.map((item, i) => readExerciseDefinition(item, `exercises[${i}]`));
  });
}

// Drafts from another version are refused rather than migrated: a draft only lives for one workout.
export function parseWorkoutDraft(value: unknown): ParseResult<WorkoutDraft> {
  return attempt(() => {
    const fields = readRecord(value, 'draft');
    if (fields.version !== 1) fail('draft.version', 'must be 1');
    return {
      version: 1,
      workoutType: readOneOf(fields, 'workoutType', 'draft', SPLIT_TYPES),
      startTime: readTimestamp(fields, 'startTime', 'draft'),
      sessionNotes: readText(fields, 'sessionNotes', 'draft'),
      exerciseLogs: readList(fields, 'exerciseLogs', 'draft', readExerciseLog)
    };
  });
}

export function hasValidRepRange(exercise: Pick<ExerciseDefinition, 'targetRepsMin' | 'targetRepsMax'>): boolean {
  return exercise.targetRepsMin <= exercise.targetRepsMax;
}

class InvalidInput extends Error {}

type Fields = Record<string, unknown>;

function attempt<T>(read: () => T): ParseResult<T> {
  try {
    return { ok: true, value: read() };
  } catch (err) {
    if (err instanceof InvalidInput) return { ok: false, error: err.message };
    throw err;
  }
}

function fail(path: string, rule: string): never {
  throw new InvalidInput(`${path} ${rule}`);
}

function readWorkoutSession(value: unknown, path: string): WorkoutSession {
  const fields = readRecord(value, path);
  const endTime = readOptionalText(fields, 'endTime', path);
  const notes = readOptionalText(fields, 'notes', path);
  return {
    id: readNonEmptyText(fields, 'id', path),
    name: readText(fields, 'name', path),
    splitType: readOneOf(fields, 'splitType', path, SPLIT_TYPES),
    date: readCalendarDate(fields, 'date', path),
    startTime: readText(fields, 'startTime', path),
    ...(endTime !== undefined && { endTime }),
    durationMinutes: readNumber(fields, 'durationMinutes', path, { min: 0, whole: true }),
    exercises: readList(fields, 'exercises', path, readExerciseLog),
    totalVolumeKg: readNumber(fields, 'totalVolumeKg', path, { min: 0 }),
    completed: readBoolean(fields, 'completed', path),
    ...(notes !== undefined && { notes })
  };
}

function readExerciseLog(value: unknown, path: string): ExerciseSessionLog {
  const fields = readRecord(value, path);
  const notes = readOptionalText(fields, 'notes', path);
  const equipment = fields.equipment === undefined ? undefined : readOneOf(fields, 'equipment', path, EQUIPMENT_TYPES);
  return {
    exerciseId: readNonEmptyText(fields, 'exerciseId', path),
    exerciseName: readText(fields, 'exerciseName', path),
    sets: readList(fields, 'sets', path, readSetLog),
    ...(notes !== undefined && { notes }),
    ...(equipment !== undefined && { equipment })
  };
}

function readSetLog(value: unknown, path: string): SetLog {
  const fields = readRecord(value, path);
  const rpe = fields.rpe === undefined ? undefined : readNumber(fields, 'rpe', path, { min: 0 });
  return {
    setNumber: readNumber(fields, 'setNumber', path, { min: 1, whole: true }),
    weightKg: readNumber(fields, 'weightKg', path, { min: 0 }),
    repsCompleted: readNumber(fields, 'repsCompleted', path, { min: 0, whole: true }),
    targetReps: readText(fields, 'targetReps', path),
    completed: readBoolean(fields, 'completed', path),
    ...(rpe !== undefined && { rpe })
  };
}

function readExerciseDefinition(value: unknown, path: string): ExerciseDefinition {
  const fields = readRecord(value, path);
  const notes = readOptionalText(fields, 'notes', path);
  const warmupRequired = fields.warmupRequired === undefined ? undefined : readBoolean(fields, 'warmupRequired', path);
  const definition: ExerciseDefinition = {
    id: readNonEmptyText(fields, 'id', path),
    name: readNonEmptyText(fields, 'name', path),
    workoutType: readOneOf(fields, 'workoutType', path, SPLIT_TYPES),
    targetRepsMin: readNumber(fields, 'targetRepsMin', path, { min: 1, whole: true }),
    targetRepsMax: readNumber(fields, 'targetRepsMax', path, { min: 1, whole: true }),
    targetSets: readNumber(fields, 'targetSets', path, { min: 1, whole: true }),
    defaultWeightKg: readNumber(fields, 'defaultWeightKg', path, { min: 0 }),
    defaultRestSeconds: readNumber(fields, 'defaultRestSeconds', path, { min: 0, whole: true }),
    equipment: readOneOf(fields, 'equipment', path, EQUIPMENT_TYPES),
    ...(notes !== undefined && { notes }),
    ...(warmupRequired !== undefined && { warmupRequired })
  };
  if (!hasValidRepRange(definition)) {
    fail(`${path}.targetRepsMin`, 'must not be greater than targetRepsMax');
  }
  return definition;
}

function readRecord(value: unknown, path: string): Fields {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(path, 'must be an object');
  // Safe: the check above rules out primitives, null and arrays.
  return value as Fields;
}

function readText(fields: Fields, key: string, path: string): string {
  const value = fields[key];
  if (typeof value !== 'string') fail(`${path}.${key}`, 'must be a string');
  return value;
}

function readNonEmptyText(fields: Fields, key: string, path: string): string {
  const value = readText(fields, key, path);
  if (value.trim() === '') fail(`${path}.${key}`, 'must not be empty');
  return value;
}

function readOptionalText(fields: Fields, key: string, path: string): string | undefined {
  return fields[key] === undefined ? undefined : readText(fields, key, path);
}

function readCalendarDate(fields: Fields, key: string, path: string): string {
  const value = readText(fields, key, path);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(`${path}.${key}`, 'must be a date in YYYY-MM-DD form');
  return value;
}

function readTimestamp(fields: Fields, key: string, path: string): string {
  const value = readText(fields, key, path);
  if (Number.isNaN(Date.parse(value))) fail(`${path}.${key}`, 'must be a date and time');
  return value;
}

function readNumber(fields: Fields, key: string, path: string, rule: { min: number; whole?: boolean }): number {
  const value = fields[key];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < rule.min || (rule.whole && !Number.isInteger(value))) {
    fail(`${path}.${key}`, `must be a ${rule.whole ? 'whole number' : 'number'} >= ${rule.min}`);
  }
  return value;
}

function readBoolean(fields: Fields, key: string, path: string): boolean {
  const value = fields[key];
  if (typeof value !== 'boolean') fail(`${path}.${key}`, 'must be true or false');
  return value;
}

function readOneOf<T extends string>(fields: Fields, key: string, path: string, allowed: readonly T[]): T {
  const value = fields[key];
  if (!allowed.some(option => option === value)) fail(`${path}.${key}`, `must be one of ${allowed.join(', ')}`);
  // Safe: value equals one of the allowed options.
  return value as T;
}

function readList<T>(fields: Fields, key: string, path: string, readItem: (value: unknown, path: string) => T): T[] {
  const value = fields[key];
  if (!Array.isArray(value)) fail(`${path}.${key}`, 'must be an array');
  return value.map((item, i) => readItem(item, `${path}.${key}[${i}]`));
}
