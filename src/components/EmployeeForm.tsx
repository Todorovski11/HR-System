import { useEffect, useState } from 'react';
import type { Employee } from '../types/database';
import type { EmployeeFormValues } from '../types/forms';
import { useTranslation } from 'react-i18next';

const emptyEmployee: EmployeeFormValues = {
  full_name: '',
  email: '',
  phone: '',
  job_title: '',
  department: '',
  employment_start_date: '',
  employment_status: 'active',
  service_years: null,
  yearly_vacation_days: 20,
  notes: '',
};

export default function EmployeeForm({
  employee,
  defaultVacationDays = 20,
  onSubmit,
  onCancel,
  saving,
}: {
  employee?: Employee | null;
  defaultVacationDays?: number;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [values, setValues] = useState<EmployeeFormValues>({ ...emptyEmployee, yearly_vacation_days: defaultVacationDays });
  const { t } = useTranslation();

  useEffect(() => {
    if (employee) {
      setValues({
        full_name: employee.full_name,
        email: employee.email ?? '',
        phone: employee.phone ?? '',
        job_title: employee.job_title ?? '',
        department: employee.department ?? '',
        employment_start_date: employee.employment_start_date ?? '',
        employment_status: employee.employment_status,
        service_years: employee.service_years,
        yearly_vacation_days: employee.yearly_vacation_days,
        notes: employee.notes ?? '',
      });
    } else {
      setValues({ ...emptyEmployee, yearly_vacation_days: defaultVacationDays });
    }
  }, [defaultVacationDays, employee]);

  const update = (field: keyof EmployeeFormValues, value: string | number | null) => {
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
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {t('employees.fullName')}
          <input className="field" required value={values.full_name} onChange={(event) => update('full_name', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {t('common.email')}
          <input className="field" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {t('common.phone')}
          <input className="field" value={values.phone} onChange={(event) => update('phone', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {t('common.jobTitle')}
          <input className="field" value={values.job_title} onChange={(event) => update('job_title', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {t('common.department')}
          <input className="field" value={values.department} onChange={(event) => update('department', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {t('common.startDate')}
          <input
            className="field"
            type="date"
            value={values.employment_start_date}
            onChange={(event) => update('employment_start_date', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {t('common.status')}
          <select className="field" value={values.employment_status} onChange={(event) => update('employment_status', event.target.value)}>
            <option value="active">{t('statuses.active')}</option>
            <option value="inactive">{t('statuses.inactive')}</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {t('employees.serviceYears')}
          <input
            className="field"
            min={0}
            type="number"
            value={values.service_years ?? ''}
            onChange={(event) => update('service_years', event.target.value === '' ? null : Number(event.target.value))}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {t('employees.yearlyVacationDays')}
          <input
            className="field"
            min={0}
            type="number"
            value={values.yearly_vacation_days}
            onChange={(event) => update('yearly_vacation_days', Number(event.target.value))}
          />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        {t('common.notes')}
        <textarea className="field min-h-24" value={values.notes} onChange={(event) => update('notes', event.target.value)} />
      </label>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button className="btn-primary" disabled={saving}>
          {saving ? t('common.saving') : t('employees.save')}
        </button>
      </div>
    </form>
  );
}
