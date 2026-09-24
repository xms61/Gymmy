// A tiny trend line with no axes, for a readout. The last point is marked.
export function Sparkline({ values, width = 96, height = 24 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const low = Math.min(...values);
  const span = Math.max(...values) - low || 1;
  const pad = 3;
  const points = values.map((value, i) => [
    pad + (i / (values.length - 1)) * (width - 2 * pad),
    pad + (1 - (value - low) / span) * (height - 2 * pad)
  ]);
  const [lastX, lastY] = points[points.length - 1]!;
  return (
    <svg width={width} height={height} aria-hidden="true" className="text-accent-ink">
      <polyline points={points.map(p => p.join(',')).join(' ')} fill="none" className="stroke-current" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2.5} className="fill-current" />
    </svg>
  );
}
