import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plateBarText, progressBarText } from '../src/components/terminalText.ts';

test('draws progress as a bar of hashes', () => {
  assert.equal(progressBarText(60), '[######----] 60%');
  assert.equal(progressBarText(0), '[----------] 0%');
  assert.equal(progressBarText(100), '[##########] 100%');
  assert.equal(progressBarText(33, 3), '[#--] 33%');
});

test('draws a loaded bar with the heaviest plates nearest the middle', () => {
  assert.equal(plateBarText([20, 15, 10], 100, 2), '|==[10][15][20]--- 100 kg ---[20][15][10]==|');
  assert.equal(plateBarText([], 10, 2), '|==--- 10 kg ---==|');
  assert.equal(plateBarText([10, 5], 15, 1), 'floor--- 15 kg ---[10][5]==|');
});
