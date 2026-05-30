import { NavLink, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock3, LayoutDashboard, LogOut, MapPinned, Menu, Settings, Users, X, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const navItems = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/employees', labelKey: 'nav.employees', icon: Users },
  { to: '/absences', labelKey: 'nav.absences', icon: ClipboardList },
  { to: '/personal-hours', labelKey: 'nav.personalHours', icon: Clock3 },
  { to: '/department-schedule', labelKey: 'nav.departmentSchedule', icon: MapPinned },
  { to: '/calendar', labelKey: 'nav.calendar', icon: CalendarDays },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const logout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-panel">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="text-lg font-bold tracking-normal text-ink">{t('appName')}</p>
            <p className="text-xs text-slate-500">{profile?.role ?? 'admin'} {t('common.adminDashboard')}</p>
          </div>
          <button className="btn-secondary px-3 md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <item.icon size={17} />
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <div className="inline-flex rounded-md border border-line bg-white p-1">
              {['en', 'mk'].map((language) => (
                <button
                  key={language}
                  className={`rounded px-2 py-1 text-xs font-bold ${i18n.language === language ? 'bg-emerald-700 text-white' : 'text-slate-600'}`}
                  onClick={() => void i18n.changeLanguage(language)}
                >
                  {language.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="max-w-44 truncate text-sm text-slate-500">{user?.email}</span>
            <button className="btn-secondary px-3" onClick={logout} aria-label={t('common.logout')}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-line bg-white px-4 py-3 md:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600'
                    }`
                  }
                >
                  <item.icon size={17} />
                  {t(item.labelKey)}
                </NavLink>
              ))}
              <div className="inline-flex w-fit rounded-md border border-line bg-white p-1">
                {['en', 'mk'].map((language) => (
                  <button
                    key={language}
                    className={`rounded px-3 py-1 text-xs font-bold ${i18n.language === language ? 'bg-emerald-700 text-white' : 'text-slate-600'}`}
                    onClick={() => void i18n.changeLanguage(language)}
                  >
                    {language.toUpperCase()}
                  </button>
                ))}
              </div>
              <button className="btn-secondary mt-2" onClick={logout}>
                <LogOut size={17} />
                {t('common.logout')}
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
