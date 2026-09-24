// Arc math for gauges. Angles are in degrees, clockwise from 12 o'clock.

export function polarPoint(cx: number, cy: number, r: number, angle: number): [x: number, y: number] {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [round(cx + r * Math.cos(radians)), round(cy + r * Math.sin(radians))];
}

// An SVG path along a circle from one angle to a larger one.
export function arcPath(cx: number, cy: number, r: number, from: number, to: number): string {
  const [x1, y1] = polarPoint(cx, cy, r, from);
  const [x2, y2] = polarPoint(cx, cy, r, to);
  const largeArc = to - from > 180 ? 1 : 0;
  return `M${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2}`;
}

// Where a value sits on a gauge that sweeps `sweep` degrees, centered on 12 o'clock.
export function gaugeAngle(value: number, max: number, sweep: number): number {
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return -sweep / 2 + share * sweep;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
