import React, { useState } from 'react';
import { X, RotateCcw, Check, Database } from 'lucide-react';
import { StorageService, type SyncStatus } from '../../services/storage.ts';
import type { ExerciseDefinition } from '../../types/workout.ts';
import { hasValidRepRange } from '../../validation.ts';
import { describeSyncStatus, syncLabel } from '../syncStatusText.ts';
import { BackupSection } from './BackupSection.tsx';

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
  const [activeTab, setActiveTab] = useState<'data' | 'exercises'>('data');
  const [exerciseList, setExerciseList] = useState<ExerciseDefinition[]>(exercises);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUpdateExercise = (
    id: string,
    field: 'targetRepsMin' | 'targetRepsMax' | 'targetSets' | 'defaultRestSeconds',
    val: number
  ) => {
    setExerciseList(prev =>
      prev.map(ex => (ex.id === id ? { ...ex, [field]: Math.max(1, val) } : ex))
    );
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Settings & Data Management</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'data'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Data & Backup
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'exercises'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Exercise Targets
          </button>
        </div>

        {activeTab === 'data' ? (
          <div className="space-y-4">
            {/* Local Database Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">Local Database</h4>
                </div>
                <span
                  className={`flex items-center space-x-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    syncStatus.connected
                      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
                      : 'text-amber-300 bg-amber-950/60 border-amber-800/60'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${syncStatus.connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>{syncLabel(syncStatus)}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">{describeSyncStatus(syncStatus)}</p>
              <div className="text-[11px] text-slate-500 space-y-1 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/50">
                <div className="flex justify-between items-center">
                  <span>SQLite File:</span>
                  <span className="font-mono text-indigo-300 font-medium">data/gymmy.db</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Browser Store:</span>
                  <span className="font-mono text-slate-300">localStorage</span>
                </div>
              </div>
            </div>

            <BackupSection />

            {/* Clear All Workouts for Clean Slate */}
            <div className="bg-slate-950 border border-rose-900/30 rounded-2xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <h4 className="text-sm font-bold text-rose-300">Clean Slate: Clear All Workouts</h4>
              </div>
              <p className="text-xs text-slate-400 mb-4">
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
                className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 text-xs font-bold rounded-xl transition active:scale-95"
              >
                Clear Workout History (Clean Slate)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Fine-tune the target rep ranges, sets, and rest timers for your exercises:
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {exerciseList.map(ex => (
                <div
                  key={ex.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{ex.name}</span>
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                      {ex.workoutType}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Target Sets</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={ex.targetSets}
                        onChange={e => handleUpdateExercise(ex.id, 'targetSets', parseInt(e.target.value) || 3)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 font-mono text-base sm:text-xs text-center text-white"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Min Reps</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={ex.targetRepsMin}
                        onChange={e => handleUpdateExercise(ex.id, 'targetRepsMin', parseInt(e.target.value) || 6)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 font-mono text-base sm:text-xs text-center text-white"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Max Reps</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={ex.targetRepsMax}
                        onChange={e => handleUpdateExercise(ex.id, 'targetRepsMax', parseInt(e.target.value) || 12)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 font-mono text-base sm:text-xs text-center text-white"
                      />
                    </div>
                  </div>

                  {!hasValidRepRange(ex) && (
                    <p role="alert" className="text-[11px] font-semibold text-rose-400">
                      Min reps ({ex.targetRepsMin}) is higher than max reps ({ex.targetRepsMax}).
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={saveExerciseAdjustments}
              disabled={hasInvalidRepRange}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition ${
                hasInvalidRepRange
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
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
      </div>
    </div>
  );
};
