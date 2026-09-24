// Which loads the home equipment can make, and how to put them on. A barbell or dumbbell carries
// the same plates on both ends; a landmine row (Meadows Row) is loaded on its free end only.
// Machine, cable and bodyweight loads aren't built from the plates and move in fixed steps.
import { GYM_INVENTORY, type PlateStock } from '../data/gymInventory.ts';
import type { EquipmentType } from '../types/workout.ts';

export type PlateLoaded = 'barbell' | 'dumbbell' | 'landmine';
type FixedStep = Exclude<EquipmentType, PlateLoaded>;

const GRAMS_PER_KG = 1000; // whole grams keep 1.25 kg plates exact

// emptyKg: what a logged weight includes before any plates. loadedEnds: ends that carry plates.
const IMPLEMENTS: Record<PlateLoaded, { emptyKg: number; maxKg: number; loadedEnds: 1 | 2 }> = {
  barbell: { emptyKg: GYM_INVENTORY.barbellKg, maxKg: Infinity, loadedEnds: 2 },
  dumbbell: { emptyKg: GYM_INVENTORY.dumbbellHandleKg, maxKg: GYM_INVENTORY.dumbbellMaxKg, loadedEnds: 2 },
  // The floor carries part of the bar, so a landmine row logs only the plates on the free end.
  landmine: { emptyKg: 0, maxKg: Infinity, loadedEnds: 1 }
};

const FIXED_STEPS: Record<FixedStep, { stepKg: number; minKg: number }> = {
  machine: { stepKg: 2.5, minKg: 2.5 },
  cable: { stepKg: 2.5, minKg: 2.5 },
  bodyweight: { stepKg: 2.5, minKg: 0 }
};

export function isPlateLoaded(equipment: EquipmentType): equipment is PlateLoaded {
  return equipment in IMPLEMENTS;
}

export function emptyWeightKg(equipment: PlateLoaded): number {
  return IMPLEMENTS[equipment].emptyKg;
}

// The next load up (direction 1) or down (-1), or null past the heaviest or the lightest load.
export function stepLoad(weightKg: number, equipment: EquipmentType, direction: 1 | -1): number | null {
  if (isPlateLoaded(equipment)) {
    const next = nextLoadable(weightKg, equipment, direction);
    return next !== null && next >= lightestLoad(equipment) ? next : null;
  }
  const { stepKg, minKg } = FIXED_STEPS[equipment];
  if (direction === 1) return roundToGram(weightKg + stepKg);
  return weightKg <= minKg ? null : Math.max(minKg, roundToGram(weightKg - stepKg));
}

// The lightest load worth suggesting: the empty bar, or the lightest plate on a dumbbell or landmine.
export function lightestLoad(equipment: EquipmentType): number {
  if (!isPlateLoaded(equipment)) return FIXED_STEPS[equipment].minKg;
  return loadableWeights(equipment).find(weightKg => weightKg > 0) ?? 0;
}

// The load closest to weightKg that can be made, the lighter one on a tie.
export function nearestLoad(weightKg: number, equipment: EquipmentType): number {
  if (!isPlateLoaded(equipment)) {
    const { stepKg } = FIXED_STEPS[equipment];
    return roundToGram(Math.round(weightKg / stepKg) * stepKg);
  }
  const weights = loadableWeights(equipment);
  const index = firstIndexAbove(weights, weightKg);
  const below = weights[index - 1];
  const above = weights[index];
  if (below === undefined) return above ?? weightKg;
  if (above === undefined) return below;
  return above - weightKg < weightKg - below ? above : below;
}

export function isLoadable(weightKg: number, equipment: EquipmentType): boolean {
  return !isPlateLoaded(equipment) || loadableWeights(equipment).includes(weightKg);
}

// The plates on one loaded end, heaviest first, or null when the plates cannot make this weight.
export function plateLayout(weightKg: number, equipment: PlateLoaded, stock = GYM_INVENTORY.plates): number[] | null {
  const { emptyKg, maxKg, loadedEnds } = IMPLEMENTS[equipment];
  if (weightKg > maxKg) return null;
  const endGrams = Math.round(((weightKg - emptyKg) / loadedEnds) * GRAMS_PER_KG);
  return endGrams < 0 ? null : fillEnd(endGrams, loadedEnds, stock);
}

export function loadedEnds(equipment: PlateLoaded): 1 | 2 {
  return IMPLEMENTS[equipment].loadedEnds;
}

const loadableCache = new Map<PlateLoaded, number[]>();

// Every weight the plates can make, lightest first. Computed once per equipment type.
export function loadableWeights(equipment: PlateLoaded): number[] {
  const cached = loadableCache.get(equipment);
  if (cached) return cached;
  const { emptyKg, maxKg, loadedEnds } = IMPLEMENTS[equipment];
  const plateGrams = GYM_INVENTORY.plates.map(p => Math.round(p.kg * GRAMS_PER_KG));
  const stepGrams = plateGrams.reduce(greatestCommonDivisor);
  const endCapacityGrams = GYM_INVENTORY.plates.reduce((sum, p, i) => sum + plateGrams[i]! * Math.floor(p.count / loadedEnds), 0);
  const weights: number[] = [];
  for (let endGrams = 0; endGrams <= endCapacityGrams; endGrams += stepGrams) {
    const weightKg = emptyKg + (loadedEnds * endGrams) / GRAMS_PER_KG;
    if (weightKg > maxKg) break;
    if (fillEnd(endGrams, loadedEnds, GYM_INVENTORY.plates)) weights.push(weightKg);
  }
  loadableCache.set(equipment, weights);
  return weights;
}

// The next heavier (direction 1) or lighter (-1) weight the plates make, or null past either end.
function nextLoadable(weightKg: number, equipment: PlateLoaded, direction: 1 | -1): number | null {
  const weights = loadableWeights(equipment);
  const index = firstIndexAbove(weights, weightKg);
  if (direction === 1) return weights[index] ?? null;
  return weights[weights[index - 1] === weightKg ? index - 2 : index - 1] ?? null;
}

// Binary search: the index of the first weight heavier than weightKg.
function firstIndexAbove(sorted: number[], weightKg: number): number {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (sorted[mid]! <= weightKg) low = mid + 1;
    else high = mid;
  }
  return low;
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

// Rounds to 0.001 kg to drop floating-point noise from sums like 0.1 + 0.2.
function roundToGram(weightKg: number): number {
  return Math.round(weightKg * GRAMS_PER_KG) / GRAMS_PER_KG;
}

// Depth-first over plate sizes, heaviest first. When both ends are loaded, each plate on one end
// needs its twin on the other, so the stock is counted in pairs. Plates lighter than the current
// size are still untouched, so (missing weight, current size, count left) identifies a dead end exactly.
function fillEnd(endGrams: number, loadedEnds: 1 | 2, stock: readonly PlateStock[]): number[] | null {
  const sizes = [...stock]
    .sort((a, b) => b.kg - a.kg)
    .map(p => ({ grams: Math.round(p.kg * GRAMS_PER_KG), left: Math.floor(p.count / loadedEnds) }));
  const deadEnds = new Set<string>();

  const fill = (missingGrams: number, from: number): number[] | null => {
    if (missingGrams === 0) return [];
    const key = `${missingGrams}|${from}|${sizes[from]?.left}`;
    if (deadEnds.has(key)) return null;
    for (let i = from; i < sizes.length; i++) {
      const size = sizes[i]!;
      if (size.left === 0 || size.grams > missingGrams) continue;
      size.left--;
      const rest = fill(missingGrams - size.grams, i);
      size.left++;
      if (rest) return [size.grams / GRAMS_PER_KG, ...rest];
    }
    deadEnds.add(key);
    return null;
  };

  return fill(endGrams, 0);
}
