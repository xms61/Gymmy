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
    <section aria-labelledby="backup-heading" className="grid gap-3">
      <h3 id="backup-heading" className="text-2xl text-ink border-b border-line pb-2">
        Backup and restore
      </h3>
      <p className="text-base text-ink-soft">
        A JSON file with every workout and your exercise targets. Restoring adds new workouts and updates changed ones; it never
        deletes anything.
      </p>

      <div className="flex flex-wrap gap-2">
        <button onClick={handleDownload} className="btn btn-secondary h-tap-lg px-4 text-base border border-edge">
          <Download className="w-4 h-4" />
          Download backup
        </button>
        <label className="btn btn-secondary h-tap-lg px-4 text-base border border-edge cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
          <Upload className="w-4 h-4" />
          Restore backup
          <input type="file" accept="application/json,.json" className="sr-only" onChange={handleFileChosen} />
        </label>
      </div>

      {restore.step === 'error' && (
        <p role="alert" className="text-base text-bad-ink">
          {restore.message}
        </p>
      )}

      {restore.step === 'review' && (
        <div className="grid gap-3 border-y border-line bg-surface px-3 py-3">
          <p className="text-base text-ink-soft">
            <strong className="text-ink">{restore.fileName}</strong>, exported{' '}
            {new Date(restore.exportedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}:{' '}
            {describeImportPlan(restore.plan)}
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setRestore({ step: 'idle' })} className="btn btn-secondary h-tap px-4 text-sm border border-edge">
              Cancel
            </button>
            <button onClick={() => handleImport(restore.plan)} disabled={!hasChanges(restore.plan)} className="btn btn-good h-tap px-4 text-sm">
              Import
            </button>
          </div>
        </div>
      )}

      {restore.step === 'done' && <p className="text-base text-good-ink">{restore.message}</p>}
    </section>
  );
}
