import React from 'react';
import ReactDOM from 'react-dom/client';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import './i18n';
import './index.css';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailsPage from './pages/EmployeeDetailsPage';
import AbsencesPage from './pages/AbsencesPage';
import AbsenceFormPage from './pages/AbsenceFormPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import PersonalHoursPage from './pages/PersonalHoursPage';
import PersonalHoursFormPage from './pages/PersonalHoursFormPage';
import DepartmentSchedulePage from './pages/DepartmentSchedulePage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'employees', element: <EmployeesPage /> },
      { path: 'employees/:id', element: <EmployeeDetailsPage /> },
      { path: 'absences', element: <AbsencesPage /> },
      { path: 'absences/new', element: <AbsenceFormPage /> },
      { path: 'absences/:id/edit', element: <AbsenceFormPage /> },
      { path: 'personal-hours', element: <PersonalHoursPage /> },
      { path: 'personal-hours/new', element: <PersonalHoursFormPage /> },
      { path: 'personal-hours/:id/edit', element: <PersonalHoursFormPage /> },
      { path: 'department-schedule', element: <DepartmentSchedulePage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
