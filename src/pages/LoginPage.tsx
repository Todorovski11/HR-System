import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  if (!loading && user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (authError) setError(authError.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-panel px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-6">
          <p className="text-2xl font-bold text-ink">{t('login.title')}</p>
          <p className="mt-1 text-sm text-slate-600">{t('login.subtitle')}</p>
        </div>
        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {t('login.missingEnv')}
          </div>
        )}
        <form className="grid gap-4" onSubmit={submit}>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            {t('common.email')}
            <input className="field" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            {t('login.password')}
            <input className="field" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <button className="btn-primary" disabled={submitting || !isSupabaseConfigured}>
            <LogIn size={18} />
            {submitting ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
