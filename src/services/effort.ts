// Reps in reserve (RIR): how many more reps a set had left. It is stored in the existing
// SetLog.rpe field as 10 − RIR, so saved sessions and backups keep their format.
import type { SetLog } from '../types/workout.ts';

export const RIR_CHOICES = [0, 1, 2, 3, 4, 5] as const;

export function rirOf(set: SetLog): number | null {
  return set.rpe === undefined ? null : 10 - set.rpe;
}

// null clears it: RIR is optional and stays blank unless it is filled in.
export function withRir(set: SetLog, rir: number | null): SetLog {
  const { rpe, ...withoutRpe } = set;
  return rir === null ? withoutRpe : { ...withoutRpe, rpe: 10 - rir };
}

// "8", or "8 @ RIR 2" when the RIR was logged.
export function formatReps(set: SetLog): string {
  const rir = rirOf(set);
  return rir === null ? String(set.repsCompleted) : `${set.repsCompleted} @ RIR ${rir}`;
}
