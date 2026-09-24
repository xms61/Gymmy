// Single-key shortcuts must not fire while the user types, holds a modifier, or has a dialog open.
export function isShortcutFree(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return false;
  return document.querySelector('[role="dialog"]') === null;
}
