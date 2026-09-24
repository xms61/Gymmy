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
  const [y, m, d] = dateString.split('-').map(Number);
  const localDate = new Date(y, m - 1, d);
  return localDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
