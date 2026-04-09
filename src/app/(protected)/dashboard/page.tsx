import Link from "next/link";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  if (user.role === "ADMIN") {
    const [employeeCount, entryCount, minutesAgg] = await Promise.all([
      prisma.user.count({ where: { role: Role.USER } }),
      prisma.workEntry.count(),
      prisma.workStep.aggregate({ _sum: { minutes: true } }),
    ]);
    const totalMinutes = minutesAgg._sum.minutes ?? 0;

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Přehled pro administrátora</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Do systému nezadáváte vlastní práci. Spravujete zaměstnance, sledujete jejich záznamy a
            auditní log (včetně vytvoření účtů a přihlášení).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-sm text-[var(--muted)]">Zaměstnanci</p>
            <p className="mt-1 text-3xl font-semibold">{employeeCount}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-sm text-[var(--muted)]">Záznamy práce (všichni)</p>
            <p className="mt-1 text-3xl font-semibold">{entryCount}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-sm text-[var(--muted)]">Nahrané minuty celkem</p>
            <p className="mt-1 text-3xl font-semibold">{totalMinutes}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/zamestnanci"
            className="rounded-md bg-[var(--accent)] px-4 py-2 font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Správa zaměstnanců
          </Link>
          <Link
            href="/prace"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
          >
            Záznamy týmů (náhled)
          </Link>
          <Link
            href="/admin/audit"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
          >
            Auditní log
          </Link>
        </div>
      </div>
    );
  }

  const [myCount, totalMinutesAgg] = await Promise.all([
    prisma.workEntry.count({ where: { userId: user.id } }),
    prisma.workStep.aggregate({
      where: { entry: { userId: user.id } },
      _sum: { minutes: true },
    }),
  ]);

  const totalMinutes = totalMinutesAgg._sum.minutes ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Vítejte, {user.name}</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Zapisujte práci podle typu činnosti (technická práce, komunikace, analýza), vyplňte kdo
          zadal, kde se řešilo a jaký je výsledek. U polí jsou nápovědy (?). Všechny změny zaznamenává
          auditní log pro administrátora.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-sm text-[var(--muted)]">Vaše záznamy</p>
          <p className="mt-1 text-3xl font-semibold">{myCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-sm text-[var(--muted)]">Nahrané minuty (součet kroků)</p>
          <p className="mt-1 text-3xl font-semibold">{totalMinutes}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/prace/nova"
          className="rounded-md bg-[var(--accent)] px-4 py-2 font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Nový záznam práce
        </Link>
        <Link
          href="/prace"
          className="rounded-md border border-[var(--border)] px-4 py-2 text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
        >
          Seznam záznamů
        </Link>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-6">
        <h2 className="font-medium">Pravidla zápisu</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--muted)]">
          <li>
            Typy práce: technika, podpora, komunikace, analýza, implementace, testování, administrativa
            – formulář se podle typu sám přizpůsobí.
          </li>
          <li>Vždy uveďte zadavatele, místo řešení a stav výsledku (vyřešeno / ne / čeká).</li>
          <li>Důkaz je volitelný. Úpravy a mazání vidí administrátor v auditním logu.</li>
        </ul>
      </section>
    </div>
  );
}
