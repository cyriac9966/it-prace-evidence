import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import {
  auditRangeToGte,
  buildAuditListQuery,
  describeAuditHumanReadable,
} from "@/lib/audit-diff";
import { prisma } from "@/lib/db";

type Props = {
  searchParams: Promise<{ page?: string; actorId?: string; range?: string }>;
};

export default async function AuditPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const page = Math.max(0, parseInt(sp.page ?? "0", 10) || 0);
  const limit = 30;
  const actorId = sp.actorId?.trim() || undefined;
  const range = sp.range?.trim() || "all";

  const gte = auditRangeToGte(range);
  const where: Prisma.AuditLogWhereInput = {
    ...(actorId ? { actorId } : {}),
    ...(gte ? { createdAt: { gte: gte } } : {}),
  };

  const [employees, total, rows] = await Promise.all([
    prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page * limit,
      take: limit,
      include: {
        actor: { select: { id: true, email: true, name: true, role: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const q = (p: number) =>
    buildAuditListQuery({ page: p, actorId, range: range === "all" ? undefined : range });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Auditní log</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Přehled změn u záznamů práce: u úprav vidíte, co bylo před a co po (např. jiný text u
          „kde se to řešilo“ nebo u kroků). Filtry omezí log na jednoho zaměstnance a zvolené
          období (od teď zpět).
        </p>
      </div>

      <form
        method="get"
        action="/admin/audit"
        className="flex flex-wrap items-end gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <div className="min-w-[200px] flex-1">
          <label htmlFor="audit-actor" className="mb-1 block text-xs text-[var(--muted)]">
            Zaměstnanec (kdo akci provedl)
          </label>
          <select
            id="audit-actor"
            name="actorId"
            defaultValue={actorId ?? ""}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
          >
            <option value="">Všichni</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.email})
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[220px]">
          <label htmlFor="audit-range" className="mb-1 block text-xs text-[var(--muted)]">
            Období
          </label>
          <select
            id="audit-range"
            name="range"
            defaultValue={range}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
          >
            <option value="all">Celé období (vše)</option>
            <option value="24h">Posledních 24 hodin</option>
            <option value="7d">Posledních 7 dní</option>
            <option value="30d">Posledních 30 dní</option>
          </select>
        </div>
        <input type="hidden" name="page" value="0" />
        <button
          type="submit"
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Použít filtry
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Čas</th>
              <th className="px-3 py-2 font-medium">Uživatel</th>
              <th className="px-3 py-2 font-medium">Akce</th>
              <th className="min-w-[280px] px-3 py-2 font-medium">Co se stalo</th>
              <th className="px-3 py-2 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const { headline, changes } = describeAuditHumanReadable(
                r.action,
                r.payloadBefore,
                r.payloadAfter,
              );
              return (
                <tr key={r.id} className="border-b border-[var(--border)]/60 align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-[var(--muted)]">
                    {r.createdAt.toLocaleString("cs-CZ")}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.actor.name}</div>
                    <div className="text-xs text-[var(--muted)]">{r.actor.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{r.action}</td>
                  <td className="max-w-xl px-3 py-2">
                    <div className="font-medium text-white">{headline}</div>
                    {changes.length > 0 && (
                      <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-[var(--muted)]">
                        {changes.map((line, i) => (
                          <li key={i} className="whitespace-pre-wrap break-words">
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(r.payloadBefore || r.payloadAfter) && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-[var(--accent)]">
                          Technický detail (JSON)
                        </summary>
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
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {r.entityType}
                      {r.entityId && ` · ${r.entityId}`}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--muted)]">
                    {r.ip ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <span className="text-[var(--muted)]">
          Stránka {page + 1} z {totalPages} ({total} záznamů
          {actorId || range !== "all" ? " s filtry" : ""})
        </span>
        <div className="flex gap-2">
          {page > 0 && (
            <Link
              href={`/admin/audit${q(page - 1)}`}
              className="rounded-md border border-[var(--border)] px-3 py-1 hover:border-[var(--accent)]"
            >
              Předchozí
            </Link>
          )}
          {page + 1 < totalPages && (
            <Link
              href={`/admin/audit${q(page + 1)}`}
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
