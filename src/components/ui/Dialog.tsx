import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg';
  onClose: () => void; // Escape calls it
  onBackdropClick?: () => void;
  className?: string;
}

const WIDTH = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The overlay and card every modal uses.
export function Dialog({ children, width = 'md', onClose, onBackdropClick, className = '' }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useKeyboardFocus(panelRef, onClose);
  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 bg-bg/85 flex items-center justify-center p-4"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
        className={`card p-6 w-full max-h-[90vh] overflow-y-auto relative focus:outline-none ${WIDTH[width]} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

// Moves focus into the dialog, keeps Tab inside it, closes it on Escape, and gives focus back to
// whatever had it before, so every dialog works from the keyboard.
function useKeyboardFocus(panelRef: RefObject<HTMLDivElement | null>, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;
    panel?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      } else if (event.key === 'Tab' && panel) {
        keepTabInside(panel, event);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [panelRef]);
}

function keepTabInside(panel: HTMLElement, event: KeyboardEvent): void {
  const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) {
    event.preventDefault();
    return;
  }
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === panel)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

interface DialogHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

// The dialog's title at Headline size with one line under it, and a close button.
export function DialogHeader({ title, subtitle, onClose }: DialogHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 border-b border-line pb-3">
      <div>
        <h3 className="text-3xl leading-none text-ink">{title}</h3>
        {subtitle && <p className="mt-2 text-base text-ink-muted">{subtitle}</p>}
      </div>
      <button onClick={onClose} className="icon-btn" title="Close" aria-label="Close">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
