import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, Edit } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import EmployeeForm from '../components/EmployeeForm';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import type { Absence, Employee } from '../types/database';
import type { EmployeeFormValues } from '../types/forms';
import { formatDate } from '../utils/dates';
import { employeeBalance } from '../utils/leave';

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const year = new Date().getFullYear();

  const load = async () => {
    if (!id) return;
    const [employeeResult, absenceResult] = await Promise.all([
      supabase.from('employees').select('*').eq('id', id).maybeSingle(),
      supabase.from('absences').select('*').eq('employee_id', id).order('start_date', { ascending: false }),
    ]);
    setEmployee(employeeResult.data ?? null);
    setAbsences(absenceResult.data ?? []);
  };

  useEffect(() => {
    void load();
  }, [id]);

  const balance = useMemo(() => (employee ? employeeBalance(employee, absences, year) : null), [absences, employee, year]);

  const saveEmployee = async (values: EmployeeFormValues) => {
    if (!employee) return;
    setSaving(true);
    await supabase
      .from('employees')
      .update({
        ...values,
        email: values.email || null,
        phone: values.phone || null,
        job_title: values.job_title || null,
        department: values.department || null,
        employment_start_date: values.employment_start_date || null,
        notes: values.notes || null,
      })
      .eq('id', employee.id);
    setSaving(false);
    setEditing(false);
    await load();
  };

  if (!employee) {
    return (
      <div>
        <Link className="btn-secondary mb-4" to="/employees">
          <ArrowLeft size={18} />
          Employees
        </Link>
        <EmptyState title="Employee not found" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={employee.full_name}
        description={`${employee.job_title ?? 'Employee'}${employee.department ? ` · ${employee.department}` : ''}`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="btn-secondary" to="/employees">
              <ArrowLeft size={18} />
              Back
            </Link>
            <button className="btn-secondary" onClick={() => setEditing(true)}>
              <Edit size={18} />
              Edit
            </button>
            <button className="btn-primary" onClick={() => navigate(`/absences/new?employee=${employee.id}`)}>
              <CalendarPlus size={18} />
              Add absence
            </button>
          </div>
        }
      />

      {editing && (
        <div className="mb-6 rounded-lg border border-line bg-white p-4 shadow-sm">
          <EmployeeForm employee={employee} saving={saving} onCancel={() => setEditing(false)} onSubmit={saveEmployee} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarPlus} label="Yearly allowance" value={employee.yearly_vacation_days} />
        <StatCard icon={CalendarPlus} label="Used vacation" value={balance?.vacationUsed ?? 0} />
        <StatCard icon={CalendarPlus} label="Remaining vacation" value={balance?.vacationRemaining ?? 0} />
        <StatCard icon={CalendarPlus} label="Sick days this year" value={balance?.sickUsed ?? 0} />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-ink">Employee info</h2>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-ink">{employee.email ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="font-medium text-ink">{employee.phone ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Start date</dt>
              <dd className="font-medium text-ink">{formatDate(employee.employment_start_date)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd>
                <StatusBadge value={employee.employment_status} />
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Notes</dt>
              <dd className="whitespace-pre-wrap font-medium text-ink">{employee.notes ?? '-'}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Absence history</h2>
          {absences.length === 0 ? (
            <EmptyState title="No absences for this employee" />
          ) : (
            <div className="grid gap-3">
              {absences.map((absence) => (
                <div key={absence.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">
                        {formatDate(absence.start_date)} - {formatDate(absence.end_date)}
                      </p>
                      <p className="text-sm text-slate-500">{absence.number_of_days} days</p>
                    </div>
                    <div className="flex gap-2">
                      <TypeBadge value={absence.type} />
                      <StatusBadge value={absence.status} />
                    </div>
                  </div>
                  {absence.reason && <p className="mt-3 text-sm text-slate-600">{absence.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
