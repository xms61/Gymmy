import { arcPath, gaugeAngle, polarPoint } from './gaugeGeometry.ts';

interface GaugeProps {
  value: number | null; // null draws the empty track
  max: number;
  sweep: number; // degrees, centered on 12 o'clock: 180 is a half dial, 270 leaves a gap at the bottom
  size: number; // px
  needle?: boolean; // a pointer across the arc at the value, leaving the center free for a readout
  className?: string;
}

// An instrument dial: a track, the value arc in the gauge color, and an optional needle.
export function Gauge({ value, max, sweep, size, needle = false, className = '' }: GaugeProps) {
  const center = 50;
  const radius = 42;
  const start = -sweep / 2;
  const end = value === null ? start : gaugeAngle(value, max, sweep);
  const [innerX, innerY] = polarPoint(center, center, radius - 12, end);
  const [outerX, outerY] = polarPoint(center, center, radius + 6, end);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className={`text-gauge ${className}`}>
      <path d={arcPath(center, center, radius, start, sweep / 2)} fill="none" className="stroke-control" strokeWidth={8} strokeLinecap="round" />
      {value !== null && end > start && (
        <path d={arcPath(center, center, radius, start, end)} fill="none" className="stroke-current" strokeWidth={8} strokeLinecap="round" />
      )}
      {needle && (
        <line x1={innerX} y1={innerY} x2={outerX} y2={outerY} className="stroke-ink" strokeWidth={3} strokeLinecap="round" />
      )}
    </svg>
  );
}
