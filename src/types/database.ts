export type ProfileRole = 'admin' | 'employee';
export type EmploymentStatus = 'active' | 'inactive';
export type AbsenceType = 'vacation' | 'sick' | 'personal' | 'unpaid' | 'other';
export type AbsenceStatus = 'pending' | 'approved' | 'rejected';

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

export type AppSetting = {
  key: string;
  value: unknown;
  updated_by: string | null;
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
      app_settings: {
        Row: AppSetting;
        Insert: Partial<AppSetting> & Pick<AppSetting, 'key' | 'value'>;
        Update: Partial<AppSetting>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
