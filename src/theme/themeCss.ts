// Turns the themes into the CSS custom properties the Tailwind token classes read.
import type { Theme } from './themes.ts';

export function themeStylesheet(themes: readonly Theme[]): string {
  return themes.map(themeRules).join('\n');
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
    `--motion: ${theme.motionMs}ms;`,
    `color-scheme: ${theme.colorScheme};`
  ];
}
