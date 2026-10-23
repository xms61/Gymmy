import { test } from 'node:test';
import assert from 'node:assert/strict';
import { targetKeepsKey, type ShortcutTarget } from '../src/components/shortcutTarget.ts';

function element(tagName: string, role: string | null = null, isContentEditable = false): ShortcutTarget {
  return { tagName, role, isContentEditable };
}

test('text fields keep every key, so typing never triggers a shortcut', () => {
  const FIELDS = [element('INPUT'), element('TEXTAREA'), element('SELECT'), element('DIV', null, true)];
  for (const field of FIELDS) {
    for (const key of [' ', 'Enter', 'j', '1', '/']) assert.equal(targetKeepsKey(key, field), true, `${field.tagName} ${key}`);
  }
});

test('a focused button, link, summary or control keeps Space and Enter, which activate it', () => {
  const CONTROLS = [
    element('BUTTON'),
    element('A'),
    element('SUMMARY'),
    element('DIV', 'radio'),
    element('SPAN', 'checkbox'),
    element('DIV', 'switch'),
    element('DIV', 'tab'),
    element('LI', 'menuitem'),
    element('LI', 'option'),
    element('DIV', 'button')
  ];
  for (const control of CONTROLS) {
    for (const key of [' ', 'Enter']) assert.equal(targetKeepsKey(key, control), true, `${control.tagName} ${control.role} ${key}`);
  }
});

test('a focused control leaves letter and digit shortcuts to the page', () => {
  for (const key of ['j', 'k', 'n', 's', '1', '/', '?']) assert.equal(targetKeepsKey(key, element('BUTTON')), false, key);
});

test('the page keeps every key when focus is on plain content', () => {
  for (const target of [element('BODY'), element('DIV'), element('SECTION', 'region')]) {
    for (const key of [' ', 'Enter', 'j']) assert.equal(targetKeepsKey(key, target), false, `${target.tagName} ${key}`);
  }
});
