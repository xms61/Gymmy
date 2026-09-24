// The key that devices other than the one running the server must send. It is created once,
// kept next to the database, and never leaves this machine except in the link the server prints.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const ACCESS_KEY_FILE_NAME = 'access-key';

export function loadAccessKey(dataDir: string): string {
  const file = path.join(dataDir, ACCESS_KEY_FILE_NAME);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(file, crypto.randomBytes(24).toString('base64url'), { mode: 0o600 });
  }
  return fs.readFileSync(file, 'utf8').trim();
}

// Compared in constant time, so response timing reveals nothing about the key.
export function keysMatch(sent: string | undefined, expected: string): boolean {
  const a = Buffer.from(sent ?? '');
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// The TCP peer, unlike the Host header, can't be chosen by the client.
export function isLoopbackAddress(address: string | undefined): boolean {
  if (!address) return false;
  const ipv4 = address.startsWith('::ffff:') ? address.slice('::ffff:'.length) : address;
  return ipv4.startsWith('127.') || address === '::1';
}
