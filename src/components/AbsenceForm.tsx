import { useEffect, useMemo, useState } from 'react';
import type { Absence, Employee } from '../types/database';
import type { AbsenceFormValues } from '../types/forms';
import { countCalendarDays } from '../utils/dates';

const emptyAbsence: AbsenceFormValues = {
  employee_id: '',
  type: 'vacation',
  start_date: '',
  end_date: '',
  number_of_days: 0,
  status: 'pending',
  reason: '',
};

export default function AbsenceForm({
  absence,
  employees,
  employeeId,
  onSubmit,
  onCancel,
  saving,
}: {
  absence?: Absence | null;
  employees: Employee[];
  employeeId?: string | null;
  onSubmit: (values: AbsenceFormValues) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [values, setValues] = useState<AbsenceFormValues>({ ...emptyAbsence, employee_id: employeeId ?? '' });

  useEffect(() => {
    if (absence) {
      setValues({
        employee_id: absence.employee_id,
        type: absence.type,
        start_date: absence.start_date,
        end_date: absence.end_date,
        number_of_days: absence.number_of_days,
        status: absence.status,
        reason: absence.reason ?? '',
      });
    } else {
      setValues({ ...emptyAbsence, employee_id: employeeId ?? '' });
    }
  }, [absence, employeeId]);

  const calculatedDays = useMemo(() => countCalendarDays(values.start_date, values.end_date), [values.end_date, values.start_date]);

  useEffect(() => {
    setValues((current) => ({ ...current, number_of_days: calculatedDays }));
  }, [calculatedDays]);

  const update = (field: keyof AbsenceFormValues, value: string | number) => {
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
          Employee
          <select className="field" required value={values.employee_id} onChange={(event) => update('employee_id', event.target.value)}>
            <option value="">Choose employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Type
          <select className="field" value={values.type} onChange={(event) => update('type', event.target.value)}>
            <option value="vacation">Vacation</option>
            <option value="sick">Sick</option>
            <option value="personal">Personal</option>
            <option value="unpaid">Unpaid</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Start date
          <input className="field" required type="date" value={values.start_date} onChange={(event) => update('start_date', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          End date
          <input className="field" required type="date" value={values.end_date} onChange={(event) => update('end_date', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Days
          <input className="field" readOnly value={values.number_of_days} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Status
          <select className="field" value={values.status} onChange={(event) => update('status', event.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Reason / note
        <textarea className="field min-h-24" value={values.reason} onChange={(event) => update('reason', event.target.value)} />
      </label>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" disabled={saving || !values.number_of_days}>
          {saving ? 'Saving...' : 'Save absence'}
        </button>
      </div>
    </form>
  );
}
