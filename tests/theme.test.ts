import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../src/theme/themes.ts';
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
