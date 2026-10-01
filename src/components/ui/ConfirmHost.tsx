import { useEffect, useState } from 'react';
import { Dialog } from './Dialog.tsx';

interface Request {
  message: string;
  confirmLabel: string | null; // null: a notice with only OK
  danger: boolean;
  resolve: (confirmed: boolean) => void;
}

let show: ((request: Request) => void) | null = null;

// Asks in a dialog on the page instead of the browser's confirm box, which some browsers and
// embedded views never show (they answer "no" at once). Resolves true only for the confirm button.
export function askToConfirm(message: string, confirmLabel: string, { danger = true } = {}): Promise<boolean> {
  return new Promise(resolve => {
    if (!show) return resolve(false);
    show({ message, confirmLabel, danger, resolve });
  });
}

// A message with only OK, in place of the browser's alert box.
export function showNotice(message: string): Promise<void> {
  return new Promise(resolve => {
    if (!show) return resolve();
    show({ message, confirmLabel: null, danger: false, resolve: () => resolve() });
  });
}

// Mounted once at the root; renders whichever request is open.
export function ConfirmHost() {
  const [request, setRequest] = useState<Request | null>(null);
  useEffect(() => {
    show = setRequest;
    return () => {
      show = null;
    };
  }, []);
  if (!request) return null;

  const answer = (confirmed: boolean) => {
    setRequest(null);
    request.resolve(confirmed);
  };

  return (
    <Dialog width="sm" onClose={() => answer(false)} onBackdropClick={() => answer(false)}>
      <p role="alert" className="text-lg leading-snug text-ink">
        {request.message}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        {request.confirmLabel === null ? (
          <button onClick={() => answer(true)} className="btn btn-good h-tap-lg px-6 text-base">
            OK
          </button>
        ) : (
          <>
            <button onClick={() => answer(false)} className="btn btn-secondary h-tap-lg px-5 text-base border border-edge">
              Cancel
            </button>
            <button onClick={() => answer(true)} className={`btn h-tap-lg px-5 text-base ${request.danger ? 'btn-danger' : 'btn-good'}`}>
              {request.confirmLabel}
            </button>
          </>
        )}
      </div>
    </Dialog>
  );
}
