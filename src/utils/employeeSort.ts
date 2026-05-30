import type { Employee } from '../types/database';

const jobTitleOrder = [
  'директор',
  'раководител',
  'администрација',
  'стручни работници',
  'стручни соработници',
  'воспитувачи',
  'негователи',
  'кујна',
  'технички персонал',
];

function normalize(value: string | null | undefined) {
  return (value ?? '').trim().toLocaleLowerCase('mk-MK');
}

function rank(employee: Employee) {
  const title = normalize(employee.job_title);
  const index = jobTitleOrder.findIndex((item) => title.includes(item));
  return index === -1 ? jobTitleOrder.length : index;
}

export function sortEmployeesByRoleOrder(employees: Employee[]) {
  return [...employees].sort((a, b) => {
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    return a.full_name.localeCompare(b.full_name, 'mk-MK');
  });
}
