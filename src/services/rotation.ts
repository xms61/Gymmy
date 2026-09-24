// The Push/Pull/Legs rotation: which split comes after the last one trained.
import type { SplitType, WorkoutSession } from '../types/workout.ts';

export const ROTATION: readonly SplitType[] = ['Push', 'Pull', 'Legs'];

// The most recent completed session, by date and then start time.
export function latestSession(sessions: WorkoutSession[]): WorkoutSession | null {
  return latestMatching(sessions, () => true);
}

// Sessions of other splits are skipped, so an extra "Other" workout doesn't reset the rotation.
export function nextSplit(sessions: WorkoutSession[]): SplitType {
  const last = latestMatching(sessions, session => ROTATION.includes(session.splitType));
  if (!last) return ROTATION[0]!;
  return ROTATION[(ROTATION.indexOf(last.splitType) + 1) % ROTATION.length]!;
}

function latestMatching(sessions: WorkoutSession[], matches: (session: WorkoutSession) => boolean): WorkoutSession | null {
  let latest: WorkoutSession | null = null;
  for (const session of sessions) {
    if (session.completed && matches(session) && (!latest || isLater(session, latest))) latest = session;
  }
  return latest;
}

function isLater(a: WorkoutSession, b: WorkoutSession): boolean {
  return a.date > b.date || (a.date === b.date && a.startTime > b.startTime);
}
