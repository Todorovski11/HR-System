import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, Edit, MapPinned, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../components/EmptyState';
import EmployeeForm from '../components/EmployeeForm';
import HistoryList from '../components/HistoryList';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import type { Absence, AbsenceHistory, Employee, PersonalHours, PersonalHoursHistory } from '../types/database';
import type { EmployeeFormValues } from '../types/forms';
import { formatDate } from '../utils/dates';
import { employeeBalance } from '../utils/leave';
import { hoursInMonth, hoursInYear } from '../utils/personalHours';

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [personalHours, setPersonalHours] = useState<PersonalHours[]>([]);
  const [absenceHistory, setAbsenceHistory] = useState<AbsenceHistory[]>([]);
  const [personalHoursHistory, setPersonalHoursHistory] = useState<PersonalHoursHistory[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const year = new Date().getFullYear();

  const load = async () => {
    if (!id) return;
    const [employeeResult, absenceResult, personalHoursResult, absenceHistoryResult, personalHistoryResult] = await Promise.all([
      supabase.from('employees').select('*').eq('id', id).maybeSingle(),
      supabase.from('absences').select('*').eq('employee_id', id).order('start_date', { ascending: false }),
      supabase.from('personal_hours').select('*').eq('employee_id', id).order('date', { ascending: false }),
      supabase
        .from('absence_history')
        .select('*, profiles(email, full_name)')
        .eq('employee_id', id)
        .order('changed_at', { ascending: false }),
      supabase
        .from('personal_hours_history')
        .select('*, profiles(email, full_name)')
        .eq('employee_id', id)
        .order('changed_at', { ascending: false }),
    ]);
    setEmployee(employeeResult.data ?? null);
    setAbsences(absenceResult.data ?? []);
    setPersonalHours(personalHoursResult.data ?? []);
    setAbsenceHistory((absenceHistoryResult.data ?? []) as AbsenceHistory[]);
    setPersonalHoursHistory((personalHistoryResult.data ?? []) as PersonalHoursHistory[]);
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
        service_years: values.service_years === null ? null : Number(values.service_years),
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
          {t('nav.employees')}
        </Link>
        <EmptyState title={t('employees.notFound')} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={employee.full_name}
        description={`${employee.job_title ?? t('common.employee')}${employee.department ? ` · ${employee.department}` : ''}`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="btn-secondary" to="/employees">
              <ArrowLeft size={18} />
              {t('common.back')}
            </Link>
            <button className="btn-secondary" onClick={() => setEditing(true)}>
              <Edit size={18} />
              {t('common.edit')}
            </button>
            <button className="btn-secondary" onClick={() => navigate(`/personal-hours/new?employee=${employee.id}`)}>
              <Timer size={18} />
              {t('personalHours.add')}
            </button>
            <button className="btn-secondary" onClick={() => navigate('/department-schedule')}>
              <MapPinned size={18} />
              {t('departmentSchedule.add')}
            </button>
            <button className="btn-primary" onClick={() => navigate(`/absences/new?employee=${employee.id}`)}>
              <CalendarPlus size={18} />
              {t('absences.add')}
            </button>
          </div>
        }
      />

      {editing && (
        <div className="mb-6 rounded-lg border border-line bg-white p-4 shadow-sm">
          <EmployeeForm employee={employee} saving={saving} onCancel={() => setEditing(false)} onSubmit={saveEmployee} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={CalendarPlus} label={t('employees.yearlyAllowance')} value={employee.yearly_vacation_days} />
        <StatCard icon={CalendarPlus} label={t('employees.usedVacation')} value={balance?.vacationUsed ?? 0} />
        <StatCard icon={CalendarPlus} label={t('employees.remainingVacation')} value={balance?.vacationRemaining ?? 0} />
        <StatCard icon={CalendarPlus} label={t('employees.sickThisYear')} value={balance?.sickUsed ?? 0} />
        <StatCard icon={Timer} label={t('personalHours.thisMonth')} value={hoursInMonth(personalHours)} />
        <StatCard icon={Timer} label={t('personalHours.thisYear')} value={hoursInYear(personalHours, year)} />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-ink">{t('employees.info')}</h2>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-slate-500">{t('common.email')}</dt>
              <dd className="font-medium text-ink">{employee.email ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.phone')}</dt>
              <dd className="font-medium text-ink">{employee.phone ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.startDate')}</dt>
              <dd className="font-medium text-ink">{formatDate(employee.employment_start_date)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('employees.serviceYears')}</dt>
              <dd className="font-medium text-ink">{employee.service_years ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.status')}</dt>
              <dd>
                <StatusBadge value={employee.employment_status} />
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('common.notes')}</dt>
              <dd className="whitespace-pre-wrap font-medium text-ink">{employee.notes ?? '-'}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">{t('employees.absenceHistory')}</h2>
          {absences.length === 0 ? (
            <EmptyState title={t('employees.noAbsences')} />
          ) : (
            <div className="grid gap-3">
              {absences.map((absence) => (
                <div key={absence.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">
                        {formatDate(absence.start_date)} - {formatDate(absence.end_date)}
                      </p>
                      <p className="text-sm text-slate-500">{absence.number_of_days} {t('common.days')}</p>
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

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">{t('employees.personalHoursRecords')}</h2>
        {personalHours.length === 0 ? (
          <EmptyState title={t('employees.noPersonalHours')} />
        ) : (
          <div className="grid gap-3">
            {personalHours.map((record) => (
              <div key={record.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{formatDate(record.date)}</p>
                    <p className="text-sm text-slate-500">{record.number_of_hours}h</p>
                  </div>
                  <Link className="btn-secondary" to={`/personal-hours/${record.id}/edit`}>
                    <Edit size={16} />
                    {t('common.edit')}
                  </Link>
                </div>
                {record.notes && <p className="mt-3 text-sm text-slate-600">{record.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">{t('absences.history')}</h2>
          <HistoryList items={absenceHistory} emptyTitle={t('employees.noHistory')} />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">{t('employees.personalHoursHistory')}</h2>
          <HistoryList items={personalHoursHistory} emptyTitle={t('employees.noHistory')} />
        </section>
      </div>
    </div>
  );
}
