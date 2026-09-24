import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { nearestIndex, pointX, pointY, valueAxis } from './chartScale.ts';

export interface TrendPoint {
  label: string; // the session's date, as the list below the chart writes it
  value: number;
}

interface TrendChartProps {
  title: string;
  unit: string;
  points: TrendPoint[]; // oldest first
}

const HEIGHT = 140;
const PAD = { top: 10, right: 12, bottom: 8, left: 44 };

// One measure across the sessions: a 2px line over a faint wash, a ringed latest point, and a
// crosshair that follows the pointer or the arrow keys. The history list below is its table view.
export function TrendChart({ title, unit, points }: TrendChartProps) {
  const [frameRef, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const latest = points[points.length - 1];
  if (!latest) return null;

  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const axis = valueAxis(points.map(p => p.value));
  const xy = points.map((p, i) => [PAD.left + pointX(i, points.length, plotWidth), PAD.top + pointY(p.value, axis, plotHeight)] as const);
  const line = xy.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const area = `${line} L${xy[xy.length - 1]![0]},${PAD.top + plotHeight} L${xy[0]![0]},${PAD.top + plotHeight} Z`;
  const shown = active ?? points.length - 1;
  const [shownX, shownY] = xy[shown]!;

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setActive(nearestIndex(event.clientX - box.left - PAD.left, points.length, plotWidth));
  };
  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    setActive(Math.min(points.length - 1, Math.max(0, shown + step)));
  };

  return (
    <figure className="panel p-4">
      <figcaption className="flex items-baseline justify-between gap-2 mb-2">
        <span className="section-label">{title}</span>
        <span className="text-xs text-ink-muted">
          Latest <strong className="font-mono text-ink">{formatValue(latest.value)} {unit}</strong>
        </span>
      </figcaption>
      <div ref={frameRef} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`${title}, ${points.length} sessions, from ${formatValue(points[0]!.value)} to ${formatValue(latest.value)} ${unit}`}
            tabIndex={0}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setActive(null)}
            onKeyDown={onKeyDown}
            onBlur={() => setActive(null)}
            className="block text-accent-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink"
          >
            {axis.ticks.map(tick => {
              const y = PAD.top + pointY(tick, axis, plotHeight);
              return (
                <g key={tick}>
                  <line x1={PAD.left} x2={width - PAD.right} y1={y} y2={y} className="stroke-line" strokeWidth={1} />
                  <text x={PAD.left - 6} y={y} dy="0.32em" textAnchor="end" className="fill-ink-muted font-mono text-[10px]">
                    {formatValue(tick)}
                  </text>
                </g>
              );
            })}
            {points.length > 1 && <path d={area} className="fill-current" opacity={0.1} />}
            {points.length > 1 && <path d={line} className="stroke-current" fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
            {active !== null && (
              <line x1={shownX} x2={shownX} y1={PAD.top} y2={PAD.top + plotHeight} className="stroke-edge" strokeWidth={1} />
            )}
            <circle cx={shownX} cy={shownY} r={5} className="fill-current stroke-inset" strokeWidth={2} />
          </svg>
        )}
        {active !== null && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-full bg-surface border border-edge rounded-chip px-2 py-1 text-[11px] whitespace-nowrap shadow-lg"
            style={{ left: Math.min(Math.max(shownX, 60), width - 60), top: shownY - 8 }}
          >
            <div className="text-ink-muted">{points[active]!.label}</div>
            <div className="flex items-center gap-1.5 font-mono font-bold text-ink">
              <span className="inline-block w-3 h-0.5 bg-accent-ink" />
              {formatValue(points[active]!.value)} {unit}
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}

function useWidth(): [(element: HTMLDivElement | null) => void, number] {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);
  useEffect(() => {
    if (!element) return;
    observer.current = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.current.observe(element);
    return () => observer.current?.disconnect();
  }, [element]);
  return [setElement, width];
}

function formatValue(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
}
