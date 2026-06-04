import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Holiday } from '../types/database';
import { formatDate } from '../utils/dates';

type SettingsValue = {
  app_name: string;
  default_yearly_vacation_days: number;
  current_year: number;
  default_language: 'en' | 'mk';
};

const defaultSettings: SettingsValue = {
  app_name: 'HR Leave Manager',
  default_yearly_vacation_days: 20,
  current_year: new Date().getFullYear(),
  default_language: 'mk',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<SettingsValue>(defaultSettings);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [holidayNotes, setHolidayNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [message, setMessage] = useState('');

  const loadHolidays = async () => {
    const { data } = await supabase.from('holidays').select('*').order('date', { ascending: false });
    setHolidays((data ?? []) as Holiday[]);
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('app_settings').select('*').eq('key', 'general').maybeSingle();
      if (data?.value && typeof data.value === 'object') {
        setSettings({ ...defaultSettings, ...(data.value as Partial<SettingsValue>) });
      }
      await loadHolidays();
    };
    void load();
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const { error } = await supabase.from('app_settings').upsert({
      key: 'general',
      value: settings,
      updated_by: user?.id ?? null,
    });
    if (!error) {
      await i18n.changeLanguage(settings.default_language);
    }
    setSaving(false);
    setMessage(error ? error.message : t('settings.saved'));
  };

  const addHoliday = async (event: FormEvent) => {
    event.preventDefault();
    if (!holidayDate || !holidayName.trim()) return;
    setSavingHoliday(true);
    setMessage('');
    const { error } = await supabase.from('holidays').upsert(
      {
        date: holidayDate,
        name: holidayName.trim(),
        notes: holidayNotes.trim() || null,
        created_by: user?.id ?? null,
      },
      { onConflict: 'date' },
    );
    if (!error) {
      setHolidayDate('');
      setHolidayName('');
      setHolidayNotes('');
      await loadHolidays();
    }
    setSavingHoliday(false);
    setMessage(error ? error.message : t('settings.holidaySaved'));
  };

  const deleteHoliday = async (holiday: Holiday) => {
    if (!window.confirm(t('settings.deleteHolidayConfirm', { name: holiday.name }))) return;
    await supabase.from('holidays').delete().eq('id', holiday.id);
    await loadHolidays();
  };

  return (
    <div>
      <PageHeader title={t('nav.settings')} description={t('settings.description')} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)]">
        <form className="grid gap-4 rounded-lg border border-line bg-white p-4 shadow-sm" onSubmit={save}>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            {t('settings.appName')}
            <input className="field" value={settings.app_name} onChange={(event) => setSettings((current) => ({ ...current, app_name: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            {t('settings.defaultVacation')}
            <input
              className="field"
              min={0}
              type="number"
              value={settings.default_yearly_vacation_days}
              onChange={(event) => setSettings((current) => ({ ...current, default_yearly_vacation_days: Number(event.target.value) }))}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            {t('settings.currentYear')}
            <input
              className="field"
              min={2000}
              type="number"
              value={settings.current_year}
              onChange={(event) => setSettings((current) => ({ ...current, current_year: Number(event.target.value) }))}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            {t('settings.defaultLanguage')}
            <select
              className="field"
              value={settings.default_language}
              onChange={(event) => setSettings((current) => ({ ...current, default_language: event.target.value as 'en' | 'mk' }))}
            >
              <option value="mk">MK</option>
              <option value="en">EN</option>
            </select>
          </label>
          {message && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
          <div>
            <button className="btn-primary" disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>

        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">{t('settings.holidays')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('settings.holidaysDescription')}</p>
          <form className="mt-4 grid gap-3" onSubmit={addHoliday}>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {t('common.date')}
              <input className="field" required type="date" value={holidayDate} onChange={(event) => setHolidayDate(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {t('settings.holidayName')}
              <input className="field" required value={holidayName} onChange={(event) => setHolidayName(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {t('common.notes')}
              <textarea className="field min-h-20" value={holidayNotes} onChange={(event) => setHolidayNotes(event.target.value)} />
            </label>
            <button className="btn-primary" disabled={savingHoliday}>
              <Plus size={18} />
              {savingHoliday ? t('common.saving') : t('settings.addHoliday')}
            </button>
          </form>

          <div className="mt-5 grid gap-2">
            {holidays.length === 0 ? (
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">{t('settings.noHolidays')}</p>
            ) : (
              holidays.map((holiday) => (
                <div key={holiday.id} className="flex items-start justify-between gap-3 rounded-md border border-line p-3">
                  <div>
                    <p className="font-medium text-ink">{holiday.name}</p>
                    <p className="text-sm text-slate-500">{formatDate(holiday.date)}</p>
                    {holiday.notes && <p className="mt-1 text-sm text-slate-600">{holiday.notes}</p>}
                  </div>
                  <button className="btn-secondary px-3 text-rose-700" type="button" onClick={() => void deleteHoliday(holiday)} aria-label={t('common.delete')}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
