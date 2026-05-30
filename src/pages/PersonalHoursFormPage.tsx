import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PersonalHoursForm from '../components/PersonalHoursForm';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Employee, PersonalHours } from '../types/database';
import type { PersonalHoursFormValues } from '../types/forms';

export default function PersonalHoursFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [record, setRecord] = useState<PersonalHours | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const employeeId = params.get('employee');

  useEffect(() => {
    const load = async () => {
      const employeeResult = await supabase.from('employees').select('*').order('full_name');
      setEmployees(employeeResult.data ?? []);
      if (id) {
        const { data } = await supabase.from('personal_hours').select('*').eq('id', id).maybeSingle();
        setRecord(data ?? null);
      }
    };
    void load();
  }, [id]);

  const save = async (values: PersonalHoursFormValues) => {
    setSaving(true);
    const payload = {
      ...values,
      notes: values.notes || null,
      created_by: user?.id ?? null,
    };
    if (id) {
      await supabase.from('personal_hours').update(payload).eq('id', id);
    } else {
      await supabase.from('personal_hours').insert(payload);
    }
    setSaving(false);
    navigate('/personal-hours');
  };

  return (
    <div>
      <PageHeader title={id ? t('personalHours.edit') : t('personalHours.add')} description={t('personalHours.description')} />
      <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <PersonalHoursForm record={record} employees={employees} employeeId={employeeId} saving={saving} onCancel={() => navigate(-1)} onSubmit={save} />
      </div>
    </div>
  );
}
