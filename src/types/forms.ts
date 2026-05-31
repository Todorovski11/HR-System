import type { AbsenceStatus, AbsenceType, EmploymentStatus, EmploymentType } from './database';

export type EmployeeFormValues = {
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  department: string;
  employment_start_date: string;
  employment_status: EmploymentStatus;
  employment_type: EmploymentType;
  service_years: number | null;
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

export type PersonalHoursFormValues = {
  employee_id: string;
  date: string;
  number_of_hours: number;
  notes: string;
};

export type DepartmentScheduleFormValues = {
  employee_id: string;
  date: string;
  department: string;
  notes: string;
};
