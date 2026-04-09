import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AddEmployeeForm } from "@/components/AddEmployeeForm";

export default async function ZamestnanciPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const employees = await prisma.user.findMany({
    where: { role: Role.USER },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      createdAt: true,
      _count: { select: { entries: true } },
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-white">
          ← Přehled
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Zaměstnanci</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Přidávejte účty pro zaměstnance, kteří budou zapisovat svou práci. Vy jako administrátor práci
          nezadáváte – sledujete záznamy, auditní log a tento seznam.
        </p>
      </div>

      <AddEmployeeForm />

      <section>
        <h2 className="mb-4 text-lg font-medium">Seznam zaměstnanců</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Jméno</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Přihlašovací jméno</th>
                <th className="px-4 py-3 font-medium">Záznamy</th>
                <th className="px-4 py-3 font-medium">Účet od</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)]">
                    Zatím žádní zaměstnanci. Použijte formulář výše.
                  </td>
                </tr>
              )}
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-[var(--border)]/60">
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{e.email}</td>
                  <td className="px-4 py-3 font-mono text-sm text-[var(--muted)]">
                    {e.username ?? "—"}
                  </td>
                  <td className="px-4 py-3">{e._count.entries}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {e.createdAt.toLocaleDateString("cs-CZ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
