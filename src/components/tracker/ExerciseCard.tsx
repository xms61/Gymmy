import { Calculator, Info, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { EquipmentType, ExerciseDefinition, ExerciseSessionLog, ProgressRecommendation } from '../../types/workout.ts';
import { isPlateLoaded } from '../../services/loading.ts';
import { StatusBadge } from '../ui/badges.tsx';
import { LIMITS, MAX_NOTES_LENGTH } from '../../validation.ts';
import { SetRow, type SetChange } from './SetRow.tsx';

interface ExerciseCardProps {
  log: ExerciseSessionLog;
  definition: ExerciseDefinition | undefined;
  recommendation: ProgressRecommendation | null;
  onToggleSet: (setIdx: number) => void;
  onChangeSet: (setIdx: number, change: SetChange) => void;
  onAddSet: () => void;
  onRemoveLastSet: () => void;
  onNotesChange: (notes: string) => void;
  onOpenPlates: (weightKg: number, equipment: EquipmentType) => void;
}

export function ExerciseCard({
  log,
  definition,
  recommendation,
  onToggleSet,
  onChangeSet,
  onAddSet,
  onRemoveLastSet,
  onNotesChange,
  onOpenPlates
}: ExerciseCardProps) {
  // Every log the tracker creates records its equipment; the fallback covers older drafts.
  const equipment = definition?.equipment ?? log.equipment ?? 'barbell';
  return (
    <div className="exercise-card card p-5 shadow-xl transition hover:border-edge relative overflow-hidden">
      <div className="exercise-head flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="exercise-name text-xl font-black text-ink tracking-tight">{log.exerciseName}</h3>
            {isPlateLoaded(equipment) && (
              <button
                onClick={() => onOpenPlates(log.sets[0]?.weightKg ?? definition?.defaultWeightKg ?? 0, equipment)}
                className="p-1.5 bg-control hover:bg-control-hover text-accent-ink rounded-chip text-xs font-semibold flex items-center space-x-1 transition"
                title="Show the plates for this load"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Plates</span>
              </button>
            )}
          </div>

          {definition && <Prescription definition={definition} weightKg={recommendation?.recommendedWeightKg ?? log.sets[0]?.weightKg ?? 0} />}

          <div className="flex items-center space-x-2 mt-1 text-xs text-ink-muted">
            <span className="capitalize font-medium text-ink-soft">{log.equipment || 'Gym Exercise'}</span>
            <span>•</span>
            <span>
              Target: <strong className="text-ink-soft">{definition?.targetRepsMin}–{definition?.targetRepsMax} reps</strong>
            </span>
            <span>•</span>
            <span>
              Rest: <strong className="text-accent-ink">{definition?.defaultRestSeconds || 90}s</strong>
            </span>
          </div>
        </div>

        {/* The first session has no history, so no status is shown for it. */}
        {recommendation && recommendation.status !== 'maintain' && <StatusBadge status={recommendation.status} />}
      </div>

      {recommendation && <OverloadGuidance recommendation={recommendation} />}

      {definition?.notes && (
        <div className="exercise-cue mb-4 text-xs font-medium text-warn-ink bg-warn-ink/10 border border-warn-ink/20 rounded-control px-3 py-2 flex items-center space-x-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{definition.notes}</span>
        </div>
      )}

      <div className="set-list space-y-3">
        <div className="set-header grid grid-cols-12 gap-2 section-label text-ink-faint px-2">
          <div className="col-span-2 text-center">Set</div>
          <div className="col-span-4 text-center">Load (kg)</div>
          <div className="col-span-4 text-center">Reps</div>
          <div className="col-span-2 text-center">Done</div>
        </div>

        {log.sets.map((set, setIdx) => (
          <SetRow
            key={set.setNumber}
            set={set}
            equipment={equipment}
            onToggle={() => onToggleSet(setIdx)}
            onChange={change => onChangeSet(setIdx, change)}
          />
        ))}
      </div>

      <div className="set-actions flex items-center justify-between mt-4 pt-3 border-t border-line">
        <button
          onClick={onAddSet}
          disabled={log.sets.length >= LIMITS.setNumber.max}
          className="flex items-center space-x-1.5 text-xs font-bold text-accent-ink py-1.5 px-3 bg-accent-ink/10 hover:bg-accent-ink/20 rounded-control transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Set</span>
        </button>

        {log.sets.length > 1 && (
          <button
            onClick={onRemoveLastSet}
            className="flex items-center space-x-1 text-xs font-semibold text-ink-faint hover:text-bad-ink py-1 px-2 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Set</span>
          </button>
        )}
      </div>

      <div className="exercise-notes mt-3 pt-2">
        <textarea
          rows={1}
          value={log.notes || ''}
          onChange={event => onNotesChange(event.target.value)}
          maxLength={MAX_NOTES_LENGTH}
          aria-label={`Notes for ${log.exerciseName}`}
          placeholder="Notes for this exercise (e.g., grip, form cues, RPE)..."
          className="field block w-full resize-none whitespace-nowrap overflow-hidden bg-inset/60 rounded-control px-3 py-1.5 text-base sm:text-xs text-ink-soft"
        />
      </div>
    </div>
  );
}

// "4 × 6–8 @ 62.5 kg": the whole target in one line. Only themes that set it in large type show
// it; the others give the same numbers in the line below and in the guidance panel.
function Prescription({ definition, weightKg }: { definition: ExerciseDefinition; weightKg: number }) {
  return (
    <p className="exercise-prescription hidden mt-1 font-display text-2xl text-accent-ink uppercase">
      {definition.targetSets} × {definition.targetRepsMin}–{definition.targetRepsMax}
      {weightKg > 0 && ` @ ${weightKg} kg`}
    </p>
  );
}

function OverloadGuidance({ recommendation }: { recommendation: ProgressRecommendation }) {
  return (
    <div className="exercise-guidance panel bg-inset/70 p-3.5 mb-5 flex items-start space-x-3">
      <div className="p-2 bg-accent-ink/10 rounded-control text-accent-ink mt-0.5">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="flex-1 text-xs">
        <div className="flex items-center justify-between text-ink-muted mb-1">
          <span>
            Last Performance: <strong className="text-ink-soft">{recommendation.lastRepsSummary}</strong>
          </span>
          <span>
            Target: <strong className="text-accent-ink">{recommendation.recommendedWeightKg} kg</strong>
          </span>
        </div>
        <p className="text-ink-soft font-medium leading-relaxed">{recommendation.nextStepGoal}</p>
      </div>
    </div>
  );
}
