import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AuditPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const page = Math.max(0, parseInt(sp.page ?? "0", 10) || 0);
  const limit = 30;

  const [total, rows] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: page * limit,
      take: limit,
      include: {
        actor: { select: { id: true, email: true, name: true, role: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Auditní log</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Skrytá historie pro administrátora: přihlášení, odhlášení a všechny změny pracovních
          záznamů včetně úplného obsahu před a po úpravě. Smazané záznamy zůstávají v logu v položce
          mazání (payload „před“) – uživatel je v aplikaci nevidí, vy ano.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Čas</th>
              <th className="px-3 py-2 font-medium">Uživatel</th>
              <th className="px-3 py-2 font-medium">Akce</th>
              <th className="px-3 py-2 font-medium">Entita</th>
              <th className="px-3 py-2 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--border)]/60 align-top">
                <td className="whitespace-nowrap px-3 py-2 text-[var(--muted)]">
                  {r.createdAt.toLocaleString("cs-CZ")}
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.actor.name}</div>
                  <div className="text-xs text-[var(--muted)]">{r.actor.email}</div>
                </td>
                <td className="px-3 py-2">{r.action}</td>
                <td className="max-w-md px-3 py-2">
                  <div className="text-xs text-[var(--muted)]">
                    {r.entityType}
                    {r.entityId && ` · ${r.entityId}`}
                  </div>
                  {(r.payloadBefore || r.payloadAfter) && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-[var(--accent)]">Payload</summary>
                      <pre className="mt-2 max-h-48 overflow-auto rounded bg-black/30 p-2 text-xs">
                        {r.payloadBefore && (
                          <>
                            <strong>před:</strong>
                            {"\n"}
                            {r.payloadBefore}
                            {"\n\n"}
                          </>
                        )}
                        {r.payloadAfter && (
                          <>
                            <strong>po:</strong>
                            {"\n"}
                            {r.payloadAfter}
                          </>
                        )}
                      </pre>
                    </details>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--muted)]">
                  {r.ip ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <span className="text-[var(--muted)]">
          Stránka {page + 1} z {totalPages} ({total} záznamů)
        </span>
        <div className="flex gap-2">
          {page > 0 && (
            <Link
              href={`/admin/audit?page=${page - 1}`}
              className="rounded-md border border-[var(--border)] px-3 py-1 hover:border-[var(--accent)]"
            >
              Předchozí
            </Link>
          )}
          {page + 1 < totalPages && (
            <Link
              href={`/admin/audit?page=${page + 1}`}
              className="rounded-md border border-[var(--border)] px-3 py-1 hover:border-[var(--accent)]"
            >
              Další
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
