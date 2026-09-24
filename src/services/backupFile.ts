// Saves a backup as a .json download and reads one back from a file the user picked.
import type { GymmyBackup } from '../types/workout.ts';
import { parseBackup, type ParseResult } from '../validation.ts';

// Revoking the URL right after click() can cancel the download in Firefox and Safari.
const REVOKE_DELAY_MS = 60_000;

export function downloadBackup(backup: GymmyBackup): void {
  downloadJson(`gymmy-backup-${backup.exportedAt.slice(0, 10)}.json`, backup);
}

export function downloadJson(fileName: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

export async function readBackupFile(file: File): Promise<ParseResult<GymmyBackup>> {
  let content: unknown;
  try {
    content = JSON.parse(await file.text());
  } catch {
    return { ok: false, error: 'the file is not valid JSON' };
  }
  return parseBackup(content);
}
