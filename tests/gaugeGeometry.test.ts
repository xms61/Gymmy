import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arcPath, gaugeAngle, polarPoint } from '../src/components/ui/gaugeGeometry.ts';

test('angles run clockwise from 12 o\'clock', () => {
  assert.deepEqual(polarPoint(50, 50, 40, 0), [50, 10]);
  assert.deepEqual(polarPoint(50, 50, 40, 90), [90, 50]);
  assert.deepEqual(polarPoint(50, 50, 40, 180), [50, 90]);
});

test('a gauge value maps onto its sweep and stays inside it', () => {
  assert.equal(gaugeAngle(0, 5, 270), -135);
  assert.equal(gaugeAngle(5, 5, 270), 135);
  assert.equal(gaugeAngle(2.5, 5, 180), 0);
  assert.equal(gaugeAngle(9, 5, 180), 90);
  assert.equal(gaugeAngle(1, 0, 180), -90);
});

test('an arc over half a circle uses the large-arc flag', () => {
  assert.match(arcPath(50, 50, 40, -135, 135), / 0 1 1 /);
  assert.match(arcPath(50, 50, 40, -90, 0), / 0 0 1 /);
});
