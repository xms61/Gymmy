import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, type ColorToken } from '../src/theme/themes.ts';
import { hexToChannels, themeStylesheet } from '../src/theme/themeCss.ts';

test('writes colors as rgb channels so Tailwind opacity modifiers work', () => {
  const CASES: [hex: string, expected: string][] = [
    ['#3DD6F5', '61 214 245'],
    ['#090d16', '9 13 22'],
    ['#FFFFFF', '255 255 255']
  ];
  for (const [hex, expected] of CASES) {
    assert.equal(hexToChannels(hex), expected);
  }
});

test('refuses a color that is not #rrggbb', () => {
  for (const hex of ['#FFF', 'FFFFFF', '#GG0000', 'rgb(0 0 0)']) {
    assert.throws(() => hexToChannels(hex), /Not a #rrggbb color/, hex);
  }
});

test('scopes every theme to its data-theme attribute', () => {
  const css = themeStylesheet(Object.values(THEMES));
  for (const theme of Object.values(THEMES)) {
    assert.match(css, new RegExp(`\\[data-theme="${theme.id}"\\] \\{[^}]*--c-bg: ${hexToChannels(theme.colors.bg)};`));
  }
});

test('turns off animations only for a theme without motion', () => {
  const still = { ...THEMES.classic, motionMs: 0 };
  assert.match(themeStylesheet([still]), /animation: none !important/);
  assert.doesNotMatch(themeStylesheet([THEMES.classic]), /animation: none/);
});

// WCAG 2 contrast ratio between two #rrggbb colors.
function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex: string): number {
  const [r, g, b] = hexToChannels(hex).split(' ').map(channel => {
    const value = Number(channel) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Text needs 4.5:1 (WCAG AA). Placeholders and the edges of inputs and buttons need 3:1.
const CONTRAST_RULES: [foreground: ColorToken, background: ColorToken, minimum: number][] = [
  ['ink', 'bg', 4.5],
  ['ink', 'surface', 4.5],
  ['ink-soft', 'surface', 4.5],
  ['ink-muted', 'surface', 4.5],
  ['ink-muted', 'inset', 4.5],
  ['accent-ink', 'surface', 4.5],
  ['good-ink', 'surface', 4.5],
  ['warn-ink', 'surface', 4.5],
  ['bad-ink', 'surface', 4.5],
  ['info-ink', 'surface', 4.5],
  ['on-accent', 'accent', 4.5],
  ['on-good', 'good', 4.5],
  ['on-split', 'push', 4.5],
  ['on-split', 'pull', 4.5],
  ['on-split', 'legs', 4.5],
  ['on-split', 'other', 4.5],
  ['on-plate', 'plate-25', 4.5],
  ['on-plate', 'plate-20', 4.5],
  ['on-plate-light', 'plate-15', 4.5],
  ['on-plate', 'plate-10', 4.5],
  ['on-plate-light', 'plate-5', 4.5],
  ['on-plate', 'plate-2-5', 4.5],
  ['on-plate', 'plate-1-25', 4.5],
  ['ink-faint', 'surface', 3],
  ['edge', 'surface', 3]
];

test('every theme keeps its text and edges readable', () => {
  for (const theme of Object.values(THEMES)) {
    for (const [foreground, background, minimum] of CONTRAST_RULES) {
      const ratio = contrastRatio(theme.colors[foreground], theme.colors[background]);
      assert.ok(ratio >= minimum, `${theme.id}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1, needs ${minimum}:1`);
    }
  }
});
