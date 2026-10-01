// Turns the design tokens into the CSS custom properties the Tailwind token classes read.
import type { DesignTokens } from './tokens.ts';

export function tokenStylesheet(design: DesignTokens): string {
  return `:root { ${tokenDeclarations(design).join(' ')} }`;
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

function tokenDeclarations(design: DesignTokens): string[] {
  return [
    ...Object.entries(design.colors).map(([token, hex]) => `--c-${token}: ${hexToChannels(hex)};`),
    `--font-display: ${design.fonts.display};`,
    `--font-body: ${design.fonts.body};`,
    `--font-data: ${design.fonts.data};`,
    ...Object.entries(design.radius).map(([name, value]) => `--radius-${name}: ${value};`),
    `--tap: ${design.tapSize};`,
    `--tap-lg: ${design.tapSizeLarge};`,
    `--flip: ${design.flipMs}ms;`,
    'color-scheme: dark;'
  ];
}
