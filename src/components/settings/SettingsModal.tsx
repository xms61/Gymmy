import React, { useState } from 'react';
import { RotateCcw, Check, Database } from 'lucide-react';
import { StorageService, type SyncStatus } from '../../services/storage.ts';
import type { ExerciseDefinition } from '../../types/workout.ts';
import { clampTo, hasValidRepRange, LIMITS } from '../../validation.ts';
import { describeSyncStatus, syncLabel } from '../syncStatusText.ts';
import { BackupSection } from './BackupSection.tsx';
import { Dialog, DialogHeader } from '../ui/Dialog.tsx';

type SettingsTab = 'data' | 'exercises';

// The fallback is used when the field is cleared, and every value is clamped to the limits the server accepts.
const TARGET_FIELDS = [
  { field: 'targetSets', label: 'Target Sets', rule: LIMITS.targetSets, fallback: 3 },
  { field: 'targetRepsMin', label: 'Min Reps', rule: LIMITS.repRange, fallback: 6 },
  { field: 'targetRepsMax', label: 'Max Reps', rule: LIMITS.repRange, fallback: 12 }
] as const;

type TargetField = (typeof TARGET_FIELDS)[number]['field'];

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: 'data', label: 'Data & Backup' },
  { id: 'exercises', label: 'Exercise Targets' }
];

interface SettingsModalProps {
  exercises: ExerciseDefinition[];
  syncStatus: SyncStatus;
  onClose: () => void;
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  exercises,
  syncStatus,
  onClose,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('data');
  const [exerciseList, setExerciseList] = useState<ExerciseDefinition[]>(exercises);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUpdateExercise = (id: string, field: TargetField, value: number) => {
    setExerciseList(prev => prev.map(ex => (ex.id === id ? { ...ex, [field]: value } : ex)));
  };

  const hasInvalidRepRange = exerciseList.some(ex => !hasValidRepRange(ex));

  const saveExerciseAdjustments = () => {
    if (hasInvalidRepRange) return;
    StorageService.saveExerciseDefinitions(exerciseList);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    onRefreshData();
  };

  return (
    <Dialog width="lg">
      <DialogHeader title="Settings & Data Management" onClose={onClose} />

        {/* Tab Toggle */}
        <div className="panel flex items-center space-x-2 p-1.5 mb-6">
          {SETTINGS_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-control text-xs font-bold transition ${
                activeTab === tab.id ? 'bg-accent text-on-accent shadow-md' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'data' ? (
          <div className="space-y-4">
            {/* Local Database Card */}
            <div className="panel p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-accent-ink" />
                  <h4 className="text-sm font-bold text-ink">Local Database</h4>
                </div>
                <span
                  className={`flex items-center space-x-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-pill border ${
                    syncStatus.connected
                      ? 'text-good-ink bg-good-ink/10 border-good-ink/40'
                      : 'text-warn-ink bg-warn-ink/10 border-warn-ink/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-pill ${syncStatus.connected ? 'bg-good-ink' : 'bg-warn-ink'}`} />
                  <span>{syncLabel(syncStatus)}</span>
                </span>
              </div>
              <p className="text-xs text-ink-muted mb-3">{describeSyncStatus(syncStatus)}</p>
              <div className="text-[11px] text-ink-faint space-y-1 bg-surface/50 p-2.5 rounded-control border border-line">
                <div className="flex justify-between items-center">
                  <span>SQLite File:</span>
                  <span className="font-mono text-accent-ink font-medium">data/gymmy.db</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Browser Store:</span>
                  <span className="font-mono text-ink-soft">localStorage</span>
                </div>
              </div>
            </div>

            <BackupSection />

            {/* Clear All Workouts for Clean Slate */}
            <div className="panel border-bad-ink/30 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <RotateCcw className="w-5 h-5 text-bad-ink" />
                <h4 className="text-sm font-bold text-bad-ink">Clean Slate: Clear All Workouts</h4>
              </div>
              <p className="text-xs text-ink-muted mb-4">
                Wipe all completed workout sessions and history for a completely fresh start. Exercise definitions and baseline targets are kept.
              </p>

              <button
                onClick={() => {
                  if (window.confirm('Clear all logged workout sessions? This will give you a clean slate for your stats.')) {
                    StorageService.clearAllSessions();
                    onRefreshData();
                    alert('All workout history was cleared.');
                    onClose();
                  }
                }}
                className="btn btn-danger w-full py-2.5 text-xs"
              >
                Clear Workout History (Clean Slate)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-ink-muted">
              Fine-tune the target rep ranges, sets, and rest timers for your exercises:
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {exerciseList.map(ex => (
                <div
                  key={ex.id}
                  className="panel p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-soft">{ex.name}</span>
                    <span className="text-[10px] font-semibold text-accent-ink uppercase tracking-wider">
                      {ex.workoutType}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {TARGET_FIELDS.map(({ field, label, rule, fallback }) => (
                      <label key={field} className="block">
                        <span className="text-[10px] text-ink-faint block mb-1">{label}</span>
                        <input
                          type="number"
                          min={rule.min}
                          max={rule.max}
                          value={ex[field]}
                          onChange={e => handleUpdateExercise(ex.id, field, clampTo(rule, parseInt(e.target.value) || fallback))}
                          className="field w-full p-1.5 font-mono text-base sm:text-xs text-center"
                        />
                      </label>
                    ))}
                  </div>

                  {!hasValidRepRange(ex) && (
                    <p role="alert" className="text-[11px] font-semibold text-bad-ink">
                      Min reps ({ex.targetRepsMin}) is higher than max reps ({ex.targetRepsMax}).
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={saveExerciseAdjustments}
              disabled={hasInvalidRepRange}
              className="btn btn-good w-full py-3 text-sm"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved</span>
                </>
              ) : (
                <span>{hasInvalidRepRange ? 'Fix the rep ranges to save' : 'Save Target Adjustments'}</span>
              )}
            </button>
          </div>
        )}
    </Dialog>
  );
};
