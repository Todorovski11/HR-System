import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, Hourglass, Plane, Timer, UserCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import type { AbsenceWithEmployee, Employee, EmployeeDepartmentSchedule, PersonalHoursWithEmployee } from '../types/database';
import { formatDate, isDateInRange } from '../utils/dates';
import { employeeBalance, nextAbsenceDate } from '../utils/leave';
import { hoursByEmployeeThisMonth, hoursInMonth, hoursInYear } from '../utils/personalHours';
import { departmentOptions, normalizeDepartment } from '../utils/departments';
import { compareJobTitles } from '../utils/employeeSort';

function AttendanceBar({
  label,
  total,
  atWork,
  missing,
}: {
  label: string;
  total: number;
  atWork: number;
  missing: number;
}) {
  const { t } = useTranslation();
  const atWorkPercent = total > 0 ? Math.round((atWork / total) * 100) : 0;
  const missingPercent = total > 0 ? Math.round((missing / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">{label}</p>
          <p className="text-sm text-slate-500">{total} {t('dashboard.totalInGroup')}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-emerald-800">{atWork} {t('dashboard.atWorkShort')}</p>
          <p className="font-semibold text-rose-700">{missing} {t('dashboard.missingShort')}</p>
        </div>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="bg-emerald-600" style={{ width: `${atWorkPercent}%` }} />
        <div className="bg-rose-500" style={{ width: `${missingPercent}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{t('dashboard.atWorkNow')}: {atWork}</span>
        <span>{t('dashboard.missingNow')}: {missing}</span>
      </div>
    </div>
  );
}

function AttendancePie({
  label,
  total,
  atWork,
  missing,
}: {
  label: string;
  total: number;
  atWork: number;
  missing: number;
}) {
  const { t } = useTranslation();
  const atWorkPercent = total > 0 ? Math.round((atWork / total) * 100) : 0;
  const missingPercent = total > 0 ? Math.round((missing / total) * 100) : 0;
  const chartBackground =
    total > 0
      ? `conic-gradient(#059669 0 ${atWorkPercent}%, #e11d48 ${atWorkPercent}% 100%)`
      : 'conic-gradient(#e2e8f0 0 100%)';

  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative h-28 w-28 shrink-0 rounded-full" style={{ background: chartBackground }}>
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
            <span className="text-2xl font-bold text-ink">{total}</span>
            <span className="text-xs text-slate-500">{t('dashboard.totalInGroup')}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{label}</p>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                {t('dashboard.atWorkNow')}
              </span>
              <span className="font-semibold text-emerald-800">
                {atWork} ({atWorkPercent}%)
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                {t('dashboard.missingNow')}
              </span>
              <span className="font-semibold text-rose-700">
                {missing} ({missingPercent}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absences, setAbsences] = useState<AbsenceWithEmployee[]>([]);
  const [personalHours, setPersonalHours] = useState<PersonalHoursWithEmployee[]>([]);
  const [departmentSchedules, setDepartmentSchedules] = useState<EmployeeDepartmentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const todayKey = new Date().toISOString().slice(0, 10);
      const [employeeResult, absenceResult, personalHoursResult, scheduleResult] = await Promise.all([
        supabase.from('employees').select('*').order('full_name'),
        supabase.from('absences').select('*, employees(id, full_name, yearly_vacation_days)').order('start_date', { ascending: false }),
        supabase.from('personal_hours').select('*, employees(id, full_name)').order('date', { ascending: false }),
        supabase.from('employee_department_schedules').select('*').eq('date', todayKey),
      ]);
      setEmployees(employeeResult.data ?? []);
      setAbsences((absenceResult.data ?? []) as AbsenceWithEmployee[]);
      setPersonalHours((personalHoursResult.data ?? []) as PersonalHoursWithEmployee[]);
      setDepartmentSchedules(scheduleResult.data ?? []);
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

  const todayAbsences = useMemo(() => {
    return absences.filter((absence) => absence.status === 'approved' && isDateInRange(today, absence.start_date, absence.end_date));
  }, [absences, today]);

  const absentEmployeeIds = useMemo(() => new Set(todayAbsences.map((absence) => absence.employee_id)), [todayAbsences]);

  const departmentAttendance = useMemo(() => {
    const activeEmployees = employees.filter((employee) => employee.employment_status === 'active');
    const scheduleByEmployee = new Map(departmentSchedules.map((schedule) => [schedule.employee_id, schedule.department]));
    return departmentOptions.map((department) => {
      const departmentEmployees = activeEmployees.filter((employee) => {
        const scheduledDepartment = scheduleByEmployee.get(employee.id);
        return normalizeDepartment(scheduledDepartment ?? employee.department) === department;
      });
      const missing = departmentEmployees.filter((employee) => absentEmployeeIds.has(employee.id)).length;
      return {
        department,
        total: departmentEmployees.length,
        missing,
        atWork: departmentEmployees.length - missing,
      };
    });
  }, [absentEmployeeIds, departmentSchedules, employees]);

  const jobTitleAttendance = useMemo(() => {
    const groups = employees
      .filter((employee) => employee.employment_status === 'active')
      .reduce<Record<string, { label: string; total: number; missing: number; atWork: number }>>((result, employee) => {
        const label = employee.job_title?.trim() || t('employees.noJobTitle');
        result[label] = result[label] ?? { label, total: 0, missing: 0, atWork: 0 };
        result[label].total += 1;
        if (absentEmployeeIds.has(employee.id)) {
          result[label].missing += 1;
        } else {
          result[label].atWork += 1;
        }
        return result;
      }, {});

    return Object.values(groups).sort((a, b) => compareJobTitles(a.label, b.label) || b.total - a.total || a.label.localeCompare(b.label, 'mk-MK'));
  }, [absentEmployeeIds, employees, t]);

  const departmentJobTitleAttendance = useMemo(() => {
    const scheduleByEmployee = new Map(departmentSchedules.map((schedule) => [schedule.employee_id, schedule.department]));
    return departmentOptions.map((department) => {
      const groups = employees
        .filter((employee) => employee.employment_status === 'active')
        .filter((employee) => normalizeDepartment(scheduleByEmployee.get(employee.id) ?? employee.department) === department)
        .reduce<Record<string, { label: string; total: number; missing: number; atWork: number }>>((result, employee) => {
          const label = employee.job_title?.trim() || t('employees.noJobTitle');
          result[label] = result[label] ?? { label, total: 0, missing: 0, atWork: 0 };
          result[label].total += 1;
          if (absentEmployeeIds.has(employee.id)) {
            result[label].missing += 1;
          } else {
            result[label].atWork += 1;
          }
          return result;
        }, {});

      return {
        department,
        rows: Object.values(groups).sort((a, b) => compareJobTitles(a.label, b.label) || b.total - a.total || a.label.localeCompare(b.label, 'mk-MK')),
      };
    });
  }, [absentEmployeeIds, departmentSchedules, employees, t]);

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
        <h2 className="mb-3 text-lg font-semibold text-ink">{t('dashboard.attendanceByDepartment')}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {departmentAttendance.map((item) => (
            <AttendancePie
              key={item.department}
              label={item.department}
              total={item.total}
              atWork={item.atWork}
              missing={item.missing}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">{t('dashboard.absentTodayDetails')}</h2>
        {todayAbsences.length === 0 ? (
          <EmptyState title={t('dashboard.noAbsentToday')} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {todayAbsences.map((absence) => {
              const employee = employees.find((item) => item.id === absence.employee_id);
              const scheduledDepartment = departmentSchedules.find((schedule) => schedule.employee_id === absence.employee_id)?.department;
              return (
                <div key={absence.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{employee?.full_name ?? absence.employees?.full_name ?? t('common.unknownEmployee')}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {normalizeDepartment(scheduledDepartment ?? employee?.department) || '-'} · {employee?.job_title ?? t('employees.noJobTitle')}
                      </p>
                    </div>
                    <TypeBadge value={absence.type} />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {formatDate(absence.start_date)} - {formatDate(absence.end_date)} · {absence.number_of_days} {t('common.days')}
                  </p>
                  {absence.reason && <p className="mt-2 text-sm text-slate-600">{absence.reason}</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">{t('dashboard.attendanceByJobTitle')}</h2>
        {jobTitleAttendance.length === 0 ? (
          <EmptyState title={t('dashboard.noEmployees')} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {jobTitleAttendance.map((item) => (
              <AttendanceBar key={item.label} label={item.label} total={item.total} atWork={item.atWork} missing={item.missing} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">{t('dashboard.attendanceByDepartmentAndJobTitle')}</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {departmentJobTitleAttendance.map((group) => (
            <div key={group.department} className="rounded-lg border border-line bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold text-ink">{group.department}</h3>
              {group.rows.length === 0 ? (
                <p className="text-sm text-slate-500">{t('dashboard.noEmployees')}</p>
              ) : (
                <div className="grid gap-3">
                  {group.rows.map((row) => {
                    const atWorkPercent = row.total > 0 ? Math.round((row.atWork / row.total) * 100) : 0;
                    const missingPercent = row.total > 0 ? Math.round((row.missing / row.total) * 100) : 0;
                    return (
                      <div key={row.label}>
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-ink">{row.label}</p>
                          <p className="whitespace-nowrap text-xs text-slate-500">
                            {row.atWork}/{row.total} {t('dashboard.atWorkShort')}
                          </p>
                        </div>
                        <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="bg-emerald-600" style={{ width: `${atWorkPercent}%` }} />
                          <div className="bg-rose-500" style={{ width: `${missingPercent}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {t('dashboard.missingNow')}: {row.missing}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

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
