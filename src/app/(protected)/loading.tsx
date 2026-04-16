export default function ProtectedLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Načítání">
      <div className="h-8 w-48 rounded-md bg-[var(--border)]" />
      <div className="h-32 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
      <div className="space-y-3">
        <div className="h-20 rounded-lg border border-[var(--border)] bg-[var(--surface)]" />
        <div className="h-20 rounded-lg border border-[var(--border)] bg-[var(--surface)]" />
      </div>
    </div>
  );
}
