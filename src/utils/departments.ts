export const departmentOptions = ['Ѕвездички', 'Први стапки', 'Бисерчиња'];

export function normalizeDepartment(value: string | null | undefined) {
  const department = (value ?? '').trim().toLocaleLowerCase('mk-MK');
  if (department === 'ѕвездички' || ((department.includes('karposh') || department.includes('карпош')) && department.includes('2'))) return 'Ѕвездички';
  if (department === 'први стапки' || ((department.includes('karposh') || department.includes('карпош')) && department.includes('3'))) return 'Први стапки';
  if (department === 'бисерчиња' || ((department.includes('karposh') || department.includes('карпош')) && department.includes('4'))) return 'Бисерчиња';
  return value?.trim() ?? '';
}
