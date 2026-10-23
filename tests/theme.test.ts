import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLOR_TOKENS, DESIGN, type ColorToken } from '../src/theme/tokens.ts';
import { hexToChannels, tokenStylesheet } from '../src/theme/tokensCss.ts';

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

test('puts every token on :root', () => {
  const css = tokenStylesheet(DESIGN);
  assert.match(css, /^:root \{/);
  for (const [token, hex] of Object.entries(DESIGN.colors)) {
    assert.ok(css.includes(`--c-${token}: ${hexToChannels(hex)};`), token);
  }
  assert.ok(css.includes(`--flip: ${DESIGN.flipMs}ms;`));
});

test('gives every color token a Tailwind color in the @theme block of index.css', () => {
  const indexCss = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  const themeBlock = /@theme inline reference \{([^}]*)\}/.exec(indexCss)?.[1] ?? '';
  const themeColors = [...themeBlock.matchAll(/--color-([a-z0-9-]+): rgb\(var\(--c-\1\)\);/g)].map(match => match[1]);
  assert.deepEqual(themeColors, [...COLOR_TOKENS]);
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
  // ink-faint is text only on bg and inset (set numbers, days of other months); on surface it is placeholder-only.
  ['ink-faint', 'inset', 4.5],
  ['ink-faint', 'bg', 4.5],
  ['ink-faint', 'surface', 3],
  ['edge', 'surface', 3]
];

test('text and edges stay readable', () => {
  for (const [foreground, background, minimum] of CONTRAST_RULES) {
    const ratio = contrastRatio(DESIGN.colors[foreground], DESIGN.colors[background]);
    assert.ok(ratio >= minimum, `${foreground} on ${background} is ${ratio.toFixed(2)}:1, needs ${minimum}:1`);
  }
});

// The 2px focus ring needs 3:1 against whatever it sits on (WCAG 1.4.11). It is yellow on the board, and the
// board black on a yellow sign, where a yellow ring would vanish.
const FOCUS_RING_ON: [ring: ColorToken, background: ColorToken][] = [
  ['accent', 'bg'],
  ['accent', 'inset'],
  ['accent', 'surface'],
  ['on-accent', 'accent']
];

test('the focus ring stands out on every surface, in board black on yellow', () => {
  for (const [ring, background] of FOCUS_RING_ON) {
    const ratio = contrastRatio(DESIGN.colors[ring], DESIGN.colors[background]);
    assert.ok(ratio >= 3, `${ring} ring on ${background} is ${ratio.toFixed(2)}:1, needs 3:1`);
  }
  const indexCss = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  // Every element in the area holds the black before it takes focus, or the ring fades in from yellow.
  assert.match(
    indexCss,
    /\.bg-accent \*,\s*\.bg-accent :focus-visible\s*\{\s*outline-color: rgb\(var\(--c-on-accent\)\);/,
    'index.css must give every element inside .bg-accent areas an on-accent outline color'
  );
});

// Opacity dims a whole element, text and background together, so the token table above can't see it. Every
// opacity a component sets outside `disabled:` is declared here with the colours it dims, and must still reach
// 4.5:1. `opacity-0` hides an element and is skipped.
type DimmedCase = [text: ColorToken, ownBackground: ColorToken | null, page: ColorToken];
const DIMMED_TEXT: Record<string, DimmedCase[]> = {
  // Rows of exercises not up next: the name and its flaps.
  'tracker/SessionBoard.tsx opacity-50': [
    ['ink', null, 'bg'],
    ['ink', 'surface', 'bg'],
    ['ink', 'flap-low', 'bg']
  ]
};

function blend(top: string, under: string, alpha: number): string {
  const [a, b] = [hexToChannels(top), hexToChannels(under)].map(channels => channels.split(' ').map(Number));
  return `#${a!.map((value, i) => Math.round(alpha * value + (1 - alpha) * b![i]!).toString(16).padStart(2, '0')).join('')}`;
}

function componentOpacities(): string[] {
  const root = new URL('../src/components/', import.meta.url);
  const found: string[] = [];
  // readdirSync names nested files with the OS separator, backslashes on Windows.
  const files = readdirSync(root, { recursive: true }).map(name => String(name).split(/[\\/]/).join('/'));
  for (const file of files.filter(name => name.endsWith('.tsx'))) {
    const source = readFileSync(new URL(file, root), 'utf8');
    for (const [, level] of source.matchAll(/(?<![\w:-])opacity-(\d+)\b/g)) {
      if (level !== '0') found.push(`${file} opacity-${level}`);
    }
  }
  return [...new Set(found)].sort();
}

test('dimmed text keeps 4.5:1, so opacity is never a text level on its own', () => {
  for (const use of componentOpacities()) {
    const cases = DIMMED_TEXT[use];
    assert.ok(
      cases,
      `${use} dims text the contrast table can't check. Use an ink step instead (ink-faint on bg or inset, ink-muted where the background can be surface), or declare the case in DIMMED_TEXT.`
    );
    const alpha = Number(use.split('opacity-')[1]) / 100;
    for (const [text, own, page] of cases) {
      const background = own ? blend(DESIGN.colors[own], DESIGN.colors[page], alpha) : DESIGN.colors[page];
      const ratio = contrastRatio(blend(DESIGN.colors[text], DESIGN.colors[page], alpha), background);
      assert.ok(ratio >= 4.5, `${use}: ${text} on ${own ?? page} is ${ratio.toFixed(2)}:1 once dimmed, needs 4.5:1`);
    }
  }
});
