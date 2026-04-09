import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { activityUsesSteps } from "@/lib/activity-form";
import { ACTIVITY_LABEL, RESULT_LABEL } from "@/lib/entry-labels";

export default async function PraceListPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  const entries = await prisma.workEntry.findMany({
    where: isAdmin ? {} : { userId: user.id },
    include: {
      user: { select: { name: true, email: true } },
      steps: true,
    },
    orderBy: { workDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          {isAdmin ? "Záznamy týmů (sledování)" : "Moje záznamy práce"}
        </h1>
        {!isAdmin && (
          <Link
            href="/prace/nova"
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Nový záznam
          </Link>
        )}
      </div>
      {isAdmin && (
        <p className="text-sm text-[var(--muted)]">
          Prohlížíte záznamy všech zaměstnanců pouze ke čtení. Úpravy a mazání provádí autor záznamu.
        </p>
      )}
      <ul className="space-y-3">
        {entries.length === 0 && (
          <li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--muted)]">
            {isAdmin ? (
              <>Zatím žádné záznamy od zaměstnanců. Přidejte zaměstnance v sekci{" "}
                <Link href="/admin/zamestnanci" className="text-[var(--accent)] hover:underline">
                  Zaměstnanci
                </Link>
                .</>
            ) : (
              <>
                Zatím žádné záznamy.{" "}
                <Link href="/prace/nova" className="text-[var(--accent)] hover:underline">
                  Vytvořte první
                </Link>
                .
              </>
            )}
          </li>
        )}
        {entries.map((e) => {
          const minutes = activityUsesSteps(e.activityType)
            ? e.steps.reduce((s, x) => s + x.minutes, 0)
            : null;
          return (
            <li key={e.id}>
              <Link
                href={`/prace/${e.id}`}
                className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{e.title}</span>
                  <span className="text-sm text-[var(--muted)]">
                    {new Date(e.workDate).toLocaleDateString("cs-CZ")}
                    {minutes != null ? ` · ${minutes} min celkem` : ""}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-[var(--bg)] px-2 py-0.5 text-[var(--muted)]">
                    {ACTIVITY_LABEL[e.activityType]}
                  </span>
                  <span className="rounded bg-[var(--bg)] px-2 py-0.5 text-[var(--muted)]">
                    {RESULT_LABEL[e.resultStatus]}
                  </span>
                </div>
                {isAdmin && (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {e.user.name} ({e.user.email})
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
