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
    <div className="panel p-4">
      <div className="flex items-center space-x-3 mb-2">
        <Download className="w-5 h-5 text-accent-ink" />
        <h4 className="text-sm font-bold text-ink">Backup and Restore</h4>
      </div>
      <p className="text-xs text-ink-muted mb-4">
        A JSON file with every workout and your exercise targets. Restoring adds new workouts and updates changed ones; it
        never deletes anything.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleDownload}
          className="btn btn-secondary py-2.5 text-xs"
        >
          <Download className="w-4 h-4" />
          <span>Download Backup</span>
        </button>

        <label className="btn btn-primary py-2.5 text-xs cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>Restore Backup</span>
          <input type="file" accept="application/json,.json" className="hidden" onChange={handleFileChosen} />
        </label>
      </div>

      {restore.step === 'error' && (
        <p role="alert" className="mt-3 text-xs font-semibold text-bad-ink">
          {restore.message}
        </p>
      )}

      {restore.step === 'review' && (
        <div className="mt-3 p-3 bg-surface border border-line rounded-control space-y-3">
          <p className="text-xs text-ink-soft">
            <strong className="text-ink">{restore.fileName}</strong>, exported{' '}
            {new Date(restore.exportedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}:{' '}
            {describeImportPlan(restore.plan)}
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setRestore({ step: 'idle' })}
              className="px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink rounded-chip transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleImport(restore.plan)}
              disabled={!hasChanges(restore.plan)}
              className="btn btn-good px-3 py-1.5 text-xs rounded-chip"
            >
              Import
            </button>
          </div>
        </div>
      )}

      {restore.step === 'done' && <p className="mt-3 text-xs font-semibold text-good-ink">{restore.message}</p>}
    </div>
  );
}
