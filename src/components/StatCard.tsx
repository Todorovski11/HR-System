import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  to?: string;
};

export default function StatCard({ label, value, hint, icon: Icon, to }: Props) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
        </div>
        <div className="rounded-md bg-emerald-50 p-2 text-emerald-800">
          <Icon size={20} />
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </>
  );

  if (to) {
    return (
      <Link className="block rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md" to={to}>
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      {content}
    </div>
  );
}
