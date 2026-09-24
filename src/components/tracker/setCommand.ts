// The tracker's command line: parsing what was typed, and finding the set a command acts on.
// Pure, so every command is tested without a browser.
import type { ExerciseSessionLog } from '../../types/workout.ts';
import { RIR_CHOICES } from '../../services/effort.ts';
import { clampTo, LIMITS } from '../../validation.ts';

export type SetCommand =
  | { kind: 'log'; weightKg?: number; reps?: number; rir?: number; markDone: boolean }
  | { kind: 'step'; direction: 1 | -1 }
  | { kind: 'done' }
  | { kind: 'undo' }
  | { kind: 'focus'; direction: 1 | -1 }
  | { kind: 'rest'; seconds: number }
  | { kind: 'skipRest' }
  | { kind: 'plates' }
  | { kind: 'note'; text: string }
  | { kind: 'finish' }
  | { kind: 'leave' }
  | { kind: 'help' };

export type ParseResult = { ok: true; command: SetCommand } | { ok: false; message: string };

export const COMMAND_HELP: [command: string, does: string][] = [
  ['62.5x8, 62.5x8@2', 'log load × reps (@ RIR) on the next open set and mark it done'],
  ['x9, 65x', 'change only the reps, or only the load, of the next open set'],
  ['+, -', 'next heavier or lighter load for the next open set'],
  ['d, u', 'mark the next open set done, undo the last done set'],
  ['n, p', 'next or previous exercise'],
  ['rest 120, skip', 'start a rest of 120 s, skip the rest'],
  ['plates', 'show the plates for this exercise'],
  ['note <text>', "set this exercise's note"],
  ['fin, q', 'finish or leave the workout'],
  ['?', 'list the commands']
];

const WORDS: Record<string, SetCommand> = {
  '+': { kind: 'step', direction: 1 },
  '-': { kind: 'step', direction: -1 },
  d: { kind: 'done' },
  u: { kind: 'undo' },
  n: { kind: 'focus', direction: 1 },
  p: { kind: 'focus', direction: -1 },
  skip: { kind: 'skipRest' },
  plates: { kind: 'plates' },
  fin: { kind: 'finish' },
  q: { kind: 'leave' },
  '?': { kind: 'help' },
  help: { kind: 'help' }
};

// "62.5x8", "62.5x8@2", "x9", "65x". The x may also be ×, *, or a capital X.
const SET_PATTERN = /^(\d+(?:[.,]\d+)?)?\s*[x×*]\s*(\d+)?(?:\s*@\s*(\d+))?$/i;

export function parseSetCommand(input: string): ParseResult {
  const text = input.trim();
  const lower = text.toLowerCase();
  const word = WORDS[lower];
  if (word) return { ok: true, command: word };
  if (lower.startsWith('note ')) return { ok: true, command: { kind: 'note', text: text.slice(5).trim() } };
  if (lower.startsWith('rest')) return parseRest(lower.slice(4).trim());
  const match = SET_PATTERN.exec(text);
  if (match) return parseSet(match);
  return { ok: false, message: `unknown command: ${text || '(empty)'}. Type ? for the list.` };
}

function parseRest(argument: string): ParseResult {
  const seconds = Number(argument);
  if (!Number.isInteger(seconds) || seconds <= 0) return { ok: false, message: 'rest needs seconds, e.g. rest 120' };
  return { ok: true, command: { kind: 'rest', seconds: clampTo(LIMITS.restSeconds, seconds) } };
}

function parseSet([, load, reps, rir]: RegExpExecArray): ParseResult {
  if (load === undefined && reps === undefined) return { ok: false, message: 'give a load, reps or both, e.g. 62.5x8' };
  const rirValue = rir === undefined ? undefined : Number(rir);
  if (rirValue !== undefined && !RIR_CHOICES.some(choice => choice === rirValue)) {
    return { ok: false, message: `RIR goes from 0 to ${RIR_CHOICES[RIR_CHOICES.length - 1]}` };
  }
  const command: SetCommand = {
    kind: 'log',
    markDone: load !== undefined && reps !== undefined,
    ...(load !== undefined && { weightKg: clampTo(LIMITS.weightKg, Number(load.replace(',', '.'))) }),
    ...(reps !== undefined && { reps: clampTo(LIMITS.reps, Number(reps)) }),
    ...(rirValue !== undefined && { rir: rirValue })
  };
  return { ok: true, command };
}

export interface SetPosition {
  exerciseIndex: number;
  setIndex: number;
}

// The first set not yet done, starting at the given exercise and moving on to later ones.
export function nextOpenSet(logs: ExerciseSessionLog[], fromExercise: number): SetPosition | null {
  for (let exerciseIndex = Math.max(0, fromExercise); exerciseIndex < logs.length; exerciseIndex++) {
    const setIndex = logs[exerciseIndex]!.sets.findIndex(s => !s.completed);
    if (setIndex >= 0) return { exerciseIndex, setIndex };
  }
  return null;
}

// The last set marked done, at or before the given exercise.
export function lastDoneSet(logs: ExerciseSessionLog[], fromExercise: number): SetPosition | null {
  for (let exerciseIndex = Math.min(fromExercise, logs.length - 1); exerciseIndex >= 0; exerciseIndex--) {
    const sets = logs[exerciseIndex]!.sets;
    for (let setIndex = sets.length - 1; setIndex >= 0; setIndex--) {
      if (sets[setIndex]!.completed) return { exerciseIndex, setIndex };
    }
  }
  return null;
}

// Moves a set cursor by one set, across exercise boundaries, and stops at the ends.
export function moveCursor(logs: ExerciseSessionLog[], cursor: SetPosition, direction: 1 | -1): SetPosition {
  const flat = logs.flatMap((log, exerciseIndex) => log.sets.map((_, setIndex) => ({ exerciseIndex, setIndex })));
  const here = flat.findIndex(p => p.exerciseIndex === cursor.exerciseIndex && p.setIndex === cursor.setIndex);
  return flat[Math.min(flat.length - 1, Math.max(0, here + direction))] ?? cursor;
}
