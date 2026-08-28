export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-stone-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-teal-800" />
      {label}…
    </div>
  );
}
