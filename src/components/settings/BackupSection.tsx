import { useState, type ChangeEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import { createBackup, describeImportPlan, hasChanges, planImport, type ImportPlan } from '../../services/backup.ts';
import { downloadBackup, readBackupFile } from '../../services/backupFile.ts';
import { StorageService } from '../../services/storage.ts';

type RestoreState =
  | { step: 'idle' }
  | { step: 'error'; message: string }
  | { step: 'review'; fileName: string; exportedAt: string; plan: ImportPlan }
  | { step: 'done'; message: string };

// Download a backup, or restore one after reviewing what it would change.
export function BackupSection() {
  const [restore, setRestore] = useState<RestoreState>({ step: 'idle' });

  const handleDownload = () => {
    downloadBackup(createBackup(StorageService.getSnapshot(), new Date()));
  };

  const handleFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cleared so picking the same file again still fires onChange.
    event.target.value = '';
    if (!file) return;

    const parsed = await readBackupFile(file);
    if (!parsed.ok) {
      setRestore({ step: 'error', message: `Could not read ${file.name}: ${parsed.error}` });
      return;
    }
    const plan = planImport(StorageService.getSnapshot(), parsed.value);
    setRestore({ step: 'review', fileName: file.name, exportedAt: parsed.value.exportedAt, plan });
  };

  const handleImport = (plan: ImportPlan) => {
    StorageService.applyImport(plan);
    setRestore({ step: 'done', message: `Imported. ${describeImportPlan(plan)}` });
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center space-x-3 mb-2">
        <Download className="w-5 h-5 text-indigo-400" />
        <h4 className="text-sm font-bold text-white">Backup and Restore</h4>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        A JSON file with every workout and your exercise targets. Restoring adds new workouts and updates changed ones; it
        never deletes anything.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center space-x-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
        >
          <Download className="w-4 h-4" />
          <span>Download Backup</span>
        </button>

        <label className="flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>Restore Backup</span>
          <input type="file" accept="application/json,.json" className="hidden" onChange={handleFileChosen} />
        </label>
      </div>

      {restore.step === 'error' && (
        <p role="alert" className="mt-3 text-xs font-semibold text-rose-400">
          {restore.message}
        </p>
      )}

      {restore.step === 'review' && (
        <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <p className="text-xs text-slate-300">
            <strong className="text-white">{restore.fileName}</strong>, exported{' '}
            {new Date(restore.exportedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}:{' '}
            {describeImportPlan(restore.plan)}
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setRestore({ step: 'idle' })}
              className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleImport(restore.plan)}
              disabled={!hasChanges(restore.plan)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg transition bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              Import
            </button>
          </div>
        </div>
      )}

      {restore.step === 'done' && <p className="mt-3 text-xs font-semibold text-emerald-400">{restore.message}</p>}
    </div>
  );
}
