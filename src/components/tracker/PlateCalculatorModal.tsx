import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { emptyWeightKg, loadedEnds, plateLayout, stepLoad, type PlateLoaded } from '../../services/loading.ts';
import { Dialog, DialogHeader } from '../ui/Dialog.tsx';
import { PLATE_STYLE } from './plateStyle.ts';
import { Flaps } from '../ui/Flaps.tsx';

interface PlateCalculatorModalProps {
  initialWeightKg: number;
  equipment: PlateLoaded;
  onClose: () => void;
}

const SUBTITLE: Record<PlateLoaded, string> = {
  barbell: `Plates on each side of the ${emptyWeightKg('barbell')} kg bar`,
  dumbbell: 'Plates on each end of the dumbbell (the handle is not counted)',
  landmine: 'Plates on the free end of the bar (the bar is not counted)'
};

// Shows how to load a weight with the home plates, and steps through the weights they can make.
export function PlateCalculatorModal({ initialWeightKg, equipment, onClose }: PlateCalculatorModalProps) {
  const [weight, setWeight] = useState(initialWeightKg);
  const plates = plateLayout(weight, equipment);
  const lighter = stepLoad(weight, equipment, -1);
  const heavier = stepLoad(weight, equipment, 1);
  const ends = loadedEnds(equipment);

  return (
    <Dialog onClose={onClose}>
      <DialogHeader title="Plates" subtitle={SUBTITLE[equipment]} onClose={onClose} />

      <div className="grid w-fit gap-3 mb-6">
        <span className="section-label">Load, kg</span>
        <Flaps text={String(weight)} cells={5} label={`${weight} kg`} className="text-[3.75rem]" />
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => lighter !== null && setWeight(lighter)}
            disabled={lighter === null}
            className="btn btn-secondary h-tap-lg border border-edge disabled:opacity-40"
            title={lighter === null ? 'Lightest load' : `${lighter} kg`}
            aria-label="Next lighter load"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={() => heavier !== null && setWeight(heavier)}
            disabled={heavier === null}
            className="btn btn-secondary h-tap-lg border border-edge disabled:opacity-40"
            title={heavier === null ? 'Heaviest load your plates make' : `${heavier} kg`}
            aria-label="Next heavier load"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {plates === null ? (
        <UnloadableWeight weight={weight} lighter={lighter} heavier={heavier} onPick={setWeight} />
      ) : (
        <>
          <PlateDrawing plates={plates} equipment={equipment} />
          <PlateList plates={plates} ends={ends} />
        </>
      )}

      <button onClick={onClose} className="btn btn-secondary w-full h-tap-lg text-base border border-edge">
        Got it
      </button>
    </Dialog>
  );
}

interface UnloadableWeightProps {
  weight: number;
  lighter: number | null;
  heavier: number | null;
  onPick: (weightKg: number) => void;
}

function UnloadableWeight({ weight, lighter, heavier, onPick }: UnloadableWeightProps) {
  const options = [lighter, heavier].filter((option): option is number => option !== null);
  return (
    <div role="alert" className="grid gap-3 mb-6 border-y border-warn-ink/40 py-3">
      <p className="text-base text-warn-ink">Your plates can't make {weight} kg.</p>
      <div className="flex gap-2">
        {options.map(option => (
          <button key={option} onClick={() => onPick(option)} className="btn btn-secondary h-tap px-3 text-sm border border-edge">
            Use {option} kg
          </button>
        ))}
      </div>
    </div>
  );
}

function PlateDrawing({ plates, equipment }: { plates: number[]; equipment: PlateLoaded }) {
  const end = (key: string, order: number[]) =>
    order.map((plate, i) => (
      <div
        key={`${key}-${i}`}
        className={`${PLATE_STYLE[plate]?.fill} ${PLATE_STYLE[plate]?.size} border border-ink/20 rounded-sm`}
        title={`${plate} kg`}
      />
    ));
  const oneEnd = equipment === 'landmine';
  return (
    <div className="panel p-4 mb-6">
      <div className="w-full flex items-center justify-center space-x-1.5 py-4 overflow-x-auto">
        {oneEnd ? (
          <div className="w-16 h-2 bg-bar/60 rounded-l-sm" title="End on the floor" />
        ) : (
          <>
            <div className="w-6 h-4 bg-bar/60 rounded-l-sm" />
            {end('left', [...plates].reverse())}
            <div className="w-2.5 h-6 bg-bar rounded-sm" />
          </>
        )}
        <div className="w-20 h-2 bg-bar" />
        <div className="w-2.5 h-6 bg-bar rounded-sm" />
        {end('right', plates)}
        <div className="w-6 h-4 bg-bar/60 rounded-r-sm" />
      </div>
      {plates.length === 0 && <p className="text-center text-base text-ink-muted">No plates needed: the empty bar makes this load.</p>}
    </div>
  );
}

function PlateList({ plates, ends }: { plates: number[]; ends: 1 | 2 }) {
  const counts = [...new Set(plates)].map(plate => ({ plate, count: plates.filter(p => p === plate).length }));
  return (
    <ol className="mb-6 border-t border-line">
      {counts.map(({ plate, count }) => (
        <li key={plate} className="flex items-center justify-between gap-4 border-b border-line px-1 py-2">
          <span className="flex items-center gap-3">
            <span className={`min-w-11 h-9 px-1.5 rounded-chip ${PLATE_STYLE[plate]?.fill} ${PLATE_STYLE[plate]?.text} grid place-items-center font-mono text-sm font-semibold`}>
              {plate}
            </span>
            <span className="font-display text-lg font-semibold uppercase tracking-[0.04em] text-ink-soft">{plate} kg</span>
          </span>
          <span className="font-mono text-lg text-ink">
            {count} {ends === 2 ? `per side, ${count * 2} in all` : count === 1 ? 'plate' : 'plates'}
          </span>
        </li>
      ))}
    </ol>
  );
}
