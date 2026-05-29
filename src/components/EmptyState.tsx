export default function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {body && <p className="mt-2 text-sm text-slate-500">{body}</p>}
    </div>
  );
}
