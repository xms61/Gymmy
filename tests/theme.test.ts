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

// Opacity dims a whole element, text and background together, and a text colour's alpha (`text-ink/50`)
// dims the text alone, so the token table above can't see either. Every opacity class or text alpha a component
// sets, under any variant except `disabled:`, is declared here with the colours it dims and must still reach
// 4.5:1. `opacity-0` hides an element and is skipped. Opacity set in a style attribute isn't scanned.
type DimmedCase = [text: ColorToken, ownBackground: ColorToken | null, page: ColorToken];
const DIMMED_TEXT: Record<string, DimmedCase[]> = {
  // Rows of exercises not up next: the name and its flaps.
  'components/tracker/SessionBoard.tsx opacity-50': [
    ['ink', null, 'bg'],
    ['ink', 'surface', 'bg'],
    ['ink', 'flap-low', 'bg']
  ]
};

interface DimmingClass {
  className: string; // as written, variants included: `hover:opacity-50`, `text-ink/50`
  alpha: number;
  dimsBackground: boolean; // opacity does; a text colour's alpha doesn't
}

// `50` is 50%, `[0.4]` and `[40%]` are 40%.
function alphaOf(value: string): number {
  const arbitrary = /^\[(.+)\]$/.exec(value)?.[1];
  if (!arbitrary) return Number(value) / 100;
  return arbitrary.endsWith('%') ? Number(arbitrary.slice(0, -1)) / 100 : Number(arbitrary);
}

function dimmingClasses(source: string): DimmingClass[] {
  const found: DimmingClass[] = [];
  const PATTERNS: [pattern: RegExp, dimsBackground: boolean][] = [
    [/(?<![\w-])((?:[\w-]+:)*)opacity-(\d+|\[[^\]\s]+\])/g, true],
    [/(?<![\w-])((?:[\w-]+:)*)text-[a-z][\w-]*\/(\d+|\[[^\]\s]+\])/g, false]
  ];
  for (const [pattern, dimsBackground] of PATTERNS) {
    for (const [className, variants, value] of source.matchAll(pattern)) {
      const alpha = alphaOf(value!);
      if (variants!.split(':').includes('disabled') || alpha === 0) continue;
      found.push({ className, alpha, dimsBackground });
    }
  }
  return found;
}

test('finds dimming classes under any variant except disabled:', () => {
  const source = `hover:opacity-50 xl:group-hover:opacity-40 opacity-[0.3] opacity-[25%] text-ink-soft/60
    disabled:opacity-40 disabled:text-on-accent/60 opacity-0 bg-on-accent/10 border-warn-ink/40`;
  assert.deepEqual(
    dimmingClasses(source).map(({ className, alpha }) => [className, alpha]),
    [
      ['hover:opacity-50', 0.5],
      ['xl:group-hover:opacity-40', 0.4],
      ['opacity-[0.3]', 0.3],
      ['opacity-[25%]', 0.25],
      ['text-ink-soft/60', 0.6]
    ]
  );
});

function blend(top: string, under: string, alpha: number): string {
  const [a, b] = [hexToChannels(top), hexToChannels(under)].map(channels => channels.split(' ').map(Number));
  return `#${a!.map((value, i) => Math.round(alpha * value + (1 - alpha) * b![i]!).toString(16).padStart(2, '0')).join('')}`;
}

// The source of App.tsx and every component, keyed by its path under src/ with forward slashes.
function componentSources(): [file: string, source: string][] {
  const root = new URL('../src/', import.meta.url);
  // readdirSync names nested files with the OS separator, backslashes on Windows.
  const components = readdirSync(new URL('components/', root), { recursive: true })
    .map(name => `components/${String(name).split(/[\\/]/).join('/')}`)
    .filter(name => name.endsWith('.tsx'));
  return ['App.tsx', ...components].map(file => [file, readFileSync(new URL(file, root), 'utf8')]);
}

function componentDimming(): Map<string, DimmingClass> {
  const found = new Map<string, DimmingClass>();
  for (const [file, source] of componentSources()) {
    for (const use of dimmingClasses(source)) found.set(`${file} ${use.className}`, use);
  }
  return found;
}

test('dimmed text keeps 4.5:1, so opacity is never a text level on its own', () => {
  for (const [use, { alpha, dimsBackground }] of componentDimming()) {
    const cases = DIMMED_TEXT[use];
    assert.ok(
      cases,
      `${use} dims text the contrast table can't check. Use an ink step instead (ink-faint on bg or inset, ink-muted where the background can be surface), or declare the case in DIMMED_TEXT.`
    );
    for (const [text, own, page] of cases) {
      const under = own ? DESIGN.colors[own] : DESIGN.colors[page];
      const background = dimsBackground && own ? blend(DESIGN.colors[own], DESIGN.colors[page], alpha) : under;
      const ratio = contrastRatio(blend(DESIGN.colors[text], dimsBackground ? DESIGN.colors[page] : under, alpha), background);
      assert.ok(ratio >= 4.5, `${use}: ${text} on ${own ?? page} is ${ratio.toFixed(2)}:1 once dimmed, needs 4.5:1`);
    }
  }
});

test('components size and space type with theme tokens, not hand-typed values', () => {
  const handTyped = componentSources().flatMap(([file, source]) =>
    [...source.matchAll(/\b(?:text-\[[\d.]+(?:rem|px|em)\]|tracking-\[[^\]]+\])/g)].map(([match]) => `${file}: ${match}`)
  );
  assert.deepEqual(
    handTyped,
    [],
    'Use the type tokens in the @theme block of src/index.css (text-flap-row, text-display, text-flap, text-sign, text-flap-xl; tracking-heading, tracking-button, tracking-label), or add a token there first.'
  );
});
