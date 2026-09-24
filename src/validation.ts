// Checks data that comes from outside the app's own code (API request bodies, backup files and
// stored drafts) and turns it into typed values. Shared by the server and the browser so both
// accept exactly the same shapes.
import { EQUIPMENT_TYPES, SPLIT_TYPES } from './types/workout.ts';
import type {
  ExerciseDefinition,
  ExerciseSessionLog,
  GymmyBackup,
  SetLog,
  WorkoutDraft,
  WorkoutSession
} from './types/workout.ts';

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export interface NumberRule {
  min: number;
  max?: number;
  whole?: boolean;
}

// Generous limits for one lifter. They stop a corrupt backup or a bad request from making the
// tracker draw millions of set rows, and the tracker and Settings inputs clamp to the same
// bounds, so the app itself never produces a value the server refuses.
export const LIMITS = {
  targetSets: { min: 1, max: 20, whole: true },
  repRange: { min: 1, max: 100, whole: true },
  setNumber: { min: 1, max: 50, whole: true },
  reps: { min: 0, max: 1000, whole: true },
  weightKg: { min: 0, max: 1000 },
  rpe: { min: 0, max: 10 },
  restSeconds: { min: 0, max: 3600, whole: true },
  // A draft resumed days later records a long workout, so durations and volume have no upper bound.
  durationMinutes: { min: 0, whole: true },
  volumeKg: { min: 0 }
} as const satisfies Record<string, NumberRule>;

export const MAX_NOTES_LENGTH = 10_000;
const MAX_LABEL_LENGTH = 200;
const MAX_EXERCISES_PER_SESSION = 50;
const MAX_EXERCISE_DEFINITIONS = 200;

export function clampTo(rule: NumberRule, value: number): number {
  if (Number.isNaN(value)) return rule.min;
  return Math.min(rule.max ?? Infinity, Math.max(rule.min, value));
}

export function parseWorkoutSession(value: unknown): ParseResult<WorkoutSession> {
  return attempt(() => readWorkoutSession(value, 'session'));
}

export function parseExerciseDefinitions(value: unknown): ParseResult<ExerciseDefinition[]> {
  return attempt(() => {
    return readItems(value, 'exercises', readExerciseDefinition, MAX_EXERCISE_DEFINITIONS);
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
      sessionNotes: readText(fields, 'sessionNotes', 'draft', MAX_NOTES_LENGTH),
      exerciseLogs: readList(fields, 'exerciseLogs', 'draft', readExerciseLog, MAX_EXERCISES_PER_SESSION)
    };
  });
}

// Reads every backup format Gymmy has written: version 1, and the unversioned JSON export of
// 1.0.0 (appVersion '1.0.0', exportDate). A newer version is refused, because its fields are
// unknown here.
export function parseBackup(value: unknown): ParseResult<GymmyBackup> {
  return attempt(() => {
    const fields = readRecord(value, 'backup');
    if (fields.format === undefined && fields.appVersion === '1.0.0') return readBackupContent(fields, 'exportDate');
    if (fields.format !== 'gymmy-backup') fail('backup', 'is not a Gymmy backup file');
    if (typeof fields.version === 'number' && fields.version > 1) {
      fail('backup.version', `is ${fields.version}, which is newer than this app can read (1)`);
    }
    if (fields.version !== 1) fail('backup.version', 'must be 1');
    return readBackupContent(fields, 'exportedAt');
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
  const endTime = fields.endTime === undefined ? undefined : readTimestamp(fields, 'endTime', path);
  const notes = readOptionalText(fields, 'notes', path, MAX_NOTES_LENGTH);
  return {
    id: readNonEmptyText(fields, 'id', path),
    name: readText(fields, 'name', path),
    splitType: readOneOf(fields, 'splitType', path, SPLIT_TYPES),
    date: readCalendarDate(fields, 'date', path),
    startTime: readTimestamp(fields, 'startTime', path),
    ...(endTime !== undefined && { endTime }),
    durationMinutes: readNumber(fields, 'durationMinutes', path, LIMITS.durationMinutes),
    exercises: readList(fields, 'exercises', path, readExerciseLog, MAX_EXERCISES_PER_SESSION),
    totalVolumeKg: readNumber(fields, 'totalVolumeKg', path, LIMITS.volumeKg),
    completed: readBoolean(fields, 'completed', path),
    ...(notes !== undefined && { notes })
  };
}

function readBackupContent(fields: Fields, exportedAtKey: string): GymmyBackup {
  return {
    format: 'gymmy-backup',
    version: 1,
    exportedAt: readTimestamp(fields, exportedAtKey, 'backup'),
    sessions: readList(fields, 'sessions', 'backup', readWorkoutSession),
    exercises: readList(fields, 'exercises', 'backup', readExerciseDefinition, MAX_EXERCISE_DEFINITIONS)
  };
}

function readExerciseLog(value: unknown, path: string): ExerciseSessionLog {
  const fields = readRecord(value, path);
  const notes = readOptionalText(fields, 'notes', path, MAX_NOTES_LENGTH);
  const equipment = fields.equipment === undefined ? undefined : readOneOf(fields, 'equipment', path, EQUIPMENT_TYPES);
  return {
    exerciseId: readNonEmptyText(fields, 'exerciseId', path),
    exerciseName: readText(fields, 'exerciseName', path),
    sets: readList(fields, 'sets', path, readSetLog, LIMITS.setNumber.max),
    ...(notes !== undefined && { notes }),
    ...(equipment !== undefined && { equipment })
  };
}

function readSetLog(value: unknown, path: string): SetLog {
  const fields = readRecord(value, path);
  const rpe = fields.rpe === undefined ? undefined : readNumber(fields, 'rpe', path, LIMITS.rpe);
  return {
    setNumber: readNumber(fields, 'setNumber', path, LIMITS.setNumber),
    weightKg: readNumber(fields, 'weightKg', path, LIMITS.weightKg),
    repsCompleted: readNumber(fields, 'repsCompleted', path, LIMITS.reps),
    targetReps: readText(fields, 'targetReps', path),
    completed: readBoolean(fields, 'completed', path),
    ...(rpe !== undefined && { rpe })
  };
}

function readExerciseDefinition(value: unknown, path: string): ExerciseDefinition {
  const fields = readRecord(value, path);
  const notes = readOptionalText(fields, 'notes', path, MAX_NOTES_LENGTH);
  const warmupRequired = fields.warmupRequired === undefined ? undefined : readBoolean(fields, 'warmupRequired', path);
  const definition: ExerciseDefinition = {
    id: readNonEmptyText(fields, 'id', path),
    name: readNonEmptyText(fields, 'name', path),
    workoutType: readOneOf(fields, 'workoutType', path, SPLIT_TYPES),
    targetRepsMin: readNumber(fields, 'targetRepsMin', path, LIMITS.repRange),
    targetRepsMax: readNumber(fields, 'targetRepsMax', path, LIMITS.repRange),
    targetSets: readNumber(fields, 'targetSets', path, LIMITS.targetSets),
    defaultWeightKg: readNumber(fields, 'defaultWeightKg', path, LIMITS.weightKg),
    defaultRestSeconds: readNumber(fields, 'defaultRestSeconds', path, LIMITS.restSeconds),
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

function readText(fields: Fields, key: string, path: string, maxLength = MAX_LABEL_LENGTH): string {
  const value = fields[key];
  if (typeof value !== 'string') fail(`${path}.${key}`, 'must be a string');
  if (value.length > maxLength) fail(`${path}.${key}`, `must be at most ${maxLength} characters`);
  return value;
}

function readNonEmptyText(fields: Fields, key: string, path: string): string {
  const value = readText(fields, key, path);
  if (value.trim() === '') fail(`${path}.${key}`, 'must not be empty');
  return value;
}

function readOptionalText(fields: Fields, key: string, path: string, maxLength?: number): string | undefined {
  return fields[key] === undefined ? undefined : readText(fields, key, path, maxLength);
}

function readCalendarDate(fields: Fields, key: string, path: string): string {
  const value = readText(fields, key, path);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(`${path}.${key}`, 'must be a date in YYYY-MM-DD form');
  if (!isCalendarDate(value)) fail(`${path}.${key}`, 'must be a real calendar date');
  return value;
}

// Date.UTC rolls 2026-02-30 over to 2 March, so a date is real when it survives the round trip.
function isCalendarDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function readTimestamp(fields: Fields, key: string, path: string): string {
  const value = readText(fields, key, path);
  if (Number.isNaN(Date.parse(value))) fail(`${path}.${key}`, 'must be a date and time');
  return value;
}

function readNumber(fields: Fields, key: string, path: string, rule: NumberRule): number {
  const value = fields[key];
  const max = rule.max ?? Infinity;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < rule.min || value > max || (rule.whole && !Number.isInteger(value))) {
    const range = rule.max === undefined ? `>= ${rule.min}` : `from ${rule.min} to ${rule.max}`;
    fail(`${path}.${key}`, `must be a ${rule.whole ? 'whole number' : 'number'} ${range}`);
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

function readList<T>(
  fields: Fields,
  key: string,
  path: string,
  readItem: (value: unknown, path: string) => T,
  maxItems = Infinity
): T[] {
  return readItems(fields[key], `${path}.${key}`, readItem, maxItems);
}

function readItems<T>(value: unknown, path: string, readItem: (value: unknown, path: string) => T, maxItems: number): T[] {
  if (!Array.isArray(value)) fail(path, 'must be an array');
  if (value.length > maxItems) fail(path, `must have at most ${maxItems} items`);
  return value.map((item, i) => readItem(item, `${path}[${i}]`));
}
