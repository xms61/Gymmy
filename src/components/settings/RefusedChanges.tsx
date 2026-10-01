import { Download, X } from 'lucide-react';
import { StorageService } from '../../services/storage.ts';
import { downloadJson } from '../../services/backupFile.ts';
import { toLocalDateString } from '../../utils/date.ts';
import { askToConfirm } from '../ui/ConfirmHost.tsx';

// Changes the server refused (400, 413 or 415). They never reached the database, so the only copy
// is in this browser: offer it as a file before it can be dismissed.
export function RefusedChanges({ count }: { count: number }) {
  const handleDownload = () => {
    downloadJson(`gymmy-refused-changes-${toLocalDateString(new Date())}.json`, StorageService.getRejectedChanges());
  };

  const handleDismiss = async () => {
    const noun = count === 1 ? 'this refused change' : `these ${count} refused changes`;
    if (await askToConfirm(`Dismiss ${noun}? Download them first if you may need them.`, 'Dismiss')) StorageService.dismissRejectedChanges();
  };

  return (
    <div role="alert" className="grid gap-3 border-y border-warn-ink/40 px-3 py-3">
      <p className="text-base text-warn-ink">
        The server refused {count === 1 ? '1 change' : `${count} changes`}, so {count === 1 ? 'it is' : 'they are'} not in
        data/gymmy.db. This browser keeps a copy.
      </p>
      <div className="flex gap-2">
        <button onClick={handleDownload} className="btn btn-secondary h-tap px-3 text-sm border border-edge">
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
        <button onClick={handleDismiss} className="btn btn-secondary h-tap px-3 text-sm border border-edge">
          <X className="w-4 h-4" />
          <span>Dismiss</span>
        </button>
      </div>
    </div>
  );
}
