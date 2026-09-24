/**
 * Date formatting utilities that operate strictly on local time (avoiding UTC offset bugs)
 */

/**
 * Returns a YYYY-MM-DD string for a given Date object in local time
 */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's YYYY-MM-DD string in local time
 */
export function getTodayDateString(): string {
  return toLocalDateString(new Date());
}

/**
 * Formats YYYY-MM-DD to a user-friendly local date string (e.g. "Monday, Sep 7, 2026")
 */
export function formatDisplayDate(dateString: string): string {
  return localDate(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export type DateStyle = 'numeric' | 'written';

// A session date in a list: "2026-09-24", or "Thursday, 24 September" for themes that write dates out.
export function formatSessionDate(dateString: string, style: DateStyle): string {
  if (style === 'numeric') return dateString;
  const date = localDate(dateString);
  return `${date.toLocaleDateString('en-US', { weekday: 'long' })}, ${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'long' })}`;
}

// "24 Sep", for a stamp.
export function formatDayMonth(dateString: string): string {
  const date = localDate(dateString);
  return `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}`;
}

// A YYYY-MM-DD string as midnight local time, so the day never shifts with the time zone.
function localDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
