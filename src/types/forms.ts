import type { AbsenceStatus, AbsenceType, EmploymentStatus } from './database';

export type EmployeeFormValues = {
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  department: string;
  employment_start_date: string;
  employment_status: EmploymentStatus;
  yearly_vacation_days: number;
  notes: string;
};

export type AbsenceFormValues = {
  employee_id: string;
  type: AbsenceType;
  start_date: string;
  end_date: string;
  number_of_days: number;
  status: AbsenceStatus;
  reason: string;
};
