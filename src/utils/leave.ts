import type { Absence, Employee } from '../types/database';

export function approvedInYear(absence: Absence, year: number) {
  return absence.status === 'approved' && new Date(absence.start_date).getFullYear() === year;
}

export function usedDays(absences: Absence[], type: Absence['type'], year: number) {
  return absences
    .filter((absence) => absence.type === type && approvedInYear(absence, year))
    .reduce((total, absence) => total + Number(absence.number_of_days || 0), 0);
}

export function employeeBalance(employee: Employee, absences: Absence[], year: number) {
  const employeeAbsences = absences.filter((absence) => absence.employee_id === employee.id);
  const vacationUsed = usedDays(employeeAbsences, 'vacation', year);
  const sickUsed = usedDays(employeeAbsences, 'sick', year);

  return {
    vacationUsed,
    vacationRemaining: Math.max(employee.yearly_vacation_days - vacationUsed, 0),
    sickUsed,
  };
}

export function employeeVacationSummary(employee: Employee, absences: Absence[], year: number, today = new Date()) {
  const todayKey = today.toISOString().slice(0, 10);
  const employeeVacationAbsences = absences.filter((absence) => {
    return absence.employee_id === employee.id && absence.type === 'vacation' && absence.start_date.slice(0, 4) === String(year);
  });
  const spentVacationDays = employeeVacationAbsences
    .filter((absence) => absence.status === 'approved' && absence.start_date <= todayKey)
    .reduce((total, absence) => total + Number(absence.number_of_days || 0), 0);
  const plannedFutureVacationDays = employeeVacationAbsences
    .filter((absence) => absence.status !== 'rejected' && absence.start_date > todayKey)
    .reduce((total, absence) => total + Number(absence.number_of_days || 0), 0);
  const availableFutureVacationDays = Math.max(employee.yearly_vacation_days - spentVacationDays - plannedFutureVacationDays, 0);

  return {
    spentVacationDays,
    plannedFutureVacationDays,
    availableFutureVacationDays,
  };
}

export function nextAbsenceDate(employeeId: string, absences: Absence[]) {
  const today = new Date().toISOString().slice(0, 10);
  return absences
    .filter((absence) => absence.employee_id === employeeId && absence.start_date >= today && absence.status !== 'rejected')
    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0]?.start_date;
}
