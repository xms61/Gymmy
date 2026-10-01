import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { StorageService } from '../../services/storage.ts';
import type { SyncStatus } from '../../services/sync.ts';
import type { ExerciseDefinition } from '../../types/workout.ts';
import { ROTATION } from '../../services/rotation.ts';
import { clampTo, hasValidRepRange, LIMITS } from '../../validation.ts';
import { describeSyncStatus, needsAttention, syncLabel } from '../syncStatusText.ts';
import { RouteMarker } from '../ui/badges.tsx';
import { askToConfirm, showNotice } from '../ui/ConfirmHost.tsx';
import { BackupSection } from './BackupSection.tsx';
import { RefusedChanges } from './RefusedChanges.tsx';

// The fallback is used when the field is cleared, and every value is clamped to the limits the server accepts.
const TARGET_FIELDS = [
  { field: 'targetSets', label: 'Sets', rule: LIMITS.targetSets, fallback: 3 },
  { field: 'targetRepsMin', label: 'Min reps', rule: LIMITS.repRange, fallback: 6 },
  { field: 'targetRepsMax', label: 'Max reps', rule: LIMITS.repRange, fallback: 12 }
] as const;

type TargetField = (typeof TARGET_FIELDS)[number]['field'];

interface SettingsViewProps {
  exercises: ExerciseDefinition[];
  syncStatus: SyncStatus;
  onRefreshData: () => void;
  onUnsavedChange: (unsaved: boolean) => void; // so leaving the screen can ask first
}

// Settings as a screen: every exercise's targets in one table, and the data and backup tools
// beside it.
export function SettingsView({ exercises, syncStatus, onRefreshData, onUnsavedChange }: SettingsViewProps) {
  return (
    <div className="grid grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] gap-12 items-start">
      <ExerciseTargets exercises={exercises} onSaved={onRefreshData} onUnsavedChange={onUnsavedChange} />
      <div className="grid gap-10">
        <SyncSection syncStatus={syncStatus} />
        <BackupSection />
        <ClearHistory onCleared={onRefreshData} />
      </div>
    </div>
  );
}

interface ExerciseTargetsProps {
  exercises: ExerciseDefinition[];
  onSaved: () => void;
  onUnsavedChange: (unsaved: boolean) => void;
}

function ExerciseTargets({ exercises, onSaved, onUnsavedChange }: ExerciseTargetsProps) {
  const [edited, setEdited] = useState(exercises);
  const [saved, setSaved] = useState(false);
  const unsaved = edited.some((ex, i) => TARGET_FIELDS.some(({ field }) => ex[field] !== exercises[i]?.[field]));
  useEffect(() => onUnsavedChange(unsaved), [unsaved, onUnsavedChange]);
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  const update = (id: string, field: TargetField, value: number) => {
    setEdited(prev => prev.map(ex => (ex.id === id ? { ...ex, [field]: value } : ex)));
  };
  const invalid = edited.some(ex => !hasValidRepRange(ex));
  const save = () => {
    if (invalid || !unsaved) return;
    StorageService.saveExerciseDefinitions(edited);
    setSaved(true);
    onSaved();
  };

  return (
    <section aria-labelledby="targets-heading" className="grid gap-4">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 id="targets-heading" className="text-5xl xl:text-[3.75rem] leading-[0.95] text-ink">
            Exercise targets
          </h2>
          <p className="mt-2 text-base text-ink-soft">The sets and rep range each exercise aims for. Load suggestions work from these.</p>
        </div>
        {/* Above the table, so it is in reach without scrolling past twelve rows. */}
        <button onClick={save} disabled={invalid || !unsaved} className="btn btn-good h-tap-lg text-lg px-6 flex-none">
          {saved && <Check className="w-5 h-5" strokeWidth={3} />}
          {saved ? 'Saved' : invalid ? 'Fix the rep ranges' : unsaved ? 'Save targets' : 'No changes'}
        </button>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="section-label font-semibold px-2 py-2">
              Exercise
            </th>
            {TARGET_FIELDS.map(({ field, label }) => (
              <th key={field} scope="col" className="section-label font-semibold px-2 py-2 w-28">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        {ROTATION.map(split => {
          const rows = edited.filter(ex => ex.workoutType === split);
          if (rows.length === 0) return null;
          return (
            <tbody key={split}>
              <tr>
                <th colSpan={4} scope="rowgroup" className="pt-5 pb-2 px-2 text-left">
                  <span className="flex items-center gap-2.5 font-display text-xl font-semibold uppercase tracking-[0.04em] text-ink">
                    <RouteMarker split={split} />
                    {split}
                  </span>
                </th>
              </tr>
              {rows.map(ex => (
                <TargetRow key={ex.id} exercise={ex} onChange={(field, value) => update(ex.id, field, value)} />
              ))}
            </tbody>
          );
        })}
      </table>
    </section>
  );
}

function TargetRow({ exercise, onChange }: { exercise: ExerciseDefinition; onChange: (field: TargetField, value: number) => void }) {
  const valid = hasValidRepRange(exercise);
  return (
    <>
      <tr className="border-t border-line">
        <th scope="row" className="px-2 py-2 font-display text-lg font-semibold uppercase tracking-[0.04em] text-ink-soft">
          {exercise.name}
        </th>
        {TARGET_FIELDS.map(({ field, label, rule, fallback }) => (
          <td key={field} className="px-2 py-2">
            <TargetInput
              value={exercise[field]}
              label={`${label}, ${exercise.name}`}
              invalid={!valid && field !== 'targetSets'}
              onCommit={text => onChange(field, clampTo(rule, parseInt(text) || fallback))}
            />
          </td>
        ))}
      </tr>
      {!valid && (
        <tr>
          <td colSpan={4} role="alert" className="px-2 pb-2 text-sm text-bad-ink">
            Min reps ({exercise.targetRepsMin}) is higher than max reps ({exercise.targetRepsMax}).
          </td>
        </tr>
      )}
    </>
  );
}

interface TargetInputProps {
  value: number;
  label: string;
  invalid: boolean;
  onCommit: (text: string) => void;
}

// Keeps what is typed as text until the field is left or a whole number is in it, so clearing a
// field to type a new value never snaps it to a default first.
function TargetInput({ value, label, invalid, onCommit }: TargetInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      type="number"
      inputMode="numeric"
      value={draft ?? value}
      onChange={event => {
        setDraft(event.target.value);
        if (/^\d+$/.test(event.target.value)) onCommit(event.target.value);
      }}
      onBlur={() => {
        if (draft !== null) onCommit(draft);
        setDraft(null);
      }}
      aria-label={label}
      aria-invalid={invalid}
      className={`field w-full h-tap px-2 text-center font-mono text-lg ${invalid ? 'border-bad-ink' : ''}`}
    />
  );
}

function SyncSection({ syncStatus }: { syncStatus: SyncStatus }) {
  return (
    <section aria-labelledby="sync-heading" className="grid gap-3">
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
        <h3 id="sync-heading" className="text-2xl text-ink">
          Data
        </h3>
        <span className={`font-display text-base font-semibold uppercase tracking-[0.06em] ${needsAttention(syncStatus) ? 'text-warn-ink' : 'text-good-ink'}`}>
          {syncLabel(syncStatus)}
        </span>
      </div>
      <p className="text-base text-ink-soft">{describeSyncStatus(syncStatus)}</p>
      {syncStatus.rejectedChanges > 0 && <RefusedChanges count={syncStatus.rejectedChanges} />}
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-base">
        <dt className="section-label self-center">Database</dt>
        <dd className="font-mono text-lg text-ink">data/gymmy.db</dd>
        <dt className="section-label self-center">Browser copy</dt>
        <dd className="font-mono text-lg text-ink">localStorage</dd>
      </dl>
    </section>
  );
}

function ClearHistory({ onCleared }: { onCleared: () => void }) {
  const clear = async () => {
    if (!(await askToConfirm('Clear all logged workout sessions? The server saves a copy of the database in data/ first.', 'Clear history'))) return;
    StorageService.clearAllSessions();
    onCleared();
    await showNotice('All workout history was cleared.');
  };
  return (
    <section aria-labelledby="clear-heading" className="grid gap-3">
      <h3 id="clear-heading" className="text-2xl text-ink border-b border-line pb-2">
        Clear history
      </h3>
      <p className="text-base text-ink-soft">
        Deletes every logged workout and keeps the exercise targets. The server saves a copy of the database in data/ first.
      </p>
      <button onClick={clear} className="btn btn-danger h-tap-lg text-base justify-self-start px-5">
        Clear workout history
      </button>
    </section>
  );
}
