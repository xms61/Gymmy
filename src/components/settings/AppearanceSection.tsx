import { useRef, type KeyboardEvent } from 'react';
import { Check } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider.tsx';
import { THEME_IDS, THEMES, type Theme } from '../../theme/themes.ts';

const ARROW_STEP: Record<string, 1 | -1> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

// Picking a theme applies it at once. Arrow keys move through the choices, like any radio group.
export function AppearanceSection() {
  const { theme, setThemeId } = useTheme();
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = ARROW_STEP[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = (index + step + THEME_IDS.length) % THEME_IDS.length;
    setThemeId(THEME_IDS[next]!);
    optionRefs.current[next]?.focus();
  };

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {THEME_IDS.map((id, index) => {
          const checked = id === theme.id;
          return (
            <button
              key={id}
              ref={element => {
                optionRefs.current[index] = element;
              }}
              role="radio"
              aria-checked={checked}
              aria-label={THEMES[id].label}
              tabIndex={checked ? 0 : -1}
              onClick={() => setThemeId(id)}
              onKeyDown={event => onKeyDown(event, index)}
              className={`text-left rounded-panel p-1 border-2 transition ${checked ? 'border-accent-ink' : 'border-transparent hover:border-edge'}`}
            >
              <ThemeSample theme={THEMES[id]} />
            </button>
          );
        })}
      </div>
      <p className="text-xs text-ink-muted">Stored on this device. Other devices keep their own theme.</p>
    </div>
  );
}

// A small sample drawn in the theme's own tokens. It uses token classes only, so rules written
// for a theme's components in index.css never reach it.
function ThemeSample({ theme }: { theme: Theme }) {
  return (
    <div data-theme={theme.id} className="bg-bg text-ink-soft font-sans rounded-card border border-line p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-lg text-ink leading-tight">{theme.label}</span>
        <span className="px-2 py-0.5 rounded-pill bg-push text-on-split text-[10px] font-bold uppercase">Push</span>
      </div>
      <div className="bg-surface border border-line rounded-panel p-2 flex items-center gap-2">
        <span className="font-mono font-bold text-sm text-ink">62.5 kg × 8</span>
        <span className="ml-auto w-6 h-6 rounded-control bg-good text-on-good flex items-center justify-center">
          <Check className="w-4 h-4" />
        </span>
      </div>
      <span className="block rounded-control bg-accent text-on-accent text-xs font-bold text-center py-1.5">Start Push</span>
      <p className="text-xs text-ink-muted">{theme.description}</p>
    </div>
  );
}
