import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, Hourglass, Plane, Timer, UserCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import type { AbsenceWithEmployee, Employee, PersonalHoursWithEmployee } from '../types/database';
import { formatDate, isDateInRange } from '../utils/dates';
import { employeeBalance, nextAbsenceDate } from '../utils/leave';
import { hoursByEmployeeThisMonth, hoursInMonth, hoursInYear } from '../utils/personalHours';

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absences, setAbsences] = useState<AbsenceWithEmployee[]>([]);
  const [personalHours, setPersonalHours] = useState<PersonalHoursWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [employeeResult, absenceResult, personalHoursResult] = await Promise.all([
        supabase.from('employees').select('*').order('full_name'),
        supabase.from('absences').select('*, employees(id, full_name, yearly_vacation_days)').order('start_date', { ascending: false }),
        supabase.from('personal_hours').select('*, employees(id, full_name)').order('date', { ascending: false }),
      ]);
      setEmployees(employeeResult.data ?? []);
      setAbsences((absenceResult.data ?? []) as AbsenceWithEmployee[]);
      setPersonalHours((personalHoursResult.data ?? []) as PersonalHoursWithEmployee[]);
      setLoading(false);
    };
    void load();
  }, []);

  const today = useMemo(() => new Date(), []);
  const stats = useMemo(() => {
    const currentLeave = absences.filter((absence) => absence.status === 'approved' && isDateInRange(today, absence.start_date, absence.end_date));
    const pending = absences.filter((absence) => absence.status === 'pending');
    const upcoming = absences.filter((absence) => absence.status !== 'rejected' && absence.start_date >= today.toISOString().slice(0, 10));
    const approvedVacationThisMonth = absences.filter((absence) => {
      const date = new Date(absence.start_date);
      return absence.status === 'approved' && absence.type === 'vacation' && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    });

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((employee) => employee.employment_status === 'active').length,
      currentLeave: currentLeave.length,
      upcoming: upcoming.length,
      pending: pending.length,
      approvedVacationDaysThisMonth: approvedVacationThisMonth.reduce((total, absence) => total + absence.number_of_days, 0),
      personalHoursThisMonth: hoursInMonth(personalHours, today),
      personalHoursThisYear: hoursInYear(personalHours, year),
    };
  }, [absences, employees, personalHours, today, year]);

  const topPersonalHours = hoursByEmployeeThisMonth(personalHours, today)
    .slice(0, 5)
    .map(([employeeId, hours]) => ({
      employee: employees.find((employee) => employee.id === employeeId),
      hours,
    }));

  return (
    <div>
      <PageHeader
        title={t('nav.dashboard')}
        description={t('dashboard.description')}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="btn-secondary" to="/personal-hours/new">
              <Timer size={18} />
              {t('personalHours.add')}
            </Link>
            <Link className="btn-primary" to="/absences/new">
              <CalendarCheck size={18} />
              {t('absences.add')}
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label={t('dashboard.totalEmployees')} value={stats.totalEmployees} />
        <StatCard icon={UserCheck} label={t('dashboard.activeEmployees')} value={stats.activeEmployees} />
        <StatCard icon={Plane} label={t('dashboard.absentToday')} value={stats.currentLeave} />
        <StatCard icon={Clock} label={t('dashboard.upcomingAbsences')} value={stats.upcoming} />
        <StatCard icon={Hourglass} label={t('dashboard.pendingAbsences')} value={stats.pending} />
        <StatCard icon={CalendarCheck} label={t('dashboard.approvedVacationThisMonth')} value={stats.approvedVacationDaysThisMonth} />
        <StatCard icon={Timer} label={t('dashboard.personalHoursThisMonth')} value={stats.personalHoursThisMonth} />
        <StatCard icon={Timer} label={t('dashboard.personalHoursThisYear')} value={stats.personalHoursThisYear} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">{t('dashboard.vacationBalance')}</h2>
        {loading ? (
          <EmptyState title={t('common.loading')} />
        ) : employees.length === 0 ? (
          <EmptyState title={t('dashboard.noEmployees')} body={t('dashboard.addEmployees')} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{t('common.employee')}</th>
                    <th className="px-4 py-3">{t('dashboard.usedVacation')}</th>
                    <th className="px-4 py-3">{t('dashboard.remainingDays')}</th>
                    <th className="px-4 py-3">{t('dashboard.sickDays')}</th>
                    <th className="px-4 py-3">{t('dashboard.nextAbsence')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {employees.map((employee) => {
                    const balance = employeeBalance(employee, absences, year);
                    return (
                      <tr key={employee.id}>
                        <td className="px-4 py-3 font-medium text-ink">{employee.full_name}</td>
                        <td className="px-4 py-3">{balance.vacationUsed}</td>
                        <td className="px-4 py-3">{balance.vacationRemaining}</td>
                        <td className="px-4 py-3">{balance.sickUsed}</td>
                        <td className="px-4 py-3">{formatDate(nextAbsenceDate(employee.id, absences))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-3 md:hidden">
              {employees.map((employee) => {
                const balance = employeeBalance(employee, absences, year);
                return (
                  <div key={employee.id} className="rounded-md border border-line p-3">
                    <p className="font-semibold text-ink">{employee.full_name}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {t('dashboard.usedVacation')}: {balance.vacationUsed} / {t('dashboard.remainingDays')}: {balance.vacationRemaining}
                    </p>
                    <p className="text-sm text-slate-600">{t('dashboard.sickDays')}: {balance.sickUsed}</p>
                    <p className="text-sm text-slate-600">{t('dashboard.nextAbsence')}: {formatDate(nextAbsenceDate(employee.id, absences))}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">{t('dashboard.recentAbsences')}</h2>
          {absences.length === 0 ? (
            <EmptyState title={t('dashboard.noAbsences')} />
          ) : (
            <div className="grid gap-3">
              {absences.slice(0, 6).map((absence) => (
                <div key={absence.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{absence.employees?.full_name ?? t('common.unknownEmployee')}</p>
                      <p className="text-sm text-slate-500">
                        {formatDate(absence.start_date)} - {formatDate(absence.end_date)} · {absence.number_of_days} {t('common.days')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <TypeBadge value={absence.type} />
                      <StatusBadge value={absence.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">{t('dashboard.recentPersonalHours')}</h2>
          {personalHours.length === 0 ? (
            <EmptyState title={t('dashboard.noPersonalHours')} />
          ) : (
            <div className="grid gap-3">
              {personalHours.slice(0, 6).map((record) => (
                <div key={record.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                  <p className="font-semibold text-ink">{record.employees?.full_name ?? t('common.unknownEmployee')}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(record.date)} · {record.number_of_hours}h
                  </p>
                  {record.notes && <p className="mt-2 text-sm text-slate-600">{record.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">{t('dashboard.mostPersonalHours')}</h2>
        {topPersonalHours.length === 0 ? (
          <EmptyState title={t('dashboard.noPersonalHours')} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topPersonalHours.map((item) => (
              <div key={item.employee?.id ?? item.hours} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                <p className="font-semibold text-ink">{item.employee?.full_name ?? t('common.unknownEmployee')}</p>
                <p className="mt-2 text-2xl font-bold text-emerald-800">{item.hours}h</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
