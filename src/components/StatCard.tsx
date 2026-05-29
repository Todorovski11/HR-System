import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
};

export default function StatCard({ label, value, hint, icon: Icon }: Props) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
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
    </div>
  );
}
