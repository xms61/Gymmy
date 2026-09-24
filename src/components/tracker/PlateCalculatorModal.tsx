import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { calculatePlates } from '../../services/overloadEngine.ts';
import { Dialog, DialogHeader } from '../ui/Dialog.tsx';

interface PlateCalculatorModalProps {
  initialWeightKg: number;
  onClose: () => void;
}

// Olympic plate colors, taken from the theme. Class names are written out in full so Tailwind finds them.
const PLATE_STYLE: Record<number, { fill: string; text: string; size: string }> = {
  25: { fill: 'bg-plate-25', text: 'text-on-plate', size: 'h-16 w-4' },
  20: { fill: 'bg-plate-20', text: 'text-on-plate', size: 'h-16 w-4' },
  15: { fill: 'bg-plate-15', text: 'text-on-plate-light', size: 'h-12 w-3.5' },
  10: { fill: 'bg-plate-10', text: 'text-on-plate', size: 'h-12 w-3.5' },
  5: { fill: 'bg-plate-5', text: 'text-on-plate-light', size: 'h-10 w-3' },
  2.5: { fill: 'bg-plate-2-5', text: 'text-on-plate', size: 'h-7 w-2.5' },
  1.25: { fill: 'bg-plate-1-25', text: 'text-on-plate', size: 'h-7 w-2.5' }
};

const BAR_OPTIONS_KG = [20, 15];

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  initialWeightKg,
  onClose
}) => {
  const [weight, setWeight] = useState(initialWeightKg);
  const [barWeight, setBarWeight] = useState(20); // 20kg standard Olympic bar

  const plates = calculatePlates(weight, barWeight);

  const plateEntries = Object.entries(plates)
    .map(([w, count]) => ({ weight: parseFloat(w), count }))
    .sort((a, b) => b.weight - a.weight);

  const totalPlatesWeightPerSide = plateEntries.reduce((sum, p) => sum + p.weight * p.count, 0);

  return (
    <Dialog>
      <DialogHeader
        icon={Dumbbell}
        title="Plate Calculator"
        subtitle="Loading breakdown per side of barbell"
        onClose={onClose}
      />

      <div className="panel p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="section-label font-semibold">Target Load</span>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-ink-muted">Bar:</span>
            {BAR_OPTIONS_KG.map(option => (
              <button
                key={option}
                onClick={() => setBarWeight(option)}
                className={`px-2 py-0.5 rounded-chip font-bold transition ${
                  barWeight === option ? 'bg-accent text-on-accent' : 'bg-control text-ink-muted'
                }`}
              >
                {option} kg
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setWeight(prev => Math.max(barWeight, prev - 2.5))}
            className="btn btn-secondary w-10 h-10 text-lg"
          >
            -
          </button>
          <div className="flex-1 text-center">
            <span className="text-3xl font-extrabold font-mono text-ink tracking-tight">{weight}</span>
            <span className="text-sm font-semibold text-ink-muted ml-1">kg</span>
          </div>
          <button onClick={() => setWeight(prev => prev + 2.5)} className="btn btn-secondary w-10 h-10 text-lg">
            +
          </button>
        </div>
      </div>

      <div className="panel bg-inset/60 p-4 mb-5 flex flex-col items-center">
        <div className="text-xs text-ink-muted font-semibold mb-3">
          Per Side: <span className="text-accent-ink font-bold">{totalPlatesWeightPerSide} kg</span> (excluding {barWeight}kg bar)
        </div>

        <div className="w-full flex items-center justify-center space-x-1.5 py-4 overflow-x-auto">
          <div className="w-6 h-4 bg-bar/60 rounded-l-sm" />
          <div className="w-3 h-8 bg-bar" />

          {plateEntries.length === 0 ? (
            <span className="text-xs text-ink-faint italic py-2">No extra plates needed</span>
          ) : (
            plateEntries.flatMap(entry =>
              Array.from({ length: entry.count }).map((_, i) => {
                const style = PLATE_STYLE[entry.weight];
                return (
                  <div
                    key={`${entry.weight}-${i}`}
                    className={`${style.fill} ${style.size} border border-ink/20 rounded-sm shadow-md`}
                    title={`${entry.weight} kg`}
                  />
                );
              })
            )
          )}

          <div className="w-2.5 h-6 bg-warn-ink rounded-sm" />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {plateEntries.length === 0 ? (
          <p className="text-center text-sm text-ink-muted">Empty bar only ({barWeight} kg)</p>
        ) : (
          plateEntries.map(({ weight: pWeight, count }) => {
            const style = PLATE_STYLE[pWeight];
            return (
              <div
                key={pWeight}
                className="flex items-center justify-between p-2.5 bg-control/60 rounded-control border border-line"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-chip ${style.fill} ${style.text} flex items-center justify-center font-bold text-xs`}>
                    {pWeight}
                  </div>
                  <span className="text-sm font-semibold text-ink-soft">{pWeight} kg plate</span>
                </div>
                <div className="text-sm font-bold text-accent-ink">
                  {count}× <span className="text-xs font-normal text-ink-muted">({count * 2} total)</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button onClick={onClose} className="btn btn-primary w-full py-3 text-sm">
        Got it
      </button>
    </Dialog>
  );
};
