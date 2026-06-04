import { differenceInCalendarDays, format, isWithinInterval, parseISO } from 'date-fns';

export function countCalendarDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInCalendarDays(end, start) + 1;
  return Number.isFinite(days) && days > 0 ? days : 0;
}

export function countWorkingDays(startDate: string, endDate: string, holidayDates: string[] = []) {
  if (!startDate || !endDate) return 0;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const totalDays = differenceInCalendarDays(end, start) + 1;
  if (!Number.isFinite(totalDays) || totalDays <= 0) return 0;

  const holidays = new Set(holidayDates);
  let workingDays = 0;

  for (let index = 0; index < totalDays; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const day = date.getDay();
    const key = format(date, 'yyyy-MM-dd');
    const isWeekend = day === 0 || day === 6;
    if (!isWeekend && !holidays.has(key)) {
      workingDays += 1;
    }
  }

  return workingDays;
}

export function formatDate(date: string | null | undefined) {
  return date ? format(parseISO(date), 'MMM d, yyyy') : '-';
}

export function formatDateTime(date: string | null | undefined) {
  return date ? format(parseISO(date), 'MMM d, yyyy HH:mm') : '-';
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
