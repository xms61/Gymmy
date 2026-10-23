// Whether the focused element uses a key itself, so a page shortcut on that key must stand aside. Free of DOM
// types, so the tests can run it under Node.
export interface ShortcutTarget {
  tagName: string;
  role: string | null;
  isContentEditable: boolean;
}

const TEXT_ENTRY_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];
// Space and Enter activate these, so a page shortcut on those keys would steal the press. Letters still reach
// the page, because focus stays on a button after a click.
const ACTIVATION_KEYS = [' ', 'Enter'];
const ACTIVATABLE_TAGS = ['BUTTON', 'A', 'SUMMARY'];
const ACTIVATABLE_ROLES = ['button', 'radio', 'checkbox', 'switch', 'tab', 'menuitem', 'option'];

export function targetKeepsKey(key: string, target: ShortcutTarget): boolean {
  if (target.isContentEditable || TEXT_ENTRY_TAGS.includes(target.tagName)) return true;
  const activatable = ACTIVATABLE_TAGS.includes(target.tagName) || ACTIVATABLE_ROLES.includes(target.role ?? '');
  return activatable && ACTIVATION_KEYS.includes(key);
}
