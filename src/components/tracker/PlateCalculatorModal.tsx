import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { emptyWeightKg, loadedEnds, plateLayout, stepLoad, type PlateLoaded } from '../../services/loading.ts';
import { Dialog, DialogHeader } from '../ui/Dialog.tsx';
import { PLATE_STYLE } from './plateStyle.ts';

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
      <DialogHeader icon={Dumbbell} title="Plate Calculator" subtitle={SUBTITLE[equipment]} onClose={onClose} />

      <div className="panel p-4 mb-5">
        <span className="section-label font-semibold">Target Load</span>
        <div className="flex items-center space-x-3 mt-2">
          <button
            onClick={() => lighter !== null && setWeight(lighter)}
            disabled={lighter === null}
            className="btn btn-secondary w-10 h-10 text-lg disabled:opacity-40"
            title={lighter === null ? 'Lightest load' : `${lighter} kg`}
          >
            -
          </button>
          <div className="flex-1 text-center">
            <span className="text-3xl font-extrabold font-mono text-ink tracking-tight">{weight}</span>
            <span className="text-sm font-semibold text-ink-muted ml-1">kg</span>
          </div>
          <button
            onClick={() => heavier !== null && setWeight(heavier)}
            disabled={heavier === null}
            className="btn btn-secondary w-10 h-10 text-lg disabled:opacity-40"
            title={heavier === null ? 'Heaviest load your plates make' : `${heavier} kg`}
          >
            +
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

      <button onClick={onClose} className="btn btn-primary w-full py-3 text-sm">
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
    <div role="alert" className="panel p-4 mb-5 text-sm text-warn-ink">
      <p className="font-semibold mb-3">Your plates can't make {weight} kg.</p>
      <div className="flex gap-2">
        {options.map(option => (
          <button key={option} onClick={() => onPick(option)} className="btn btn-secondary px-3 py-1.5 text-xs">
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
        className={`${PLATE_STYLE[plate]?.fill} ${PLATE_STYLE[plate]?.size} border border-ink/20 rounded-sm shadow-md`}
        title={`${plate} kg`}
      />
    ));
  const oneEnd = equipment === 'landmine';
  return (
    <div className="panel bg-inset/60 p-4 mb-5">
      <div className="w-full flex items-center justify-center space-x-1.5 py-4 overflow-x-auto">
        {oneEnd ? (
          <div className="w-16 h-2 bg-bar/60 rounded-l-sm" title="End on the floor" />
        ) : (
          <>
            <div className="w-6 h-4 bg-bar/60 rounded-l-sm" />
            {end('left', [...plates].reverse())}
            <div className="w-2.5 h-6 bg-warn-ink rounded-sm" />
          </>
        )}
        <div className="w-20 h-2 bg-bar" />
        <div className="w-2.5 h-6 bg-warn-ink rounded-sm" />
        {end('right', plates)}
        <div className="w-6 h-4 bg-bar/60 rounded-r-sm" />
      </div>
      {plates.length === 0 && <p className="text-center text-xs text-ink-faint italic">No plates needed</p>}
    </div>
  );
}

function PlateList({ plates, ends }: { plates: number[]; ends: 1 | 2 }) {
  const counts = [...new Set(plates)].map(plate => ({ plate, count: plates.filter(p => p === plate).length }));
  return (
    <div className="space-y-2 mb-4">
      {counts.map(({ plate, count }) => (
        <div key={plate} className="flex items-center justify-between p-2.5 bg-control/60 rounded-control border border-line">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-chip ${PLATE_STYLE[plate]?.fill} ${PLATE_STYLE[plate]?.text} flex items-center justify-center font-bold text-xs`}>
              {plate}
            </div>
            <span className="text-sm font-semibold text-ink-soft">{plate} kg plate</span>
          </div>
          <div className="text-sm font-bold text-accent-ink">
            {count}× {ends === 2 && <span className="text-xs font-normal text-ink-muted">per side ({count * 2} total)</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
