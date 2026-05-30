import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { supabase } from '../lib/supabase';
import type { Employee, PersonalHoursWithEmployee } from '../types/database';
import { formatDate } from '../utils/dates';

export default function PersonalHoursPage() {
  const [records, setRecords] = useState<PersonalHoursWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { t } = useTranslation();

  const load = async () => {
    const [recordsResult, employeesResult] = await Promise.all([
      supabase.from('personal_hours').select('*, employees(id, full_name)').order('date', { ascending: false }),
      supabase.from('employees').select('*').order('full_name'),
    ]);
    setRecords((recordsResult.data ?? []) as PersonalHoursWithEmployee[]);
    setEmployees(employeesResult.data ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return records.filter((record) => {
      const name = record.employees?.full_name ?? '';
      return (
        (employeeFilter === 'all' || record.employee_id === employeeFilter) &&
        (!from || record.date >= from) &&
        (!to || record.date <= to) &&
        name.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [employeeFilter, from, records, search, to]);

  const deleteRecord = async (id: string) => {
    if (!window.confirm(t('personalHours.deleteConfirm'))) return;
    await supabase.from('personal_hours').delete().eq('id', id);
    await load();
  };

  return (
    <div>
      <PageHeader
        title={t('personalHours.title')}
        description={t('personalHours.description')}
        action={
          <Link className="btn-primary" to="/personal-hours/new">
            <Plus size={18} />
            {t('personalHours.add')}
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <label className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} />
          <input className="field pl-10" placeholder={t('employees.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <select className="field" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
          <option value="all">{t('common.allEmployees')}</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name}
            </option>
          ))}
        </select>
        <input className="field" type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label={t('common.fromDate')} />
        <input className="field" type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label={t('common.toDate')} />
        <button
          className="btn-secondary"
          onClick={() => {
            setEmployeeFilter('all');
            setSearch('');
            setFrom('');
            setTo('');
          }}
        >
          {t('common.clear')}
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('personalHours.noFound')} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('common.employee')}</th>
                  <th className="px-4 py-3">{t('common.date')}</th>
                  <th className="px-4 py-3">{t('personalHours.numberOfHours')}</th>
                  <th className="px-4 py-3">{t('common.notes')}</th>
                  <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 font-medium text-ink">{record.employees?.full_name ?? t('common.unknownEmployee')}</td>
                    <td className="px-4 py-3">{formatDate(record.date)}</td>
                    <td className="px-4 py-3">{record.number_of_hours}</td>
                    <td className="px-4 py-3">{record.notes ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link className="btn-secondary px-3" to={`/personal-hours/${record.id}/edit`} aria-label={t('common.edit')}>
                          <Edit size={16} />
                        </Link>
                        <button className="btn-secondary px-3 text-rose-700" onClick={() => void deleteRecord(record.id)} aria-label={t('common.delete')}>
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
                <p className="mt-2 text-sm text-slate-600">
                  {formatDate(record.date)} · {record.number_of_hours}h
                </p>
                {record.notes && <p className="mt-1 text-sm text-slate-600">{record.notes}</p>}
                <div className="mt-3 flex gap-2">
                  <Link className="btn-secondary flex-1" to={`/personal-hours/${record.id}/edit`}>
                    <Edit size={16} />
                    {t('common.edit')}
                  </Link>
                  <button className="btn-secondary flex-1 text-rose-700" onClick={() => void deleteRecord(record.id)}>
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
