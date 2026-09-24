// Test core progressive overload logic and plate calculations

function estimate1RM(weightKg, reps) {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  if (reps >= 37) return Math.round(weightKg * 1.5);
  return Math.round(weightKg * (36 / (37 - reps)) * 10) / 10;
}

function calculatePlates(targetWeightKg, barWeightKg = 20) {
  if (targetWeightKg <= barWeightKg) return {};
  let weightPerSide = (targetWeightKg - barWeightKg) / 2;
  const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
  const platesUsed = {};

  for (const plate of availablePlates) {
    if (weightPerSide >= plate) {
      const count = Math.floor(weightPerSide / plate);
      platesUsed[plate] = count;
      weightPerSide -= count * plate;
    }
  }

  return platesUsed;
}

function testProgression(workingSets, targetMin, targetMax, lastWeight, isDumbbell = false) {
  const increment = isDumbbell ? 2 : 2.5;
  const allHitMax = workingSets.length >= 3 && workingSets.every(s => s >= targetMax);
  if (allHitMax) {
    return { status: 'increase_load', newWeight: lastWeight + increment };
  }
  const firstSetHitMax = workingSets[0] >= targetMax;
  if (firstSetHitMax) {
    return { status: 'progress_reps', newWeight: lastWeight };
  }
  return { status: 'progress_reps', newWeight: lastWeight };
}

// 1. Test Plate calculations
const plates62_5 = calculatePlates(62.5, 20);
console.log('Plates for 62.5kg bar (20kg):', plates62_5);
if (plates62_5[20] === 1 && plates62_5[1.25] === 1) {
  console.log('PASS: Plates for 62.5kg');
} else {
  console.error('FAIL: Plates for 62.5kg');
  process.exit(1);
}

// 2. Test 1RM estimation
const rm = estimate1RM(100, 6);
console.log('1RM for 100kg x 6 reps:', rm);
if (rm === 116.1) {
  console.log('PASS: 1RM 100kg x 6 = 116.1kg');
} else {
  console.error('FAIL: 1RM calculation');
  process.exit(1);
}

// 3. Test Double Progression:
// Case A: 8, 8, 8 on target 6-8 -> Should unlock +2.5kg
const resA = testProgression([8, 8, 8], 6, 8, 60);
console.log('Progression result for [8, 8, 8] @ 60kg:', resA);
if (resA.status === 'increase_load' && resA.newWeight === 62.5) {
  console.log('PASS: Double progression load increase');
} else {
  console.error('FAIL: Double progression load increase');
  process.exit(1);
}

// Case B: 8, 6, 4 on target 6-8 -> Should progress reps, hold 60kg
const resB = testProgression([8, 6, 4], 6, 8, 60);
console.log('Progression result for [8, 6, 4] @ 60kg:', resB);
if (resB.status === 'progress_reps' && resB.newWeight === 60) {
  console.log('PASS: Rep progression maintain load');
} else {
  console.error('FAIL: Rep progression maintain load');
  process.exit(1);
}

console.log('\nAll core logic tests successfully PASSED!');
