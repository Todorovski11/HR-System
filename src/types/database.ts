export type ProfileRole = 'admin' | 'employee';
export type EmploymentStatus = 'active' | 'inactive';
export type EmploymentType = 'редовен работен однос' | 'договор на дело';
export type AbsenceType = 'vacation' | 'sick' | 'personal' | 'unpaid' | 'other';
export type AbsenceStatus = 'pending' | 'approved' | 'rejected';
export type AbsenceHistoryAction = 'created' | 'updated' | 'status_changed' | 'deleted';
export type PersonalHoursHistoryAction = 'created' | 'updated' | 'deleted';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
};

export type Employee = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  department: string | null;
  employment_start_date: string | null;
  employment_status: EmploymentStatus;
  employment_type: EmploymentType;
  service_years: number | null;
  yearly_vacation_days: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Absence = {
  id: string;
  employee_id: string;
  created_by: string | null;
  type: AbsenceType;
  start_date: string;
  end_date: string;
  number_of_days: number;
  status: AbsenceStatus;
  reason: string | null;
  created_at: string;
  updated_at: string;
};

export type AbsenceWithEmployee = Absence & {
  employees: Pick<Employee, 'id' | 'full_name' | 'yearly_vacation_days'> | null;
};

export type PersonalHours = {
  id: string;
  employee_id: string;
  date: string;
  number_of_hours: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PersonalHoursWithEmployee = PersonalHours & {
  employees: Pick<Employee, 'id' | 'full_name'> | null;
};

export type EmployeeDepartmentSchedule = {
  id: string;
  employee_id: string;
  date: string;
  department: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployeeDepartmentScheduleWithEmployee = EmployeeDepartmentSchedule & {
  employees: Pick<Employee, 'id' | 'full_name' | 'job_title' | 'department'> | null;
};

export type AbsenceHistory = {
  id: string;
  absence_id: string | null;
  employee_id: string | null;
  action: AbsenceHistoryAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
  profiles: Pick<Profile, 'email' | 'full_name'> | null;
};

export type PersonalHoursHistory = {
  id: string;
  personal_hours_id: string | null;
  employee_id: string | null;
  action: PersonalHoursHistoryAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
  profiles: Pick<Profile, 'email' | 'full_name'> | null;
};

export type AppSetting = {
  key: string;
  value: unknown;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Holiday = {
  id: string;
  date: string;
  name: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, 'id' | 'role'>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      employees: {
        Row: Employee;
        Insert: Omit<Partial<Employee>, 'id' | 'created_at' | 'updated_at'> & Pick<Employee, 'full_name'>;
        Update: Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      absences: {
        Row: Absence;
        Insert: Omit<Partial<Absence>, 'id' | 'created_at' | 'updated_at'> &
          Pick<Absence, 'employee_id' | 'type' | 'start_date' | 'end_date' | 'number_of_days' | 'status'>;
        Update: Partial<Omit<Absence, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
          {
            foreignKeyName: 'absences_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      personal_hours: {
        Row: PersonalHours;
        Insert: Omit<Partial<PersonalHours>, 'id' | 'created_at' | 'updated_at'> &
          Pick<PersonalHours, 'employee_id' | 'date' | 'number_of_hours'>;
        Update: Partial<Omit<PersonalHours, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
          {
            foreignKeyName: 'personal_hours_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      employee_department_schedules: {
        Row: EmployeeDepartmentSchedule;
        Insert: Omit<Partial<EmployeeDepartmentSchedule>, 'id' | 'created_at' | 'updated_at'> &
          Pick<EmployeeDepartmentSchedule, 'employee_id' | 'date' | 'department'>;
        Update: Partial<Omit<EmployeeDepartmentSchedule, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
          {
            foreignKeyName: 'employee_department_schedules_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      absence_history: {
        Row: Omit<AbsenceHistory, 'profiles'>;
        Insert: Partial<Omit<AbsenceHistory, 'profiles' | 'id' | 'changed_at'>> & Pick<AbsenceHistory, 'action'>;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'absence_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      personal_hours_history: {
        Row: Omit<PersonalHoursHistory, 'profiles'>;
        Insert: Partial<Omit<PersonalHoursHistory, 'profiles' | 'id' | 'changed_at'>> & Pick<PersonalHoursHistory, 'action'>;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'personal_hours_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      app_settings: {
        Row: AppSetting;
        Insert: Partial<AppSetting> & Pick<AppSetting, 'key' | 'value'>;
        Update: Partial<AppSetting>;
        Relationships: [];
      };
      holidays: {
        Row: Holiday;
        Insert: Omit<Partial<Holiday>, 'id' | 'created_at' | 'updated_at'> & Pick<Holiday, 'date' | 'name'>;
        Update: Partial<Omit<Holiday, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
