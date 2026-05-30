import { Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">{t('common.loading')}</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
