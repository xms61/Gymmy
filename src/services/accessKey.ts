// The server's access key on devices other than the one running it (see server/SERVER.md). The
// server prints a link ending in #key=…; opening it once stores the key in this browser.
const ACCESS_KEY_STORAGE_KEY = 'gymmy_access_key_v1';

// Keeps the key from the address and removes it from the address bar and the history entry,
// so it isn't left on screen or in a shared link.
export function adoptAccessKeyFromUrl(): void {
  const key = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('key')?.trim();
  if (!key) return;
  try {
    localStorage.setItem(ACCESS_KEY_STORAGE_KEY, key);
  } catch (err) {
    console.error('[StorageService] Could not save the access key', err);
  }
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

export function accessKeyHeaders(): Record<string, string> {
  try {
    const key = localStorage.getItem(ACCESS_KEY_STORAGE_KEY);
    return key ? { 'X-Gymmy-Key': key } : {};
  } catch {
    return {};
  }
}
