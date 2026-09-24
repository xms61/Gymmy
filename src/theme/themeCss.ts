// Turns the themes into the CSS custom properties the Tailwind token classes read.
import type { Theme } from './themes.ts';

export function themeStylesheet(themes: readonly Theme[]): string {
  return themes.map(themeRules).join('\n');
}

// Runs in <head> before the first paint: applies the theme stored on this device, so the page
// never flashes the default theme first. Unknown or unreadable values keep the default.
export function themeBootScript(themes: readonly Theme[], storageKey: string): string {
  const backgrounds = Object.fromEntries(themes.map(theme => [theme.id, theme.colors.bg]));
  return (
    `try{var b=${JSON.stringify(backgrounds)},t=localStorage.getItem(${JSON.stringify(storageKey)});` +
    `if(Object.prototype.hasOwnProperty.call(b,t)){document.documentElement.setAttribute('data-theme',t);` +
    `var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',b[t])}}catch(e){}`
  );
}

// Colors are written as "r g b" channels so Tailwind's /opacity modifiers keep working.
export function hexToChannels(hex: string): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) throw new Error(`Not a #rrggbb color: ${hex}`);
  return match
    .slice(1)
    .map(part => parseInt(part, 16))
    .join(' ');
}

function themeRules(theme: Theme): string {
  const selector = `[data-theme="${theme.id}"]`;
  const rules = [`${selector} { ${themeDeclarations(theme).join(' ')} }`];
  if (theme.motionMs === 0) {
    rules.push(`${selector} *, ${selector} *::before, ${selector} *::after { animation: none !important; transition: none !important; }`);
  }
  return rules.join('\n');
}

function themeDeclarations(theme: Theme): string[] {
  return [
    ...Object.entries(theme.colors).map(([token, hex]) => `--c-${token}: ${hexToChannels(hex)};`),
    `--font-display: ${theme.fonts.display};`,
    `--font-body: ${theme.fonts.body};`,
    `--font-data: ${theme.fonts.data};`,
    ...Object.entries(theme.radius).map(([name, value]) => `--radius-${name}: ${value};`),
    `--border-width: ${theme.borderWidth};`,
    `--border-style: ${theme.borderStyle};`,
    `--tap: ${theme.tapSize};`,
    `--tap-lg: ${theme.tapSizeLarge};`,
    `--motion: ${theme.motionMs}ms;`,
    `color-scheme: ${theme.colorScheme};`
  ];
}
