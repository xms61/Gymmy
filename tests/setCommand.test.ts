import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lastDoneSet, moveCursor, nextOpenSet, parseSetCommand, type SetCommand } from '../src/components/tracker/setCommand.ts';
import type { ExerciseSessionLog } from '../src/types/workout.ts';

function parsed(text: string): SetCommand {
  const result = parseSetCommand(text);
  assert.ok(result.ok, `${text}: ${result.ok ? '' : result.message}`);
  return result.command;
}

test('reads load × reps, with an optional RIR, and marks the set done', () => {
  const CASES: [text: string, expected: SetCommand][] = [
    ['62.5x8', { kind: 'log', weightKg: 62.5, reps: 8, markDone: true }],
    ['62.5x8@2', { kind: 'log', weightKg: 62.5, reps: 8, rir: 2, markDone: true }],
    [' 100 X 5 @ 0 ', { kind: 'log', weightKg: 100, reps: 5, rir: 0, markDone: true }],
    ['7,5×12', { kind: 'log', weightKg: 7.5, reps: 12, markDone: true }]
  ];
  for (const [text, expected] of CASES) assert.deepEqual(parsed(text), expected, text);
});

test('changes only the reps or only the load without marking the set done', () => {
  assert.deepEqual(parsed('x9'), { kind: 'log', reps: 9, markDone: false });
  assert.deepEqual(parsed('65x'), { kind: 'log', weightKg: 65, markDone: false });
});

test('reads the one-word commands and their arguments', () => {
  const CASES: [text: string, expected: SetCommand][] = [
    ['+', { kind: 'step', direction: 1 }],
    ['-', { kind: 'step', direction: -1 }],
    ['d', { kind: 'done' }],
    ['U', { kind: 'undo' }],
    ['n', { kind: 'focus', direction: 1 }],
    ['p', { kind: 'focus', direction: -1 }],
    ['rest 120', { kind: 'rest', seconds: 120 }],
    ['rest 99999', { kind: 'rest', seconds: 3600 }],
    ['skip', { kind: 'skipRest' }],
    ['plates', { kind: 'plates' }],
    ['note Grip felt weak', { kind: 'note', text: 'Grip felt weak' }],
    ['fin', { kind: 'finish' }],
    ['q', { kind: 'leave' }],
    ['?', { kind: 'help' }]
  ];
  for (const [text, expected] of CASES) assert.deepEqual(parsed(text), expected, text);
});

test('explains what is wrong instead of guessing', () => {
  const CASES: [text: string, message: RegExp][] = [
    ['', /unknown command/],
    ['bench', /unknown command/],
    ['x', /give a load, reps or both/],
    ['60x8@7', /RIR goes from 0 to 5/],
    ['rest', /rest needs seconds/],
    ['rest soon', /rest needs seconds/]
  ];
  for (const [text, message] of CASES) {
    const result = parseSetCommand(text);
    assert.ok(!result.ok, text);
    assert.match(result.message, message, text);
  }
});

function logs(...doneFlags: boolean[][]): ExerciseSessionLog[] {
  return doneFlags.map((flags, i) => ({
    exerciseId: `ex-${i}`,
    exerciseName: `Exercise ${i}`,
    sets: flags.map((completed, s) => ({ setNumber: s + 1, weightKg: 20, repsCompleted: 8, targetReps: '8–12', completed }))
  }));
}

test('the next open set starts at the focused exercise and moves on to later ones', () => {
  const workout = logs([true, false], [true, true], [false]);
  assert.deepEqual(nextOpenSet(workout, 0), { exerciseIndex: 0, setIndex: 1 });
  assert.deepEqual(nextOpenSet(workout, 1), { exerciseIndex: 2, setIndex: 0 });
  assert.equal(nextOpenSet(logs([true], [true]), 0), null);
});

test('undo finds the last done set at or before the focused exercise', () => {
  const workout = logs([true, true, false], [false], [true]);
  assert.deepEqual(lastDoneSet(workout, 1), { exerciseIndex: 0, setIndex: 1 });
  assert.deepEqual(lastDoneSet(workout, 2), { exerciseIndex: 2, setIndex: 0 });
  assert.equal(lastDoneSet(logs([false]), 0), null);
});

test('the set cursor crosses exercises and stops at both ends', () => {
  const workout = logs([false, false], [false]);
  assert.deepEqual(moveCursor(workout, { exerciseIndex: 0, setIndex: 1 }, 1), { exerciseIndex: 1, setIndex: 0 });
  assert.deepEqual(moveCursor(workout, { exerciseIndex: 1, setIndex: 0 }, 1), { exerciseIndex: 1, setIndex: 0 });
  assert.deepEqual(moveCursor(workout, { exerciseIndex: 0, setIndex: 0 }, -1), { exerciseIndex: 0, setIndex: 0 });
});
