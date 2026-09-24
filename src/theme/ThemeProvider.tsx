import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { THEME_STORAGE_KEY, THEMES, type Theme, type ThemeId } from './themes.ts';
import { applyTheme, readStoredThemeId, storeThemeId } from './themePreference.ts';

interface ThemeContextValue {
  theme: Theme;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState(readStoredThemeId);
  const theme = THEMES[themeId];

  useEffect(() => applyTheme(theme), [theme]);

  // A theme picked in another tab applies here too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) setThemeIdState(readStoredThemeId());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    storeThemeId(id);
    setThemeIdState(id);
  }, []);

  const value = useMemo(() => ({ theme, setThemeId }), [theme, setThemeId]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme() needs a ThemeProvider above it');
  return value;
}
