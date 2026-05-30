import { useTranslation } from 'react-i18next';
import type { AbsenceHistory, PersonalHoursHistory } from '../types/database';
import { formatDateTime } from '../utils/dates';
import { StatusBadge } from './StatusBadge';
import EmptyState from './EmptyState';

type HistoryItem = AbsenceHistory | PersonalHoursHistory;

function valueStatus(data: Record<string, unknown> | null) {
  const status = data?.status;
  return typeof status === 'string' ? status : null;
}

export default function HistoryList({ items, emptyTitle }: { items: HistoryItem[]; emptyTitle: string }) {
  const { t } = useTranslation();

  if (items.length === 0) return <EmptyState title={emptyTitle} />;

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const previousStatus = valueStatus(item.old_data);
        const newStatus = valueStatus(item.new_data);
        const changedBy = item.profiles?.full_name || item.profiles?.email || '-';
        return (
          <div key={item.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-ink">{t(`historyActions.${item.action}`)}</p>
                <p className="text-sm text-slate-500">{formatDateTime(item.changed_at)}</p>
              </div>
              <p className="text-sm text-slate-500">
                {t('absences.changedBy')}: {changedBy}
              </p>
            </div>
            {(previousStatus || newStatus) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                {previousStatus && (
                  <>
                    <span>{t('absences.previousStatus')}:</span>
                    <StatusBadge value={previousStatus as never} />
                  </>
                )}
                {newStatus && (
                  <>
                    <span>{t('absences.newStatus')}:</span>
                    <StatusBadge value={newStatus as never} />
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
