// Workout durations, computed from timestamps. Browsers slow down or pause timers in background
// tabs (a locked phone between sets), so counting timer ticks undercounts.

export function elapsedSeconds(startTime: string, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - Date.parse(startTime)) / 1000));
}

// At least one minute, so a finished workout never records zero.
export function workoutDurationMinutes(startTime: string, endTime: string): number {
  return Math.max(1, Math.round((Date.parse(endTime) - Date.parse(startTime)) / 60_000));
}

// m:ss, or h:mm:ss after an hour.
export function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
}
