// The theme chosen on this device, kept in localStorage rather than on the server, so a phone
// and a laptop can use different themes.
import { DEFAULT_THEME_ID, parseThemeId, THEME_STORAGE_KEY, type Theme, type ThemeId } from './themes.ts';

export function readStoredThemeId(): ThemeId {
  try {
    return parseThemeId(localStorage.getItem(THEME_STORAGE_KEY)) ?? DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID; // the browser blocks storage for this page
  }
}

export function storeThemeId(id: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch (err) {
    console.error('[Theme] Could not save the theme choice', err);
  }
}

// Sets the theme on <html>, and the browser's toolbar color to the theme's background.
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme.id);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.bg);
}
