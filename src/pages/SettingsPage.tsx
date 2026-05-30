import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('app_settings').select('*').eq('key', 'general').maybeSingle();
      if (data?.value && typeof data.value === 'object') {
        setSettings({ ...defaultSettings, ...(data.value as Partial<SettingsValue>) });
      }
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

  return (
    <div>
      <PageHeader title={t('nav.settings')} description={t('settings.description')} />
      <form className="grid max-w-2xl gap-4 rounded-lg border border-line bg-white p-4 shadow-sm" onSubmit={save}>
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
    </div>
  );
}
