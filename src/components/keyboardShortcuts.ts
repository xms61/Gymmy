import { targetKeepsKey } from './shortcutTarget.ts';

// Single-key shortcuts must not fire while the user types, holds a modifier, has a dialog open, or presses a key
// the focused control uses itself (Space on a button).
export function isShortcutFree(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    targetKeepsKey(event.key, { tagName: target.tagName, role: target.getAttribute('role'), isContentEditable: target.isContentEditable })
  )
    return false;
  return document.querySelector('[role="dialog"]') === null;
}
