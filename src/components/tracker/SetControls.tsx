import type { ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { EquipmentType, SetLog } from '../../types/workout.ts';
import { clampTo, LIMITS } from '../../validation.ts';
import { stepLoad } from '../../services/loading.ts';
import { RIR_CHOICES } from '../../services/effort.ts';
import { Flaps } from '../ui/Flaps.tsx';

export type SetChange = (set: SetLog) => SetLog;

interface FlapStepperProps {
  heading: string; // "Load, kg"
  label: string; // the field's accessible name
  value: number;
  cells: number;
  stepTitles: [lower: string, higher: string];
  warning?: string;
  onStep: (direction: 1 | -1) => void;
  onEnter: (text: string) => void;
}

// A value on flap digits with - and + under it. The flaps are the field too: click them and type.
export function FlapStepper({ heading, label, value, cells, stepTitles, warning, onStep, onEnter }: FlapStepperProps) {
  return (
    <div className="grid w-fit gap-3 content-start">
      <span className="section-label">{heading}</span>
      <label className="relative rounded-panel focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-accent">
        <Flaps text={String(value)} cells={cells} label={`${value}`} className="text-[3.75rem] xl:text-[6.5rem]" />
        <input
          type="number"
          step="any"
          value={value === 0 ? '' : value}
          onChange={event => onEnter(event.target.value)}
          aria-label={label}
          title={warning ?? `Type a ${label.toLowerCase()}`}
          aria-invalid={warning !== undefined}
          className="absolute inset-0 w-full h-full opacity-0 cursor-text"
        />
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        <StepButton title={stepTitles[0]} onClick={() => onStep(-1)}>
          <Minus className="w-5 h-5" />
        </StepButton>
        <StepButton title={stepTitles[1]} onClick={() => onStep(1)}>
          <Plus className="w-5 h-5" />
        </StepButton>
      </div>
      {warning && <p className="max-w-[24rem] text-sm text-warn-ink">{warning}</p>}
    </div>
  );
}

function StepButton({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} title={title} aria-label={title} className="btn btn-secondary h-tap-lg border border-edge">
      {children}
    </button>
  );
}

// Optional, and offered only once the set is done: how many more reps it had left. Picking the
// chosen value again clears it.
export function RirPicker({ setNumber, value, onPick }: { setNumber: number; value: number | null; onPick: (rir: number | null) => void }) {
  return (
    <div role="radiogroup" aria-label={`Reps in reserve, set ${setNumber}`} className="flex items-center gap-1.5">
      <span className="section-label w-10 flex-none" title="Reps in reserve: how many more reps you had left. 0 means you could not do another.">
        RIR
      </span>
      {RIR_CHOICES.map(rir => (
        <button
          key={rir}
          role="radio"
          aria-checked={value === rir}
          onClick={() => onPick(value === rir ? null : rir)}
          className={`flex-1 max-w-14 h-tap rounded-chip font-mono text-lg font-semibold border transition-colors ${
            value === rir ? 'bg-good text-on-good border-good' : 'bg-control hover:bg-control-hover text-ink-soft border-edge'
          }`}
        >
          {rir}
        </button>
      ))}
    </div>
  );
}

// Steps through the loads the home equipment makes, and stays put at the lightest and heaviest.
export function steppedWeight(weightKg: number, equipment: EquipmentType, direction: 1 | -1): number {
  return clampTo(LIMITS.weightKg, stepLoad(weightKg, equipment, direction) ?? weightKg);
}

export function unloadableHint(weightKg: number, equipment: EquipmentType): string {
  const neighbours = [stepLoad(weightKg, equipment, -1), stepLoad(weightKg, equipment, 1)].filter(w => w !== null);
  return `Your plates can't make ${weightKg} kg. Nearest: ${neighbours.join(' or ')} kg.`;
}
