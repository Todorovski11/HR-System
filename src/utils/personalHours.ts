import type { PersonalHours } from '../types/database';

export function hoursInMonth(records: PersonalHours[], date = new Date()) {
  return records
    .filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === date.getMonth() && recordDate.getFullYear() === date.getFullYear();
    })
    .reduce((total, record) => total + Number(record.number_of_hours || 0), 0);
}

export function hoursInYear(records: PersonalHours[], year = new Date().getFullYear()) {
  return records
    .filter((record) => new Date(record.date).getFullYear() === year)
    .reduce((total, record) => total + Number(record.number_of_hours || 0), 0);
}

export function hoursByEmployeeThisMonth(records: PersonalHours[], date = new Date()) {
  const totals = records.reduce<Record<string, number>>((result, record) => {
    const recordDate = new Date(record.date);
    if (recordDate.getMonth() === date.getMonth() && recordDate.getFullYear() === date.getFullYear()) {
      result[record.employee_id] = (result[record.employee_id] ?? 0) + Number(record.number_of_hours || 0);
    }
    return result;
  }, {});

  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}
