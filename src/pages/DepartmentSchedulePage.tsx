import { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import DepartmentScheduleForm from '../components/DepartmentScheduleForm';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { DepartmentScheduleFormValues } from '../types/forms';
import type { Employee, EmployeeDepartmentSchedule, EmployeeDepartmentScheduleWithEmployee } from '../types/database';
import { formatDate } from '../utils/dates';
import { departmentOptions } from '../utils/departments';

const departmentColor: Record<string, string> = {
  'Ѕвездички': 'border-sky-200 bg-sky-50 text-sky-900',
  'Први стапки': 'border-emerald-200 bg-emerald-50 text-emerald-900',
  'Бисерчиња': 'border-amber-200 bg-amber-50 text-amber-900',
};

function isSpecialistRole(jobTitle: string | null | undefined) {
  const normalized = (jobTitle ?? '').toLocaleLowerCase('mk-MK');
  return (
    normalized.includes('стручни соработници') ||
    normalized.includes('стручен соработник') ||
    normalized.includes('стручни работници') ||
    normalized.includes('стручен работник')
  );
}

export default function DepartmentSchedulePage() {
  const [records, setRecords] = useState<EmployeeDepartmentScheduleWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<EmployeeDepartmentSchedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [weekPickerDate, setWeekPickerDate] = useState(new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  const load = async () => {
    const [recordsResult, employeesResult] = await Promise.all([
      supabase
        .from('employee_department_schedules')
        .select('*, employees(id, full_name, job_title, department)')
        .order('date', { ascending: true }),
      supabase.from('employees').select('*').eq('employment_status', 'active').order('full_name'),
    ]);
    setRecords((recordsResult.data ?? []) as EmployeeDepartmentScheduleWithEmployee[]);
    setEmployees(employeesResult.data ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return records.filter((record) => (!from || record.date >= from) && (!to || record.date <= to));
  }, [from, records, to]);

  const specialistEmployees = useMemo(() => {
    return employees.filter((employee) => isSpecialistRole(employee.job_title));
  }, [employees]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(parseISO(weekPickerDate), { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_item, index) => {
      const date = addDays(start, index);
      return {
        label: format(date, 'EEE dd.MM'),
        value: format(date, 'yyyy-MM-dd'),
      };
    });
  }, [weekPickerDate]);

  const scheduleByEmployeeDate = useMemo(() => {
    return new Map(records.map((record) => [`${record.employee_id}:${record.date}`, record]));
  }, [records]);

  const save = async (values: DepartmentScheduleFormValues) => {
    setSaving(true);
    const payload = {
      ...values,
      notes: values.notes || null,
      created_by: user?.id ?? null,
    };

    if (editing) {
      await supabase.from('employee_department_schedules').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('employee_department_schedules').upsert(payload, { onConflict: 'employee_id,date' });
    }

    setSaving(false);
    setEditing(null);
    setShowForm(false);
    await load();
  };

  const remove = async (record: EmployeeDepartmentScheduleWithEmployee) => {
    if (!window.confirm(t('departmentSchedule.deleteConfirm'))) return;
    await supabase.from('employee_department_schedules').delete().eq('id', record.id);
    await load();
  };

  const saveGridCell = async (employee: Employee, date: string, department: string) => {
    const existing = scheduleByEmployeeDate.get(`${employee.id}:${date}`);

    if (!department) {
      if (existing) {
        await supabase.from('employee_department_schedules').delete().eq('id', existing.id);
        await load();
      }
      return;
    }

    await supabase.from('employee_department_schedules').upsert(
      {
        employee_id: employee.id,
        date,
        department,
        notes: 'Weekly specialist schedule',
        created_by: user?.id ?? null,
      },
      { onConflict: 'employee_id,date' },
    );
    await load();
  };

  return (
    <div>
      <PageHeader
        title={t('departmentSchedule.title')}
        description={t('departmentSchedule.description')}
        action={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            {t('departmentSchedule.add')}
          </button>
        }
      />

      {showForm && (
        <div className="mb-6 rounded-lg border border-line bg-white p-4 shadow-sm">
          <DepartmentScheduleForm
            record={editing}
            employees={employees}
            saving={saving}
            onCancel={() => {
              setEditing(null);
              setShowForm(false);
            }}
            onSubmit={save}
          />
        </div>
      )}

      <section className="mb-8">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">{t('departmentSchedule.weeklySpecialistCalendar')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('departmentSchedule.weeklySpecialistDescription')}</p>
          </div>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            {t('departmentSchedule.chooseWeek')}
            <input className="field w-full sm:w-48" type="date" value={weekPickerDate} onChange={(event) => setWeekPickerDate(event.target.value)} />
          </label>
        </div>

        {specialistEmployees.length === 0 ? (
          <EmptyState title={t('departmentSchedule.noSpecialists')} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] divide-y divide-line text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="w-64 px-4 py-3">{t('common.employee')}</th>
                    {weekDays.map((day) => (
                      <th key={day.value} className="px-3 py-3">
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {specialistEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{employee.full_name}</p>
                        <p className="text-xs text-slate-500">{employee.job_title ?? '-'}</p>
                      </td>
                      {weekDays.map((day) => {
                        const record = scheduleByEmployeeDate.get(`${employee.id}:${day.value}`);
                        const value = record?.department ?? '';
                        return (
                          <td key={day.value} className="px-3 py-3 align-top">
                            <select
                              className={`w-full rounded-md border px-2 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                value ? departmentColor[value] ?? 'border-line bg-white text-slate-700' : 'border-line bg-white text-slate-500'
                              }`}
                              value={value}
                              onChange={(event) => void saveGridCell(employee, day.value, event.target.value)}
                            >
                              <option value="">{t('departmentSchedule.notScheduled')}</option>
                              {departmentOptions.map((department) => (
                                <option key={department} value={department}>
                                  {department}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <div className="mb-4 grid gap-3 sm:grid-cols-[180px_180px_1fr]">
        <input className="field" type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label={t('common.fromDate')} />
        <input className="field" type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label={t('common.toDate')} />
        <button className="btn-secondary w-fit" onClick={() => { setFrom(''); setTo(''); }}>
          {t('common.clear')}
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('departmentSchedule.empty')} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('common.date')}</th>
                  <th className="px-4 py-3">{t('common.employee')}</th>
                  <th className="px-4 py-3">{t('common.jobTitle')}</th>
                  <th className="px-4 py-3">{t('common.department')}</th>
                  <th className="px-4 py-3">{t('common.notes')}</th>
                  <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3">{formatDate(record.date)}</td>
                    <td className="px-4 py-3 font-medium text-ink">{record.employees?.full_name ?? t('common.unknownEmployee')}</td>
                    <td className="px-4 py-3">{record.employees?.job_title ?? '-'}</td>
                    <td className="px-4 py-3">{record.department}</td>
                    <td className="px-4 py-3">{record.notes ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button className="btn-secondary px-3" onClick={() => { setEditing(record); setShowForm(true); }} aria-label={t('common.edit')}>
                          <Edit size={16} />
                        </button>
                        <button className="btn-secondary px-3 text-rose-700" onClick={() => void remove(record)} aria-label={t('common.delete')}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 md:hidden">
            {filtered.map((record) => (
              <div key={record.id} className="rounded-md border border-line p-3">
                <p className="font-semibold text-ink">{record.employees?.full_name ?? t('common.unknownEmployee')}</p>
                <p className="mt-1 text-sm text-slate-600">{formatDate(record.date)} · {record.department}</p>
                <p className="text-sm text-slate-600">{record.employees?.job_title ?? '-'}</p>
                {record.notes && <p className="mt-2 text-sm text-slate-600">{record.notes}</p>}
                <div className="mt-3 flex gap-2">
                  <button className="btn-secondary flex-1" onClick={() => { setEditing(record); setShowForm(true); }}>
                    <Edit size={16} />
                    {t('common.edit')}
                  </button>
                  <button className="btn-secondary flex-1 text-rose-700" onClick={() => void remove(record)}>
                    <Trash2 size={16} />
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
