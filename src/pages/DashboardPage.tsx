import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, Hourglass, Plane, UserCheck, Users } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import type { AbsenceWithEmployee, Employee } from '../types/database';
import { formatDate, isDateInRange } from '../utils/dates';
import { employeeBalance, nextAbsenceDate } from '../utils/leave';

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absences, setAbsences] = useState<AbsenceWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [employeeResult, absenceResult] = await Promise.all([
        supabase.from('employees').select('*').order('full_name'),
        supabase.from('absences').select('*, employees(id, full_name, yearly_vacation_days)').order('start_date', { ascending: false }),
      ]);
      setEmployees(employeeResult.data ?? []);
      setAbsences((absenceResult.data ?? []) as AbsenceWithEmployee[]);
      setLoading(false);
    };
    void load();
  }, []);

  const today = new Date();
  const stats = useMemo(() => {
    const currentLeave = absences.filter((absence) => absence.status === 'approved' && isDateInRange(today, absence.start_date, absence.end_date));
    const pending = absences.filter((absence) => absence.status === 'pending');
    const upcoming = absences.filter((absence) => absence.status !== 'rejected' && absence.start_date >= today.toISOString().slice(0, 10));
    const approvedThisMonth = absences.filter((absence) => {
      const date = new Date(absence.start_date);
      return absence.status === 'approved' && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    });

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((employee) => employee.employment_status === 'active').length,
      currentLeave: currentLeave.length,
      upcoming: upcoming.length,
      pending: pending.length,
      approvedDaysThisMonth: approvedThisMonth.reduce((total, absence) => total + absence.number_of_days, 0),
    };
  }, [absences, employees, today]);

  const absenceRows = absences.map((absence) => ({ ...absence, employees: absence.employees }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live overview of employees, absences, vacation balance, and pending requests."
        action={
          <Link className="btn-primary" to="/absences/new">
            <CalendarCheck size={18} />
            Add absence
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Total employees" value={stats.totalEmployees} />
        <StatCard icon={UserCheck} label="Active employees" value={stats.activeEmployees} />
        <StatCard icon={Plane} label="On leave today" value={stats.currentLeave} />
        <StatCard icon={Clock} label="Upcoming absences" value={stats.upcoming} />
        <StatCard icon={Hourglass} label="Pending requests" value={stats.pending} />
        <StatCard icon={CalendarCheck} label="Approved days this month" value={stats.approvedDaysThisMonth} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">Vacation balance</h2>
        {loading ? (
          <EmptyState title="Loading balances..." />
        ) : employees.length === 0 ? (
          <EmptyState title="No employees yet" body="Add employees to start tracking balances." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Used vacation</th>
                    <th className="px-4 py-3">Remaining</th>
                    <th className="px-4 py-3">Sick days</th>
                    <th className="px-4 py-3">Next absence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {employees.map((employee) => {
                    const balance = employeeBalance(employee, absenceRows, year);
                    return (
                      <tr key={employee.id}>
                        <td className="px-4 py-3 font-medium text-ink">{employee.full_name}</td>
                        <td className="px-4 py-3">{balance.vacationUsed}</td>
                        <td className="px-4 py-3">{balance.vacationRemaining}</td>
                        <td className="px-4 py-3">{balance.sickUsed}</td>
                        <td className="px-4 py-3">{formatDate(nextAbsenceDate(employee.id, absenceRows))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-3 md:hidden">
              {employees.map((employee) => {
                const balance = employeeBalance(employee, absenceRows, year);
                return (
                  <div key={employee.id} className="rounded-md border border-line p-3">
                    <p className="font-semibold text-ink">{employee.full_name}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Vacation {balance.vacationUsed} used / {balance.vacationRemaining} remaining
                    </p>
                    <p className="text-sm text-slate-600">Sick days: {balance.sickUsed}</p>
                    <p className="text-sm text-slate-600">Next: {formatDate(nextAbsenceDate(employee.id, absenceRows))}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">Recent absences</h2>
        {absences.length === 0 ? (
          <EmptyState title="No absence records yet" />
        ) : (
          <div className="grid gap-3">
            {absences.slice(0, 6).map((absence) => (
              <div key={absence.id} className="flex flex-col gap-2 rounded-lg border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink">{absence.employees?.full_name ?? 'Unknown employee'}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(absence.start_date)} - {formatDate(absence.end_date)} · {absence.number_of_days} days
                  </p>
                </div>
                <div className="flex gap-2">
                  <TypeBadge value={absence.type} />
                  <StatusBadge value={absence.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
