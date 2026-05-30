import { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DepartmentScheduleForm from '../components/DepartmentScheduleForm';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { DepartmentScheduleFormValues } from '../types/forms';
import type { Employee, EmployeeDepartmentSchedule, EmployeeDepartmentScheduleWithEmployee } from '../types/database';
import { formatDate } from '../utils/dates';

export default function DepartmentSchedulePage() {
  const [records, setRecords] = useState<EmployeeDepartmentScheduleWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<EmployeeDepartmentSchedule | null>(null);
  const [showForm, setShowForm] = useState(false);
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
