import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isFileLoadingAllowed, normalizePath, resolveConfig } from 'vite';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

// The dev server checks paths with forward slashes on every platform.
function projectFile(...segments: string[]): string {
  return normalizePath(path.join(ROOT, ...segments));
}

async function devServerConfig() {
  return resolveConfig({ root: ROOT, configFile: path.join(ROOT, 'vite.config.ts'), logLevel: 'silent' }, 'serve');
}

test('the dev server refuses to serve the database and the access key', async () => {
  const config = await devServerConfig();
  for (const file of ['gymmy.db', 'gymmy.before-clear-2026-10-01.db', 'access-key']) {
    assert.equal(isFileLoadingAllowed(config, projectFile('data', file)), false, file);
  }
});

test('the dev server still serves the app source', async () => {
  const config = await devServerConfig();
  assert.equal(isFileLoadingAllowed(config, projectFile('src', 'main.tsx')), true);
});
