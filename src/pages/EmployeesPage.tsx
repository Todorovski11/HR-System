import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../components/EmptyState';
import EmployeeForm from '../components/EmployeeForm';
import PageHeader from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import type { AbsenceType, AbsenceWithEmployee, Employee } from '../types/database';
import type { EmployeeFormValues } from '../types/forms';
import { compareJobTitles, sortEmployeesByRoleOrder } from '../utils/employeeSort';
import { isDateInRange } from '../utils/dates';
import { employeeVacationSummary } from '../utils/leave';

type SortKey = 'job_title' | 'department' | 'service_years';
type SortDirection = 'asc' | 'desc';

const excelMimeType = 'application/vnd.ms-excel;charset=utf-8;';

type EmployeeExportColumn = {
  label: string;
  value: (employee: Employee) => string | number | null | undefined;
};

function escapeExcelValue(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadEmployeesExcel(filename: string, employees: Employee[], columns: EmployeeExportColumn[]) {
  const header = columns.map((column) => `<th>${escapeExcelValue(column.label)}</th>`).join('');
  const rows = employees
    .map((employee) => {
      const cells = columns.map((column) => `<td>${escapeExcelValue(column.value(employee))}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <table border="1">
      <thead><tr>${header}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`;

  const blob = new Blob(['\ufeff', html], { type: excelMimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function absenceDateRanges(employee: Employee, absences: AbsenceWithEmployee[], type: AbsenceType, year: number) {
  return absences
    .filter((absence) => {
      return absence.employee_id === employee.id && absence.type === type && absence.status === 'approved' && absence.start_date.slice(0, 4) === String(year);
    })
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .map((absence) => {
      const range = absence.start_date === absence.end_date ? absence.start_date : `${absence.start_date} - ${absence.end_date}`;
      return `${range} (${absence.number_of_days})`;
    })
    .join('; ');
}

export default function EmployeesPage() {
  const [searchParams] = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absences, setAbsences] = useState<AbsenceWithEmployee[]>([]);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [attendance, setAttendance] = useState('all');
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  const { t } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();

  const loadEmployees = async () => {
    const [employeeResult, absenceResult] = await Promise.all([
      supabase.from('employees').select('*').order('full_name'),
      supabase.from('absences').select('*, employees(id, full_name, yearly_vacation_days)'),
    ]);
    setEmployees(employeeResult.data ?? []);
    setAbsences((absenceResult.data ?? []) as AbsenceWithEmployee[]);
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setStatus(searchParams.get('status') ?? 'all');
    setAttendance(searchParams.get('attendance') ?? 'all');
  }, [searchParams]);

  const absentEmployeeIds = useMemo(() => {
    return new Set(
      absences
        .filter((absence) => absence.status === 'approved' && isDateInRange(today, absence.start_date, absence.end_date))
        .map((absence) => absence.employee_id),
    );
  }, [absences, today]);

  const filtered = useMemo(() => {
    const matching = employees.filter((employee) => {
      const matchesSearch = `${employee.full_name} ${employee.email ?? ''}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === 'all' || employee.employment_status === status;
      const matchesAttendance =
        attendance === 'all' ||
        (attendance === 'present' && employee.employment_status === 'active' && !absentEmployeeIds.has(employee.id)) ||
        (attendance === 'absent' && absentEmployeeIds.has(employee.id));
      return matchesSearch && matchesStatus && matchesAttendance;
    });
    const base = sort ? [...matching] : sortEmployeesByRoleOrder(matching);

    if (!sort) return base;

    return base.sort((a, b) => {
      const modifier = sort.direction === 'asc' ? 1 : -1;
      if (sort.key === 'job_title') {
        return (compareJobTitles(a.job_title, b.job_title) || a.full_name.localeCompare(b.full_name, 'mk-MK')) * modifier;
      }

      if (sort.key === 'department') {
        const departmentCompare = (a.department ?? '').localeCompare(b.department ?? '', 'mk-MK', { numeric: true });
        return (departmentCompare || a.full_name.localeCompare(b.full_name, 'mk-MK')) * modifier;
      }

      const aYears = a.service_years ?? -1;
      const bYears = b.service_years ?? -1;
      return ((aYears - bYears) || a.full_name.localeCompare(b.full_name, 'mk-MK')) * modifier;
    });
  }, [absentEmployeeIds, attendance, employees, search, sort, status]);

  const jobTitleOptions = useMemo(() => {
    return Array.from(new Set(employees.map((employee) => employee.job_title).filter((value): value is string => Boolean(value)))).sort((a, b) =>
      a.localeCompare(b, 'mk-MK'),
    );
  }, [employees]);

  const departmentOptions = useMemo(() => {
    return Array.from(new Set(employees.map((employee) => employee.department).filter((value): value is string => Boolean(value)))).sort((a, b) =>
      a.localeCompare(b, 'mk-MK'),
    );
  }, [employees]);

  const toggleSort = (key: SortKey) => {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const sortIcon = (key: SortKey) => {
    if (sort?.key !== key) return <ArrowUpDown size={14} />;
    return sort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const saveEmployee = async (values: EmployeeFormValues) => {
    setSaving(true);
    const payload = {
      ...values,
      email: values.email || null,
      phone: values.phone || null,
      job_title: values.job_title || null,
      department: values.department || null,
      employment_start_date: values.employment_start_date || null,
      employment_type: values.employment_type,
      service_years: values.service_years === null ? null : Number(values.service_years),
      notes: values.notes || null,
    };
    if (editing) {
      await supabase.from('employees').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('employees').insert(payload);
    }
    setSaving(false);
    setEditing(null);
    setShowForm(false);
    await loadEmployees();
  };

  const deleteEmployee = async (employee: Employee) => {
    if (!window.confirm(t('employees.deleteConfirm', { name: employee.full_name }))) return;
    await supabase.from('employees').delete().eq('id', employee.id);
    await loadEmployees();
  };

  const exportEmployees = () => {
    const columns: EmployeeExportColumn[] = [
      { label: t('employees.fullName'), value: (employee: Employee) => employee.full_name },
      { label: t('common.email'), value: (employee: Employee) => employee.email },
      { label: t('common.phone'), value: (employee: Employee) => employee.phone },
      { label: t('common.jobTitle'), value: (employee: Employee) => employee.job_title },
      { label: t('common.department'), value: (employee: Employee) => employee.department },
      { label: t('employees.serviceYears'), value: (employee: Employee) => employee.service_years },
      { label: t('employees.spentVacationDays'), value: (employee: Employee) => employeeVacationSummary(employee, absences, year, today).spentVacationDays },
      { label: t('employees.availableFutureVacationDays'), value: (employee: Employee) => employeeVacationSummary(employee, absences, year, today).availableFutureVacationDays },
      { label: t('employees.employmentType'), value: (employee: Employee) => employee.employment_type ?? t('employmentTypes.regular') },
      { label: t('common.startDate'), value: (employee: Employee) => employee.employment_start_date },
      { label: t('common.status'), value: (employee: Employee) => t(`statuses.${employee.employment_status}`) },
      { label: t('employees.yearlyVacationDays'), value: (employee: Employee) => employee.yearly_vacation_days },
      { label: t('common.notes'), value: (employee: Employee) => employee.notes },
    ];

    downloadEmployeesExcel(`employees-${new Date().toISOString().slice(0, 10)}.xls`, employees, columns);
  };

  const exportVacationEmployees = () => {
    const columns: EmployeeExportColumn[] = [
      { label: t('employees.fullName'), value: (employee: Employee) => employee.full_name },
      { label: t('common.jobTitle'), value: (employee: Employee) => employee.job_title },
      { label: t('common.department'), value: (employee: Employee) => employee.department },
      { label: t('employees.serviceYears'), value: (employee: Employee) => employee.service_years },
      { label: t('employees.yearlyAllowance'), value: (employee: Employee) => employee.yearly_vacation_days },
      { label: t('employees.spentVacationDays'), value: (employee: Employee) => employeeVacationSummary(employee, absences, year, today).spentVacationDays },
      { label: t('employees.availableFutureVacationDays'), value: (employee: Employee) => employeeVacationSummary(employee, absences, year, today).availableFutureVacationDays },
      { label: `${t('absenceTypes.vacation')} - ${t('common.dates')}`, value: (employee: Employee) => absenceDateRanges(employee, absences, 'vacation', year) },
      { label: `${t('absenceTypes.sick')} - ${t('common.dates')}`, value: (employee: Employee) => absenceDateRanges(employee, absences, 'sick', year) },
      { label: `${t('absenceTypes.personal')} - ${t('common.dates')}`, value: (employee: Employee) => absenceDateRanges(employee, absences, 'personal', year) },
      { label: `${t('absenceTypes.unpaid')} - ${t('common.dates')}`, value: (employee: Employee) => absenceDateRanges(employee, absences, 'unpaid', year) },
      { label: `${t('absenceTypes.other')} - ${t('common.dates')}`, value: (employee: Employee) => absenceDateRanges(employee, absences, 'other', year) },
    ];

    downloadEmployeesExcel(`odmor-export-${new Date().toISOString().slice(0, 10)}.xls`, employees, columns);
  };

  return (
    <div>
      <PageHeader
        title={t('nav.employees')}
        description={t('employees.description')}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="btn-secondary" onClick={exportEmployees} disabled={employees.length === 0}>
              <Download size={18} />
              {t('employees.exportExcel')}
            </button>
            <button className="btn-secondary" onClick={exportVacationEmployees} disabled={employees.length === 0}>
              <Download size={18} />
              {t('employees.exportVacationExcel')}
            </button>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={18} />
              {t('employees.add')}
            </button>
          </div>
        }
      />

      {showForm && (
        <div className="mb-6 rounded-lg border border-line bg-white p-4 shadow-sm">
          <EmployeeForm
            employee={editing}
            saving={saving}
            jobTitleOptions={jobTitleOptions}
            departmentSelectOptions={departmentOptions}
            onCancel={() => {
              setEditing(null);
              setShowForm(false);
            }}
            onSubmit={saveEmployee}
          />
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} />
          <input className="field pl-10" placeholder={t('employees.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">{t('common.allStatuses')}</option>
          <option value="active">{t('statuses.active')}</option>
          <option value="inactive">{t('statuses.inactive')}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('employees.noFound')} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('common.name')}</th>
                  <th className="px-4 py-3">{t('common.email')}</th>
                  <th className="px-4 py-3">
                    <button className="inline-flex items-center gap-1 font-semibold uppercase" onClick={() => toggleSort('job_title')}>
                      {t('common.jobTitle')}
                      {sortIcon('job_title')}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button className="inline-flex items-center gap-1 font-semibold uppercase" onClick={() => toggleSort('department')}>
                      {t('common.department')}
                      {sortIcon('department')}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button className="inline-flex items-center gap-1 font-semibold uppercase" onClick={() => toggleSort('service_years')}>
                      {t('employees.serviceYears')}
                      {sortIcon('service_years')}
                    </button>
                  </th>
                  <th className="px-4 py-3">{t('employees.spentVacationDays')}</th>
                  <th className="px-4 py-3">{t('employees.availableFutureVacationDays')}</th>
                  <th className="px-4 py-3">{t('employees.employmentType')}</th>
                  <th className="px-4 py-3">{t('common.status')}</th>
                  <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((employee) => {
                  const vacationSummary = employeeVacationSummary(employee, absences, year, today);
                  return (
                    <tr key={employee.id}>
                      <td className="px-4 py-3 font-medium text-ink">
                        <Link className="hover:text-emerald-700" to={`/employees/${employee.id}`}>
                          {employee.full_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{employee.email ?? '-'}</td>
                      <td className="px-4 py-3">{employee.job_title ?? '-'}</td>
                      <td className="px-4 py-3">{employee.department ?? '-'}</td>
                      <td className="px-4 py-3">{employee.service_years ?? '-'}</td>
                      <td className="px-4 py-3">{vacationSummary.spentVacationDays}</td>
                      <td className="px-4 py-3">{vacationSummary.availableFutureVacationDays}</td>
                      <td className="px-4 py-3">{employee.employment_type ?? t('employmentTypes.regular')}</td>
                      <td className="px-4 py-3">
                        <StatusBadge value={employee.employment_status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn-secondary px-3"
                            onClick={() => {
                              setEditing(employee);
                              setShowForm(true);
                            }}
                            aria-label={t('common.edit')}
                          >
                            <Edit size={16} />
                          </button>
                          <button className="btn-secondary px-3 text-rose-700" onClick={() => void deleteEmployee(employee)} aria-label={t('common.delete')}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 md:hidden">
            {filtered.map((employee) => {
              const vacationSummary = employeeVacationSummary(employee, absences, year, today);
              return (
                <div key={employee.id} className="rounded-md border border-line p-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link className="font-semibold text-ink" to={`/employees/${employee.id}`}>
                      {employee.full_name}
                    </Link>
                    <StatusBadge value={employee.employment_status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{employee.email ?? t('employees.noEmail')}</p>
                  <p className="text-sm text-slate-600">{employee.job_title ?? t('employees.noJobTitle')}</p>
                  <p className="text-sm text-slate-600">{employee.employment_type ?? t('employmentTypes.regular')}</p>
                  <p className="text-sm text-slate-600">{t('employees.serviceYears')}: {employee.service_years ?? '-'}</p>
                  <p className="text-sm text-slate-600">{t('employees.spentVacationDays')}: {vacationSummary.spentVacationDays}</p>
                  <p className="text-sm text-slate-600">{t('employees.availableFutureVacationDays')}: {vacationSummary.availableFutureVacationDays}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="btn-secondary flex-1"
                      onClick={() => {
                        setEditing(employee);
                        setShowForm(true);
                      }}
                    >
                      <Edit size={16} />
                      {t('common.edit')}
                    </button>
                    <button className="btn-secondary flex-1 text-rose-700" onClick={() => void deleteEmployee(employee)}>
                      <Trash2 size={16} />
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
