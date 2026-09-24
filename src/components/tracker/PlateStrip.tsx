import { plateLayout, platesInUse, type PlateLoaded } from '../../services/loading.ts';
import { PLATE_STYLE } from './plateStyle.ts';

// One end of the bar at a glance, plates at their relative sizes, and how much of each plate size
// the load takes from the home stock ("15 kg 2/2").
export function PlateStrip({ weightKg, equipment }: { weightKg: number; equipment: PlateLoaded }) {
  const layout = plateLayout(weightKg, equipment);
  if (layout === null) return <div className="set-plates hidden col-span-12 text-[11px] font-mono text-warn-ink">Plates can't make {weightKg} kg</div>;
  return (
    <div className="set-plates hidden col-span-12 items-center gap-3 text-[11px] font-mono text-ink-muted" aria-label={`Plates per end: ${layout.join(', ') || 'none'} kg`}>
      <div className="flex items-center gap-0.5 h-8" aria-hidden="true">
        <span className="w-3 h-1 bg-bar" />
        {layout.map((plate, i) => (
          <span key={i} className={`${PLATE_STYLE[plate]?.fill} ${PLATE_STYLE[plate]?.size} scale-y-[0.5] origin-center rounded-sm`} />
        ))}
        <span className="w-5 h-1 bg-bar" />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {layout.length === 0 && <span>No plates</span>}
        {platesInUse(layout, equipment).map(use => (
          <span key={use.kg}>
            {use.kg} kg <span className={use.inUse === use.owned ? 'text-gauge' : 'text-ink-soft'}>{use.inUse}/{use.owned}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
