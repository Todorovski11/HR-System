import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Employee, PersonalHours } from '../types/database';
import type { PersonalHoursFormValues } from '../types/forms';

const emptyPersonalHours: PersonalHoursFormValues = {
  employee_id: '',
  date: '',
  number_of_hours: 1,
  notes: '',
};

export default function PersonalHoursForm({
  record,
  employees,
  employeeId,
  onSubmit,
  onCancel,
  saving,
}: {
  record?: PersonalHours | null;
  employees: Employee[];
  employeeId?: string | null;
  onSubmit: (values: PersonalHoursFormValues) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [values, setValues] = useState<PersonalHoursFormValues>({ ...emptyPersonalHours, employee_id: employeeId ?? '' });
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (record) {
      setValues({
        employee_id: record.employee_id,
        date: record.date,
        number_of_hours: Number(record.number_of_hours),
        notes: record.notes ?? '',
      });
    } else {
      setValues({ ...emptyPersonalHours, employee_id: employeeId ?? '' });
    }
  }, [employeeId, record]);

  const update = (field: keyof PersonalHoursFormValues, value: string | number) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (values.number_of_hours <= 0 || values.number_of_hours > 24) {
          setError(t('personalHours.validationHours'));
          return;
        }
        setError('');
        void onSubmit(values);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
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
          {t('personalHours.numberOfHours')}
          <input
            className="field"
            required
            min={0.25}
            max={24}
            step={0.25}
            type="number"
            value={values.number_of_hours}
            onChange={(event) => update('number_of_hours', Number(event.target.value))}
          />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        {t('common.notes')}
        <textarea className="field min-h-24" value={values.notes} onChange={(event) => update('notes', event.target.value)} />
      </label>
      {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button className="btn-primary" disabled={saving}>
          {saving ? t('common.saving') : t('personalHours.save')}
        </button>
      </div>
    </form>
  );
}
