import { differenceInCalendarDays, format, isWithinInterval, parseISO } from 'date-fns';

export function countCalendarDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInCalendarDays(end, start) + 1;
  return Number.isFinite(days) && days > 0 ? days : 0;
}

export function formatDate(date: string | null | undefined) {
  return date ? format(parseISO(date), 'MMM d, yyyy') : '-';
}

export function monthLabel(date: string) {
  return format(parseISO(date), 'MMMM yyyy');
}

export function isDateInRange(date: Date, startDate: string, endDate: string) {
  return isWithinInterval(date, { start: parseISO(startDate), end: parseISO(endDate) });
}

export function currentYearRange(year = new Date().getFullYear()) {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}
