import React, { useState } from 'react';
import { X, Dumbbell } from 'lucide-react';
import { calculatePlates } from '../../services/overloadEngine.ts';

interface PlateCalculatorModalProps {
  initialWeightKg: number;
  onClose: () => void;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  initialWeightKg,
  onClose
}) => {
  const [weight, setWeight] = useState(initialWeightKg);
  const [barWeight, setBarWeight] = useState(20); // 20kg standard Olympic bar

  const plates = calculatePlates(weight, barWeight);

  // Colors for Olympic bumper/standard plates
  const plateColors: { [weight: number]: { bg: string; text: string; border: string } } = {
    25: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-400' },
    20: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-400' },
    15: { bg: 'bg-yellow-500', text: 'text-slate-950', border: 'border-yellow-300' },
    10: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-400' },
    5: { bg: 'bg-slate-200', text: 'text-slate-900', border: 'border-white' },
    2.5: { bg: 'bg-slate-700', text: 'text-slate-200', border: 'border-slate-500' },
    1.25: { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-600' }
  };

  const plateEntries = Object.entries(plates)
    .map(([w, count]) => ({ weight: parseFloat(w), count }))
    .sort((a, b) => b.weight - a.weight);

  const totalPlatesWeightPerSide = plateEntries.reduce((sum, p) => sum + p.weight * p.count, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Plate Calculator</h3>
              <p className="text-xs text-slate-400">Loading breakdown per side of barbell</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Weight Selector */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Target Load</span>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400">Bar:</span>
              <button
                onClick={() => setBarWeight(20)}
                className={`px-2 py-0.5 rounded-md font-bold transition ${
                  barWeight === 20 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                20 kg
              </button>
              <button
                onClick={() => setBarWeight(15)}
                className={`px-2 py-0.5 rounded-md font-bold transition ${
                  barWeight === 15 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                15 kg
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setWeight(prev => Math.max(barWeight, prev - 2.5))}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-lg flex items-center justify-center transition active:scale-95"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">{weight}</span>
              <span className="text-sm font-semibold text-slate-400 ml-1">kg</span>
            </div>
            <button
              onClick={() => setWeight(prev => prev + 2.5)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-lg flex items-center justify-center transition active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        {/* Barbell Visual Representation */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-5 flex flex-col items-center">
          <div className="text-xs text-slate-400 font-semibold mb-3">
            Per Side: <span className="text-indigo-400 font-bold">{totalPlatesWeightPerSide} kg</span> (excluding {barWeight}kg bar)
          </div>

          {/* Graphical Bar and Plates */}
          <div className="w-full flex items-center justify-center space-x-1.5 py-4 overflow-x-auto">
            {/* Bar sleeve */}
            <div className="w-6 h-4 bg-slate-600 rounded-l-sm" />
            <div className="w-3 h-8 bg-slate-400" />

            {/* Plates on sleeve */}
            {plateEntries.length === 0 ? (
              <span className="text-xs text-slate-500 italic py-2">No extra plates needed</span>
            ) : (
              plateEntries.flatMap(entry =>
                Array.from({ length: entry.count }).map((_, i) => {
                  const style = plateColors[entry.weight] || { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-400' };
                  const heightClass =
                    entry.weight >= 20 ? 'h-16 w-4' : entry.weight >= 10 ? 'h-13 w-3.5' : entry.weight >= 5 ? 'h-10 w-3' : 'h-7 w-2.5';

                  return (
                    <div
                      key={`${entry.weight}-${i}`}
                      className={`${style.bg} ${style.border} border ${heightClass} rounded-sm flex items-center justify-center shadow-md`}
                      title={`${entry.weight} kg`}
                    />
                  );
                })
              )
            )}

            {/* Collar */}
            <div className="w-2.5 h-6 bg-amber-400 rounded-sm" />
          </div>
        </div>

        {/* Detailed Plate List */}
        <div className="space-y-2 mb-4">
          {plateEntries.length === 0 ? (
            <p className="text-center text-sm text-slate-400">Empty bar only ({barWeight} kg)</p>
          ) : (
            plateEntries.map(({ weight: pWeight, count }) => {
              const style = plateColors[pWeight] || { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-400' };
              return (
                <div
                  key={pWeight}
                  className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center font-bold text-xs ${style.text}`}>
                      {pWeight}
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{pWeight} kg plate</span>
                  </div>
                  <div className="text-sm font-bold text-indigo-300">
                    {count}× <span className="text-xs font-normal text-slate-400">({count * 2} total)</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
