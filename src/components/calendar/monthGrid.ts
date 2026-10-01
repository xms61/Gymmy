import { toLocalDateString } from '../../utils/date.ts';

export interface GridDay {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  inMonth: boolean;
}

// The days shown for a month, Monday first, in whole weeks: the month's own days plus the days of
// the neighbouring months that complete its first and last week.
export function monthGrid(year: number, month: number): GridDay[] {
  const first = new Date(year, month, 1);
  const leading = (first.getDay() + 6) % 7; // days before the 1st back to Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((leading + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, index) => {
    const date = new Date(year, month, index - leading + 1);
    return { date: toLocalDateString(date), dayNumber: date.getDate(), inMonth: date.getMonth() === month };
  });
}
