import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ACCESS_KEY_FILE_NAME, isLoopbackAddress, keysMatch, loadAccessKey } from '../../server/accessKey.ts';

test('creates one key per install and keeps it', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gymmy-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const key = loadAccessKey(dir);
  assert.match(key, /^[A-Za-z0-9_-]{32}$/);
  assert.equal(loadAccessKey(dir), key);
  if (process.platform !== 'win32') assert.equal(fs.statSync(path.join(dir, ACCESS_KEY_FILE_NAME)).mode & 0o777, 0o600);
});

test('keys match only when they are identical', () => {
  assert.ok(keysMatch('abc', 'abc'));
  for (const sent of [undefined, '', 'abd', 'abcd', 'ab']) assert.ok(!keysMatch(sent, 'abc'), String(sent));
});

test('only loopback connections count as this machine', () => {
  for (const address of ['127.0.0.1', '127.0.1.1', '::1', '::ffff:127.0.0.1']) assert.ok(isLoopbackAddress(address), address);
  for (const address of [undefined, '', '192.168.1.20', '::ffff:192.168.1.20', 'fe80::1', '10.127.0.1']) {
    assert.ok(!isLoopbackAddress(address), String(address));
  }
});
