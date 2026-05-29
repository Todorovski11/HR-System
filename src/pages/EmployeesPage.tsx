import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import EmployeeForm from '../components/EmployeeForm';
import PageHeader from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import type { Employee } from '../types/database';
import type { EmployeeFormValues } from '../types/forms';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [saving, setSaving] = useState(false);

  const loadEmployees = async () => {
    const { data } = await supabase.from('employees').select('*').order('full_name');
    setEmployees(data ?? []);
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  const filtered = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch = `${employee.full_name} ${employee.email ?? ''}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === 'all' || employee.employment_status === status;
      return matchesSearch && matchesStatus;
    });
  }, [employees, search, status]);

  const saveEmployee = async (values: EmployeeFormValues) => {
    setSaving(true);
    const payload = {
      ...values,
      email: values.email || null,
      phone: values.phone || null,
      job_title: values.job_title || null,
      department: values.department || null,
      employment_start_date: values.employment_start_date || null,
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
    if (!window.confirm(`Delete ${employee.full_name}? This also deletes their absences.`)) return;
    await supabase.from('employees').delete().eq('id', employee.id);
    await loadEmployees();
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Create and maintain employee records used by leave tracking."
        action={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            Add employee
          </button>
        }
      />

      {showForm && (
        <div className="mb-6 rounded-lg border border-line bg-white p-4 shadow-sm">
          <EmployeeForm
            employee={editing}
            saving={saving}
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
          <input className="field pl-10" placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No employees found" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Job title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3 font-medium text-ink">
                      <Link className="hover:text-emerald-700" to={`/employees/${employee.id}`}>
                        {employee.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{employee.email ?? '-'}</td>
                    <td className="px-4 py-3">{employee.job_title ?? '-'}</td>
                    <td className="px-4 py-3">{employee.department ?? '-'}</td>
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
                          aria-label="Edit employee"
                        >
                          <Edit size={16} />
                        </button>
                        <button className="btn-secondary px-3 text-rose-700" onClick={() => void deleteEmployee(employee)} aria-label="Delete employee">
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
            {filtered.map((employee) => (
              <div key={employee.id} className="rounded-md border border-line p-3">
                <div className="flex items-start justify-between gap-3">
                  <Link className="font-semibold text-ink" to={`/employees/${employee.id}`}>
                    {employee.full_name}
                  </Link>
                  <StatusBadge value={employee.employment_status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{employee.email ?? 'No email'}</p>
                <p className="text-sm text-slate-600">{employee.job_title ?? 'No job title'}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    className="btn-secondary flex-1"
                    onClick={() => {
                      setEditing(employee);
                      setShowForm(true);
                    }}
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button className="btn-secondary flex-1 text-rose-700" onClick={() => void deleteEmployee(employee)}>
                    <Trash2 size={16} />
                    Delete
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
