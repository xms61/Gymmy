import { Download, X } from 'lucide-react';
import { StorageService } from '../../services/storage.ts';
import { downloadJson } from '../../services/backupFile.ts';
import { toLocalDateString } from '../../utils/date.ts';

// Changes the server refused (400, 413 or 415). They never reached the database, so the only copy
// is in this browser: offer it as a file before it can be dismissed.
export function RefusedChanges({ count }: { count: number }) {
  const handleDownload = () => {
    downloadJson(`gymmy-refused-changes-${toLocalDateString(new Date())}.json`, StorageService.getRejectedChanges());
  };

  const handleDismiss = () => {
    const noun = count === 1 ? 'this refused change' : `these ${count} refused changes`;
    if (window.confirm(`Dismiss ${noun}? Download them first if you may need them.`)) StorageService.dismissRejectedChanges();
  };

  return (
    <div role="alert" className="mb-3 p-3 rounded-control border border-warn-ink/40 bg-warn-ink/10 space-y-2">
      <p className="text-xs text-warn-ink font-semibold">
        The server refused {count === 1 ? '1 change' : `${count} changes`}, so {count === 1 ? 'it is' : 'they are'} not in
        data/gymmy.db. This browser keeps a copy.
      </p>
      <div className="flex gap-2">
        <button onClick={handleDownload} className="btn btn-secondary px-3 py-1.5 text-xs">
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>
        <button onClick={handleDismiss} className="btn px-3 py-1.5 text-xs text-ink-muted hover:text-ink">
          <X className="w-3.5 h-3.5" />
          <span>Dismiss</span>
        </button>
      </div>
    </div>
  );
}
