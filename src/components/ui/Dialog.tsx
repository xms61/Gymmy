import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider.tsx';

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
  if (useTheme().theme.traits.dialogs === 'pane') {
    return (
      <div className="fixed inset-0 z-50 bg-bg overflow-y-auto">
        <div ref={panelRef} role="dialog" aria-modal="true" tabIndex={-1} className={`dialog-pane max-w-2xl mx-auto p-4 focus:outline-none ${className}`}>
          {children}
        </div>
      </div>
    );
  }
  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
        className={`card p-6 w-full max-h-[90vh] overflow-y-auto shadow-2xl relative focus:outline-none ${WIDTH[width]} ${className}`}
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
  icon?: LucideIcon;
  onClose: () => void;
}

export function DialogHeader({ title, subtitle, icon: Icon, onClose }: DialogHeaderProps) {
  if (useTheme().theme.traits.dialogs === 'pane') {
    return (
      <div className="flex items-baseline justify-between gap-4 mb-5 border-b border-line pb-2">
        <div>
          <h3 className="text-2xl text-ink">-- {title.toUpperCase()} --</h3>
          {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="text-xs text-ink-muted hover:text-ink flex-none" title="Close">
          [esc] close
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center space-x-2">
        {Icon && (
          <div className="p-2 bg-accent-ink/10 rounded-control text-accent-ink">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      <button onClick={onClose} className="icon-btn" title="Close">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
