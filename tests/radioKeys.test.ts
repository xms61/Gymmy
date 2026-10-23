import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextRadioIndex } from '../src/components/ui/radioKeys.ts';

test('arrow keys move through a radio group and wrap at the ends', () => {
  const CASES: [index: number, key: string, expected: number][] = [
    [0, 'ArrowRight', 1],
    [0, 'ArrowDown', 1],
    [5, 'ArrowRight', 0],
    [2, 'ArrowLeft', 1],
    [2, 'ArrowUp', 1],
    [0, 'ArrowLeft', 5],
    [3, 'Home', 0],
    [3, 'End', 5]
  ];
  for (const [index, key, expected] of CASES) assert.equal(nextRadioIndex(index, key, 6), expected, `${index} ${key}`);
});

test('other keys leave the radio group alone', () => {
  for (const key of [' ', 'Enter', 'Tab', 'j', '1']) assert.equal(nextRadioIndex(2, key, 6), null, key);
});
