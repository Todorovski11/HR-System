import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Employee, EmployeeDepartmentSchedule } from '../types/database';
import type { DepartmentScheduleFormValues } from '../types/forms';
import { departmentOptions } from '../utils/departments';

const emptyValues: DepartmentScheduleFormValues = {
  employee_id: '',
  date: new Date().toISOString().slice(0, 10),
  department: 'Први стапки',
  notes: '',
};

export default function DepartmentScheduleForm({
  record,
  employees,
  onSubmit,
  onCancel,
  saving,
}: {
  record?: EmployeeDepartmentSchedule | null;
  employees: Employee[];
  onSubmit: (values: DepartmentScheduleFormValues) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [values, setValues] = useState<DepartmentScheduleFormValues>(emptyValues);
  const { t } = useTranslation();

  useEffect(() => {
    if (record) {
      setValues({
        employee_id: record.employee_id,
        date: record.date,
        department: record.department,
        notes: record.notes ?? '',
      });
    } else {
      setValues(emptyValues);
    }
  }, [record]);

  const update = (field: keyof DepartmentScheduleFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(values);
      }}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {t('common.employee')}
          <select className="field" required value={values.employee_id} onChange={(event) => update('employee_id', event.target.value)}>
            <option value="">{t('absences.chooseEmployee')}</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {t('common.date')}
          <input className="field" required type="date" value={values.date} onChange={(event) => update('date', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {t('common.department')}
          <select className="field" required value={values.department} onChange={(event) => update('department', event.target.value)}>
            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        {t('common.notes')}
        <textarea className="field min-h-20" value={values.notes} onChange={(event) => update('notes', event.target.value)} />
      </label>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button className="btn-primary" disabled={saving}>
          {saving ? t('common.saving') : t('departmentSchedule.save')}
        </button>
      </div>
    </form>
  );
}
