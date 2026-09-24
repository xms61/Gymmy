import { Check } from 'lucide-react';
import type { EquipmentType, SetLog } from '../../types/workout.ts';
import { clampTo, LIMITS } from '../../validation.ts';
import { isLoadable, stepLoad } from '../../services/loading.ts';
import { useTheme } from '../../theme/ThemeProvider.tsx';
import { InkStamp } from '../ui/InkStamp.tsx';
import { RIR_CHOICES, rirOf, withRir } from '../../services/effort.ts';

export type SetChange = (set: SetLog) => SetLog;

interface SetRowProps {
  set: SetLog;
  equipment: EquipmentType;
  onToggle: () => void;
  onChange: (change: SetChange) => void;
}

export function SetRow({ set, equipment, onToggle, onChange }: SetRowProps) {
  const loadable = isLoadable(set.weightKg, equipment);
  const { theme } = useTheme();
  return (
    <div
      data-done={set.completed}
      className={`set-row grid grid-cols-12 gap-2 items-center p-2.5 rounded-panel border transition-all ${
        set.completed ? 'bg-good-ink/5 border-good-ink/40' : 'bg-inset border-line hover:border-edge'
      }`}
    >
      <div className="set-number col-span-2 text-center">
        <span
          className={`set-numeral w-8 h-8 rounded-control font-mono font-bold text-sm flex items-center justify-center mx-auto ${
            set.completed ? 'bg-good text-on-good' : 'bg-control text-ink-soft'
          }`}
        >
          {set.setNumber}
        </span>
      </div>

      <Stepper
        className="set-load col-span-4"
        unit="kg"
        label={`Load in kg, set ${set.setNumber}`}
        value={set.weightKg}
        inputWidth="w-14"
        stepTitles={['Next lighter load', 'Next heavier load']}
        warning={loadable ? undefined : unloadableHint(set.weightKg, equipment)}
        onStep={direction => onChange(s => ({ ...s, weightKg: steppedWeight(s.weightKg, equipment, direction) }))}
        onEnter={text => onChange(s => ({ ...s, weightKg: clampTo(LIMITS.weightKg, parseFloat(text)) }))}
      />

      <Stepper
        className="set-reps col-span-4"
        unit="reps"
        label={`Reps, set ${set.setNumber}`}
        value={set.repsCompleted}
        inputWidth="w-12"
        onStep={direction => onChange(s => ({ ...s, repsCompleted: clampTo(LIMITS.reps, s.repsCompleted + direction) }))}
        onEnter={text => onChange(s => ({ ...s, repsCompleted: clampTo(LIMITS.reps, parseInt(text)) }))}
      />

      <div className="set-done col-span-2 flex items-center justify-center">
        <button
          onClick={onToggle}
          title={set.completed ? 'Mark set as not done' : 'Mark set as done'}
          className={`w-9 h-9 rounded-control flex items-center justify-center transition-all active:scale-90 ${
            set.completed ? 'bg-good text-on-good shadow-lg shadow-good/30' : 'bg-control hover:bg-control-hover text-ink-muted hover:text-ink'
          }`}
        >
          {set.completed && theme.traits.doneMark === 'stamp' ? (
            <InkStamp label="Done" />
          ) : (
            <Check className={`w-5 h-5 ${set.completed ? 'stroke-[3]' : ''}`} />
          )}
        </button>
      </div>

      {set.completed && (
        <RirPicker setNumber={set.setNumber} value={rirOf(set)} onPick={rir => onChange(s => withRir(s, rir))} />
      )}
    </div>
  );
}

// Optional, and offered only once the set is done: how many more reps it had left. Picking the
// chosen value again clears it.
function RirPicker({ setNumber, value, onPick }: { setNumber: number; value: number | null; onPick: (rir: number | null) => void }) {
  return (
    <div role="radiogroup" aria-label={`Reps in reserve, set ${setNumber}`} className="set-rir col-span-12 flex items-center gap-1.5 pl-1">
      <span className="section-label text-[10px] w-10 flex-none" title="Reps in reserve: how many more reps you had left. 0 means you could not do another.">
        RIR
      </span>
      {RIR_CHOICES.map(rir => (
        <button
          key={rir}
          role="radio"
          aria-checked={value === rir}
          onClick={() => onPick(value === rir ? null : rir)}
          className={`flex-1 max-w-12 h-tap rounded-chip font-mono font-bold text-xs transition ${
            value === rir ? 'bg-accent text-on-accent' : 'bg-control hover:bg-control-hover text-ink-soft'
          }`}
        >
          {rir}
        </button>
      ))}
    </div>
  );
}

interface StepperProps {
  unit: string; // shown inside the field by themes that hide the column headings
  label: string;
  value: number;
  inputWidth: string;
  stepTitles?: [lighter: string, heavier: string];
  warning?: string;
  className: string;
  onStep: (direction: 1 | -1) => void;
  onEnter: (text: string) => void;
}

function Stepper({ unit, label, value, inputWidth, stepTitles, warning, className, onStep, onEnter }: StepperProps) {
  return (
    <div className={`stepper flex items-center justify-center space-x-1 ${className}`}>
      <StepButton label="-" title={stepTitles?.[0]} onClick={() => onStep(-1)} />
      <span className="stepper-field relative flex">
        <span className="stepper-unit hidden section-label text-[9px] leading-none">{unit}</span>
        <input
          type="number"
          step="any"
          value={value === 0 ? '' : value}
          onChange={event => onEnter(event.target.value)}
          aria-label={label}
          title={warning}
          aria-invalid={warning !== undefined}
          className={`field ${inputWidth} h-tap text-center font-mono font-bold text-base sm:text-sm ${warning ? 'border-warn-ink text-warn-ink' : ''}`}
          placeholder="0"
        />
      </span>
      <StepButton label="+" title={stepTitles?.[1]} onClick={() => onStep(1)} />
    </div>
  );
}

function StepButton({ label, title, onClick }: { label: string; title?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-tap rounded-chip bg-control hover:bg-control-hover text-ink-soft font-bold text-xs flex items-center justify-center transition active:scale-95"
    >
      {label}
    </button>
  );
}

// Steps through the loads the home equipment makes, and stays put at the lightest and heaviest.
function steppedWeight(weightKg: number, equipment: EquipmentType, direction: 1 | -1): number {
  return clampTo(LIMITS.weightKg, stepLoad(weightKg, equipment, direction) ?? weightKg);
}

function unloadableHint(weightKg: number, equipment: EquipmentType): string {
  const neighbours = [stepLoad(weightKg, equipment, -1), stepLoad(weightKg, equipment, 1)].filter(w => w !== null);
  return `Your plates can't make ${weightKg} kg. Nearest: ${neighbours.join(' or ')} kg.`;
}
