import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import type { AbsenceWithEmployee } from '../types/database';
import { formatDate, monthLabel } from '../utils/dates';

export default function CalendarPage() {
  const [absences, setAbsences] = useState<AbsenceWithEmployee[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('absences').select('*, employees(id, full_name, yearly_vacation_days)').order('start_date');
      setAbsences((data ?? []) as AbsenceWithEmployee[]);
    };
    void load();
  }, []);

  const grouped = useMemo(() => {
    return absences.reduce<Record<string, AbsenceWithEmployee[]>>((groups, absence) => {
      const key = monthLabel(absence.start_date);
      groups[key] = groups[key] ?? [];
      groups[key].push(absence);
      return groups;
    }, {});
  }, [absences]);

  return (
    <div>
      <PageHeader title={t('nav.calendar')} description={t('calendar.description')} />
      {absences.length === 0 ? (
        <EmptyState title={t('calendar.empty')} />
      ) : (
        <div className="grid gap-6">
          {Object.entries(grouped).map(([month, items]) => (
            <section key={month}>
              <h2 className="mb-3 text-lg font-semibold text-ink">{month}</h2>
              <div className="grid gap-3">
                {items.map((absence) => (
                  <div key={absence.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-ink">{absence.employees?.full_name ?? t('common.unknownEmployee')}</p>
                        <p className="text-sm text-slate-600">
                          {formatDate(absence.start_date)} - {formatDate(absence.end_date)} · {absence.number_of_days} {t('common.days')}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <TypeBadge value={absence.type} />
                        <StatusBadge value={absence.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
