import type { AbsenceStatus, AbsenceType, EmploymentStatus } from '../types/database';
import { useTranslation } from 'react-i18next';

const statusClass: Record<AbsenceStatus | EmploymentStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  inactive: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const typeClass: Record<AbsenceType, string> = {
  vacation: 'bg-sky-50 text-sky-800 ring-sky-200',
  sick: 'bg-rose-50 text-rose-800 ring-rose-200',
  personal: 'bg-violet-50 text-violet-800 ring-violet-200',
  unpaid: 'bg-orange-50 text-orange-800 ring-orange-200',
  other: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function StatusBadge({ value }: { value: AbsenceStatus | EmploymentStatus }) {
  const { t } = useTranslation();
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusClass[value]}`}>{t(`statuses.${value}`)}</span>;
}

export function TypeBadge({ value }: { value: AbsenceType }) {
  const { t } = useTranslation();
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${typeClass[value]}`}>{t(`absenceTypes.${value}`)}</span>;
}
