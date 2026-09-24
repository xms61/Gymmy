// The geometry of a small trend chart: a value axis with round ticks, and where each point goes.

export interface ValueAxis {
  min: number;
  max: number;
  ticks: number[];
}

// Three to five round ticks that cover every value. A flat series gets a band around its value,
// so its line sits in the middle instead of on an edge.
export function valueAxis(values: number[]): ValueAxis {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low || Math.max(Math.abs(high), 1);
  const step = roundStep(span / 3);
  const min = Math.floor((high === low ? low - span / 2 : low) / step) * step;
  const max = Math.ceil((high === low ? high + span / 2 : high) / step) * step;
  const ticks: number[] = [];
  for (let tick = min; tick <= max + step / 2; tick += step) ticks.push(roundToStep(tick, step));
  return { min, max, ticks };
}

// Points spread evenly across the width, one per session, oldest on the left.
export function pointX(index: number, count: number, width: number): number {
  return count === 1 ? width / 2 : (index / (count - 1)) * width;
}

export function pointY(value: number, axis: ValueAxis, height: number): number {
  return height - ((value - axis.min) / (axis.max - axis.min)) * height;
}

// The index of the session whose x is closest to a position across the width.
export function nearestIndex(x: number, count: number, width: number): number {
  if (count <= 1) return 0;
  return Math.min(count - 1, Math.max(0, Math.round((x / width) * (count - 1))));
}

// 1, 2, 2.5 or 5 times a power of ten.
function roundStep(rough: number): number {
  const power = 10 ** Math.floor(Math.log10(rough));
  const multiple = [1, 2, 2.5, 5, 10].find(m => m * power >= rough) ?? 10;
  return multiple * power;
}

function roundToStep(value: number, step: number): number {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  return Number(value.toFixed(decimals));
}
