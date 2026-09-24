// How many weeks in a row, up to this one, have at least one completed session.
import type { WorkoutSession } from '../types/workout.ts';
import { toLocalDateString } from '../utils/date.ts';

// Weeks run Monday to Sunday. The current week counts once it has a session, so a Monday
// without one yet doesn't break the streak.
export function weeklyStreak(sessions: WorkoutSession[], today: Date): number {
  const trainedWeeks = new Set(sessions.filter(s => s.completed).map(s => weekNumber(s.date)));
  let week = weekNumber(toLocalDateString(today));
  if (!trainedWeeks.has(week)) week--;
  let streak = 0;
  while (trainedWeeks.has(week)) {
    streak++;
    week--;
  }
  return streak;
}

// Weeks since the Monday before 1 January 1970, which was a Thursday.
function weekNumber(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Math.floor((Date.UTC(year!, month! - 1, day!) / 86_400_000 + 3) / 7);
}
