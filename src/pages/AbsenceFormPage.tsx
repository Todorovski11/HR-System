import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AbsenceForm from '../components/AbsenceForm';
import PageHeader from '../components/PageHeader';
import { supabase } from '../lib/supabase';
import type { Absence, Employee } from '../types/database';
import type { AbsenceFormValues } from '../types/forms';
import { useAuth } from '../hooks/useAuth';

export default function AbsenceFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [absence, setAbsence] = useState<Absence | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const employeeId = params.get('employee');

  useEffect(() => {
    const load = async () => {
      const employeeResult = await supabase.from('employees').select('*').order('full_name');
      setEmployees(employeeResult.data ?? []);
      if (id) {
        const { data } = await supabase.from('absences').select('*').eq('id', id).maybeSingle();
        setAbsence(data ?? null);
      }
    };
    void load();
  }, [id]);

  const save = async (values: AbsenceFormValues) => {
    setSaving(true);
    const payload = {
      ...values,
      created_by: user?.id ?? null,
      reason: values.reason || null,
    };
    if (id) {
      await supabase.from('absences').update(payload).eq('id', id);
    } else {
      await supabase.from('absences').insert(payload);
    }
    setSaving(false);
    navigate('/absences');
  };

  return (
    <div>
      <PageHeader title={id ? 'Edit absence' : 'New absence'} description="Calendar days are counted from start date through end date, including weekends." />
      <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <AbsenceForm absence={absence} employees={employees} employeeId={employeeId} saving={saving} onCancel={() => navigate(-1)} onSubmit={save} />
      </div>
    </div>
  );
}
