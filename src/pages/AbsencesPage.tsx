import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Edit, History, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../components/EmptyState';
import HistoryList from '../components/HistoryList';
import PageHeader from '../components/PageHeader';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import type { AbsenceHistory, AbsenceStatus, AbsenceWithEmployee, Employee } from '../types/database';
import { formatDate } from '../utils/dates';

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AbsencesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [absences, setAbsences] = useState<AbsenceWithEmployee[]>([]);
  const [history, setHistory] = useState<AbsenceHistory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const { t } = useTranslation();
  const todayKey = dateKey(new Date());

  const load = async () => {
    const [absenceResult, employeeResult, historyResult] = await Promise.all([
      supabase.from('absences').select('*, employees(id, full_name, yearly_vacation_days)').order('start_date', { ascending: false }),
      supabase.from('employees').select('*').order('full_name'),
      supabase.from('absence_history').select('*, profiles(email, full_name)').order('changed_at', { ascending: false }),
    ]);
    setAbsences((absenceResult.data ?? []) as AbsenceWithEmployee[]);
    setEmployees(employeeResult.data ?? []);
    setHistory((historyResult.data ?? []) as AbsenceHistory[]);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const view = searchParams.get('view');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const employee = searchParams.get('employee');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    setEmployeeFilter(employee ?? 'all');
    setTypeFilter(type ?? 'all');

    if (view === 'today') {
      setStatusFilter('approved');
      setFrom(todayKey);
      setTo(todayKey);
      return;
    }

    if (view === 'upcoming') {
      setStatusFilter('all');
      setFrom(todayKey);
      setTo('');
      return;
    }

    setStatusFilter(status ?? 'all');
    setFrom(fromDate ?? '');
    setTo(toDate ?? '');
  }, [searchParams, todayKey]);

  const filtered = useMemo(() => {
    const view = searchParams.get('view');
    return absences.filter((absence) => {
      return (
        (employeeFilter === 'all' || absence.employee_id === employeeFilter) &&
        (statusFilter === 'all' || absence.status === statusFilter) &&
        (view !== 'upcoming' || absence.status !== 'rejected') &&
        (typeFilter === 'all' || absence.type === typeFilter) &&
        (!from || absence.end_date >= from) &&
        (!to || absence.start_date <= to)
      );
    });
  }, [absences, employeeFilter, from, searchParams, statusFilter, to, typeFilter]);

  const selectedHistory = history.filter((item) => item.absence_id === selectedHistoryId);

  const updateStatus = async (id: string, status: AbsenceStatus) => {
    await supabase.from('absences').update({ status }).eq('id', id);
    await load();
  };

  const deleteAbsence = async (id: string) => {
    if (!window.confirm(t('absences.deleteConfirm'))) return;
    await supabase.from('absences').delete().eq('id', id);
    await load();
  };

  const statusOptions: AbsenceStatus[] = ['pending', 'approved', 'rejected'];

  return (
    <div>
      <PageHeader
        title={t('nav.absences')}
        description={t('absences.description')}
        action={
          <Link className="btn-primary" to="/absences/new">
            <Plus size={18} />
            {t('absences.new')}
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <select className="field" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
          <option value="all">{t('common.allEmployees')}</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name}
            </option>
          ))}
        </select>
        <select className="field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">{t('common.allStatuses')}</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {t(`statuses.${status}`)}
            </option>
          ))}
        </select>
        <select className="field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="all">{t('common.allTypes')}</option>
          {['vacation', 'sick', 'personal', 'unpaid', 'other'].map((type) => (
            <option key={type} value={type}>
              {t(`absenceTypes.${type}`)}
            </option>
          ))}
        </select>
        <input className="field" type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label={t('common.fromDate')} />
        <input className="field" type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label={t('common.toDate')} />
        <button
          className="btn-secondary"
          onClick={() => {
            setEmployeeFilter('all');
            setStatusFilter('all');
            setTypeFilter('all');
            setFrom('');
            setTo('');
            setSearchParams({});
          }}
        >
          {t('common.clear')}
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('absences.noFound')} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('common.employee')}</th>
                  <th className="px-4 py-3">{t('common.type')}</th>
                  <th className="px-4 py-3">{t('common.dates')}</th>
                  <th className="px-4 py-3">{t('common.days')}</th>
                  <th className="px-4 py-3">{t('common.status')}</th>
                  <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((absence) => (
                  <tr key={absence.id}>
                    <td className="px-4 py-3 font-medium text-ink">{absence.employees?.full_name ?? t('common.unknownEmployee')}</td>
                    <td className="px-4 py-3">
                      <TypeBadge value={absence.type} />
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(absence.start_date)} - {formatDate(absence.end_date)}
                    </td>
                    <td className="px-4 py-3">{absence.number_of_days}</td>
                    <td className="px-4 py-3">
                      <select className="field max-w-40" value={absence.status} onChange={(event) => void updateStatus(absence.id, event.target.value as AbsenceStatus)}>
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {t(`statuses.${status}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button className="btn-secondary px-3" onClick={() => setSelectedHistoryId(absence.id)} aria-label={t('absences.history')}>
                          <History size={16} />
                        </button>
                        <Link className="btn-secondary px-3" to={`/absences/${absence.id}/edit`} aria-label={t('common.edit')}>
                          <Edit size={16} />
                        </Link>
                        <button className="btn-secondary px-3 text-rose-700" onClick={() => void deleteAbsence(absence.id)} aria-label={t('common.delete')}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 lg:hidden">
            {filtered.map((absence) => (
              <div key={absence.id} className="rounded-md border border-line p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-ink">{absence.employees?.full_name ?? t('common.unknownEmployee')}</p>
                  <StatusBadge value={absence.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {formatDate(absence.start_date)} - {formatDate(absence.end_date)} · {absence.number_of_days} {t('common.days')}
                </p>
                <div className="mt-2">
                  <TypeBadge value={absence.type} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <select className="field col-span-3" value={absence.status} onChange={(event) => void updateStatus(absence.id, event.target.value as AbsenceStatus)}>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {t(`statuses.${status}`)}
                      </option>
                    ))}
                  </select>
                  <button className="btn-secondary" onClick={() => setSelectedHistoryId(absence.id)}>
                    <History size={16} />
                  </button>
                  <Link className="btn-secondary" to={`/absences/${absence.id}/edit`}>
                    <Edit size={16} />
                  </Link>
                  <button className="btn-secondary text-rose-700" onClick={() => void deleteAbsence(absence.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedHistoryId && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">{t('absences.history')}</h2>
            <button className="btn-secondary" onClick={() => setSelectedHistoryId(null)}>
              {t('common.cancel')}
            </button>
          </div>
          <HistoryList items={selectedHistory} emptyTitle={t('employees.noHistory')} />
        </section>
      )}
    </div>
  );
}
