import type { ReactNode } from 'react';
import { X, type LucideIcon } from 'lucide-react';

interface DialogProps {
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg';
  onBackdropClick?: () => void;
  className?: string;
}

const WIDTH = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

// The overlay and card every modal uses.
export function Dialog({ children, width = 'md', onBackdropClick, className = '' }: DialogProps) {
  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={event => event.stopPropagation()}
        className={`card p-6 w-full max-h-[90vh] overflow-y-auto shadow-2xl relative ${WIDTH[width]} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

interface DialogHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onClose: () => void;
}

export function DialogHeader({ title, subtitle, icon: Icon, onClose }: DialogHeaderProps) {
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
