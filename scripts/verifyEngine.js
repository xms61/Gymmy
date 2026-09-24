// Standalone verification script for OverloadEngine and Plate Calculator
import { OverloadEngine } from '../src/services/overloadEngine.js';

console.log('Testing OverloadEngine logic...');
// We can test calculatePlates and estimate1RM
const plates = OverloadEngine.calculatePlates(62.5, 20);
console.log('Plates for 62.5kg:', plates);
if (plates[20] === 1 && plates[1.25] === 1) {
  console.log('✓ Plate calculation passed');
} else {
  console.error('✗ Plate calculation failed');
  process.exit(1);
}

const est1RM = OverloadEngine.estimate1RM(100, 6);
console.log('Estimated 1RM for 100kg x 6 reps:', est1RM);
if (est1RM >= 115 && est1RM <= 117) {
  console.log('✓ 1RM Brzycki estimation passed');
} else {
  console.error('✗ 1RM Brzycki estimation failed');
  process.exit(1);
}

console.log('All standalone checks passed!');
