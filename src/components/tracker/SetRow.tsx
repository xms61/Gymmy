import { Check } from 'lucide-react';
import type { SetLog } from '../../types/workout.ts';
import { clampTo, LIMITS } from '../../validation.ts';

export type SetChange = (set: SetLog) => SetLog;

interface SetRowProps {
  set: SetLog;
  onToggle: () => void;
  onChange: (change: SetChange) => void;
}

const WEIGHT_STEP_KG = 2.5;

export function SetRow({ set, onToggle, onChange }: SetRowProps) {
  return (
    <div
      className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-panel border transition-all ${
        set.completed ? 'bg-good-ink/5 border-good-ink/40' : 'bg-inset border-line hover:border-edge'
      }`}
    >
      <div className="col-span-2 text-center">
        <span
          className={`w-8 h-8 rounded-control font-mono font-bold text-sm flex items-center justify-center mx-auto ${
            set.completed ? 'bg-good text-on-good' : 'bg-control text-ink-soft'
          }`}
        >
          {set.setNumber}
        </span>
      </div>

      <Stepper
        className="col-span-4"
        value={set.weightKg}
        inputWidth="w-14"
        step={0.5}
        stepTitle={`${WEIGHT_STEP_KG} kg`}
        onStep={direction => onChange(s => ({ ...s, weightKg: steppedWeight(s.weightKg, direction * WEIGHT_STEP_KG) }))}
        onEnter={text => onChange(s => ({ ...s, weightKg: clampTo(LIMITS.weightKg, parseFloat(text)) }))}
      />

      <Stepper
        className="col-span-4"
        value={set.repsCompleted}
        inputWidth="w-12"
        onStep={direction => onChange(s => ({ ...s, repsCompleted: clampTo(LIMITS.reps, s.repsCompleted + direction) }))}
        onEnter={text => onChange(s => ({ ...s, repsCompleted: clampTo(LIMITS.reps, parseInt(text)) }))}
      />

      <div className="col-span-2 flex items-center justify-center">
        <button
          onClick={onToggle}
          title={set.completed ? 'Mark set as not done' : 'Mark set as done'}
          className={`w-9 h-9 rounded-control flex items-center justify-center transition-all active:scale-90 ${
            set.completed ? 'bg-good text-on-good shadow-lg shadow-good/30' : 'bg-control hover:bg-control-hover text-ink-muted hover:text-ink'
          }`}
        >
          <Check className={`w-5 h-5 ${set.completed ? 'stroke-[3]' : ''}`} />
        </button>
      </div>
    </div>
  );
}

interface StepperProps {
  value: number;
  inputWidth: string;
  step?: number;
  stepTitle?: string;
  className: string;
  onStep: (direction: 1 | -1) => void;
  onEnter: (text: string) => void;
}

function Stepper({ value, inputWidth, step, stepTitle, className, onStep, onEnter }: StepperProps) {
  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      <StepButton label="-" title={stepTitle && `-${stepTitle}`} onClick={() => onStep(-1)} />
      <input
        type="number"
        step={step}
        value={value === 0 ? '' : value}
        onChange={event => onEnter(event.target.value)}
        className={`field ${inputWidth} h-tap text-center font-mono font-bold text-base sm:text-sm`}
        placeholder="0"
      />
      <StepButton label="+" title={stepTitle && `+${stepTitle}`} onClick={() => onStep(1)} />
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

function steppedWeight(weightKg: number, deltaKg: number): number {
  return clampTo(LIMITS.weightKg, Math.round((weightKg + deltaKg) * 100) / 100);
}
