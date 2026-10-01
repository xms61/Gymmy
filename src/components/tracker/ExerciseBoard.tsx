import { Calculator, Check, ChevronRight, Plus, Trash2, Undo2 } from 'lucide-react';
import type { EquipmentType, ExerciseDefinition, ExerciseSessionLog, ProgressRecommendation, SetLog } from '../../types/workout.ts';
import { isLoadable, isPlateLoaded } from '../../services/loading.ts';
import { rirOf, withRir } from '../../services/effort.ts';
import { clampTo, LIMITS, MAX_NOTES_LENGTH } from '../../validation.ts';
import { StatusBadge } from '../ui/badges.tsx';
import { FlapStepper, RirPicker, steppedWeight, unloadableHint, type SetChange } from './SetControls.tsx';

interface ExerciseBoardProps {
  log: ExerciseSessionLog;
  definition: ExerciseDefinition | undefined;
  recommendation: ProgressRecommendation | null;
  setIndex: number; // the set on the board
  onSelectSet: (setIdx: number) => void;
  onToggleSet: (setIdx: number) => void;
  onChangeSet: (setIdx: number, change: SetChange) => void;
  onAddSet: () => void;
  onRemoveLastSet: () => void;
  onNotesChange: (notes: string) => void;
  onOpenPlates: (weightKg: number, equipment: EquipmentType) => void;
}

// The exercise that owns the board: one set at a time in flap digits, every set of the exercise
// in a strip below it.
export function ExerciseBoard({
  log,
  definition,
  recommendation,
  setIndex,
  onSelectSet,
  onToggleSet,
  onChangeSet,
  onAddSet,
  onRemoveLastSet,
  onNotesChange,
  onOpenPlates
}: ExerciseBoardProps) {
  // Every log the tracker creates records its equipment; the fallback covers older drafts.
  const equipment = definition?.equipment ?? log.equipment ?? 'barbell';
  const set = log.sets[setIndex] ?? log.sets[0];
  if (!set) return null;
  const change = (update: SetChange) => onChangeSet(setIndex, update);

  return (
    <section aria-labelledby="board-exercise" className="exercise-board">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 id="board-exercise" className="text-6xl leading-[0.95] text-ink">
            {log.exerciseName}
          </h2>
          <p className="mt-2 font-display text-lg font-medium uppercase tracking-[0.06em] text-ink-muted">
            Set {set.setNumber} of {log.sets.length}
            {definition && ` · ${definition.targetRepsMin}–${definition.targetRepsMax} reps`}
            {` · ${equipment}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* The first session has no history, so no status is shown for it. */}
          {recommendation && recommendation.status !== 'maintain' && <StatusBadge status={recommendation.status} />}
          {isPlateLoaded(equipment) && (
            <button onClick={() => onOpenPlates(set.weightKg, equipment)} className="btn btn-secondary h-tap px-3 text-sm border border-edge">
              <Calculator className="w-4 h-4" />
              Plates
            </button>
          )}
        </div>
      </div>

      {/* A steady target needs no sentence: the board already shows it. */}
      {recommendation && recommendation.status !== 'maintain' && (
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-ink-soft">{recommendation.nextStepGoal}</p>
      )}

      <SetReadout set={set} equipment={equipment} onChange={change} />

      {set.completed ? (
        <DoneSet set={set} onUndo={() => onToggleSet(setIndex)} onPickRir={rir => change(s => withRir(s, rir))} />
      ) : (
        <button onClick={() => onToggleSet(setIndex)} className="btn btn-good w-full mt-5 h-16 text-2xl">
          <Check className="w-6 h-6" strokeWidth={3} />
          Log set {set.setNumber}
        </button>
      )}

      <SetStrip sets={log.sets} selected={setIndex} onSelect={onSelectSet} onAdd={onAddSet} onRemoveLast={onRemoveLastSet} />

      <details className="mt-5 group">
        <summary className="btn btn-secondary w-fit h-tap px-3 text-sm border border-edge cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <ChevronRight className="w-4 h-4 group-open:rotate-90" />
          <span className="group-open:hidden">Show notes</span>
          <span className="hidden group-open:inline">Hide notes</span>
        </summary>
        <div className="mt-3 grid gap-2">
          {definition?.notes && definition.notes !== log.notes && <p className="text-sm text-ink-muted">{definition.notes}</p>}
          <textarea
            rows={2}
            value={log.notes || ''}
            onChange={event => onNotesChange(event.target.value)}
            maxLength={MAX_NOTES_LENGTH}
            aria-label={`Notes for ${log.exerciseName}`}
            placeholder="Notes for this exercise: grip, cues, how it felt"
            className="field block w-full resize-none px-3 py-2 text-base text-ink-soft"
          />
        </div>
      </details>
    </section>
  );
}

// Load and reps in flap digits, each with its steps underneath.
function SetReadout({ set, equipment, onChange }: { set: SetLog; equipment: EquipmentType; onChange: (change: SetChange) => void }) {
  const loadable = isLoadable(set.weightKg, equipment);
  return (
    <div className="mt-6 grid grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-x-6">
      <FlapStepper
        heading="Load, kg"
        label={`Load in kg, set ${set.setNumber}`}
        value={set.weightKg}
        cells={5}
        stepTitles={['Next lighter load', 'Next heavier load']}
        warning={loadable ? undefined : unloadableHint(set.weightKg, equipment)}
        onStep={direction => onChange(s => ({ ...s, weightKg: steppedWeight(s.weightKg, equipment, direction) }))}
        onEnter={text => onChange(s => ({ ...s, weightKg: clampTo(LIMITS.weightKg, parseFloat(text)) }))}
      />
      <FlapStepper
        heading="Reps"
        label={`Reps, set ${set.setNumber}`}
        value={set.repsCompleted}
        cells={2}
        stepTitles={['One rep fewer', 'One rep more']}
        onStep={direction => onChange(s => ({ ...s, repsCompleted: clampTo(LIMITS.reps, s.repsCompleted + direction) }))}
        onEnter={text => onChange(s => ({ ...s, repsCompleted: clampTo(LIMITS.reps, parseInt(text)) }))}
      />
    </div>
  );
}

function DoneSet({ set, onUndo, onPickRir }: { set: SetLog; onUndo: () => void; onPickRir: (rir: number | null) => void }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <RirPicker setNumber={set.setNumber} value={rirOf(set)} onPick={onPickRir} />
      <button onClick={onUndo} className="btn btn-secondary h-tap px-4 text-sm border border-edge">
        <Undo2 className="w-4 h-4" />
        Not done
      </button>
    </div>
  );
}

interface SetStripProps {
  sets: SetLog[];
  selected: number;
  onSelect: (setIdx: number) => void;
  onAdd: () => void;
  onRemoveLast: () => void;
}

// Every set of the exercise as one row of tiles. The set on the board has a full-ink outline.
function SetStrip({ sets, selected, onSelect, onAdd, onRemoveLast }: SetStripProps) {
  return (
    <div className="mt-6 flex flex-wrap items-stretch gap-2" role="group" aria-label="Sets">
      {sets.map((set, setIdx) => (
        <button
          key={set.setNumber}
          onClick={() => onSelect(setIdx)}
          aria-current={setIdx === selected ? 'true' : undefined}
          className={`set-tile flex items-center gap-2.5 h-tap-lg px-3 rounded-control border font-mono text-lg transition-colors ${
            setIdx === selected ? 'border-ink bg-surface text-ink' : 'border-line bg-inset hover:border-edge'
          } ${set.completed ? 'text-ink-muted' : 'text-ink'}`}
        >
          <span className="text-sm text-ink-faint">{set.setNumber}</span>
          <span>
            {set.weightKg} × {set.repsCompleted}
          </span>
          {set.completed && <Check className="w-4 h-4 text-ink" strokeWidth={3} aria-label="done" />}
        </button>
      ))}
      <button
        onClick={onAdd}
        disabled={sets.length >= LIMITS.setNumber.max}
        className="btn h-tap-lg px-3 text-sm text-ink-muted hover:text-ink border border-dashed border-edge disabled:opacity-40"
      >
        <Plus className="w-4 h-4" />
        Set
      </button>
      {sets.length > 1 && (
        <button onClick={onRemoveLast} title="Delete the last set" aria-label="Delete the last set" className="icon-btn h-tap-lg px-3 hover:text-bad-ink">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
