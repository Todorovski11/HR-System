import type { Employee } from '../types/database';

export const jobTitleOrder = [
  'Директор',
  'Раководител',
  'Администрација',
  'Стручен работник',
  'Стручен соработник',
  'Воспитувач',
  'Неговател',
  'Кујна',
  'Технички персонал',
];

function normalize(value: string | null | undefined) {
  return (value ?? '').trim().toLocaleLowerCase('mk-MK');
}

export function jobTitleRank(jobTitle: string | null | undefined) {
  const title = normalize(jobTitle);
  const index = jobTitleOrder.findIndex((item) => title.includes(normalize(item)));
  return index === -1 ? jobTitleOrder.length : index;
}

export function compareJobTitles(a: string | null | undefined, b: string | null | undefined) {
  const rankDiff = jobTitleRank(a) - jobTitleRank(b);
  if (rankDiff !== 0) return rankDiff;
  return (a ?? '').localeCompare(b ?? '', 'mk-MK');
}

export function sortEmployeesByRoleOrder(employees: Employee[]) {
  return [...employees].sort((a, b) => {
    const rankDiff = compareJobTitles(a.job_title, b.job_title);
    if (rankDiff !== 0) return rankDiff;
    return a.full_name.localeCompare(b.full_name, 'mk-MK');
  });
}
