import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Plus, Trash2 } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import type { AbsenceStatus, AbsenceWithEmployee, Employee } from '../types/database';
import { formatDate } from '../utils/dates';

export default function AbsencesPage() {
  const [absences, setAbsences] = useState<AbsenceWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    const [absenceResult, employeeResult] = await Promise.all([
      supabase.from('absences').select('*, employees(id, full_name, yearly_vacation_days)').order('start_date', { ascending: false }),
      supabase.from('employees').select('*').order('full_name'),
    ]);
    setAbsences((absenceResult.data ?? []) as AbsenceWithEmployee[]);
    setEmployees(employeeResult.data ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return absences.filter((absence) => {
      return (
        (employeeFilter === 'all' || absence.employee_id === employeeFilter) &&
        (statusFilter === 'all' || absence.status === statusFilter) &&
        (typeFilter === 'all' || absence.type === typeFilter) &&
        (!from || absence.end_date >= from) &&
        (!to || absence.start_date <= to)
      );
    });
  }, [absences, employeeFilter, from, statusFilter, to, typeFilter]);

  const updateStatus = async (id: string, status: AbsenceStatus) => {
    await supabase.from('absences').update({ status }).eq('id', id);
    await load();
  };

  const deleteAbsence = async (id: string) => {
    if (!window.confirm('Delete this absence record?')) return;
    await supabase.from('absences').delete().eq('id', id);
    await load();
  };

  return (
    <div>
      <PageHeader
        title="Absences"
        description="Filter, approve, reject, edit, and delete leave records."
        action={
          <Link className="btn-primary" to="/absences/new">
            <Plus size={18} />
            New absence
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <select className="field" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
          <option value="all">All employees</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name}
            </option>
          ))}
        </select>
        <select className="field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="all">All types</option>
          <option value="vacation">Vacation</option>
          <option value="sick">Sick</option>
          <option value="personal">Personal</option>
          <option value="unpaid">Unpaid</option>
          <option value="other">Other</option>
        </select>
        <input className="field" type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
        <input className="field" type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
        <button
          className="btn-secondary"
          onClick={() => {
            setEmployeeFilter('all');
            setStatusFilter('all');
            setTypeFilter('all');
            setFrom('');
            setTo('');
          }}
        >
          Clear
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No absences found" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((absence) => (
                  <tr key={absence.id}>
                    <td className="px-4 py-3 font-medium text-ink">{absence.employees?.full_name ?? 'Unknown employee'}</td>
                    <td className="px-4 py-3">
                      <TypeBadge value={absence.type} />
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(absence.start_date)} - {formatDate(absence.end_date)}
                    </td>
                    <td className="px-4 py-3">{absence.number_of_days}</td>
                    <td className="px-4 py-3">
                      <select className="field max-w-36" value={absence.status} onChange={(event) => void updateStatus(absence.id, event.target.value as AbsenceStatus)}>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link className="btn-secondary px-3" to={`/absences/${absence.id}/edit`} aria-label="Edit absence">
                          <Edit size={16} />
                        </Link>
                        <button className="btn-secondary px-3 text-rose-700" onClick={() => void deleteAbsence(absence.id)} aria-label="Delete absence">
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
                  <p className="font-semibold text-ink">{absence.employees?.full_name ?? 'Unknown employee'}</p>
                  <StatusBadge value={absence.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {formatDate(absence.start_date)} - {formatDate(absence.end_date)} · {absence.number_of_days} days
                </p>
                <div className="mt-2">
                  <TypeBadge value={absence.type} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <select className="field col-span-3" value={absence.status} onChange={(event) => void updateStatus(absence.id, event.target.value as AbsenceStatus)}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <Link className="btn-secondary col-span-2" to={`/absences/${absence.id}/edit`}>
                    <Edit size={16} />
                    Edit
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
    </div>
  );
}
