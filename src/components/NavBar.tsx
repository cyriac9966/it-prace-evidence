"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  user: { name: string; email: string; role: string };
};

export function NavBar({ user }: Props) {
  const router = useRouter();
  const isAdmin = user.role === "ADMIN";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/dashboard" className="font-semibold text-white hover:underline">
            Přehled
          </Link>
          {isAdmin ? (
            <>
              <Link href="/admin/zamestnanci" className="text-[var(--muted)] hover:text-white">
                Zaměstnanci
              </Link>
              <Link href="/prace" className="text-[var(--muted)] hover:text-white">
                Záznamy týmů
              </Link>
              <Link href="/admin/audit" className="text-[var(--muted)] hover:text-white">
                Auditní log
              </Link>
            </>
          ) : (
            <>
              <Link href="/prace" className="text-[var(--muted)] hover:text-white">
                Moje záznamy
              </Link>
              <Link href="/prace/nova" className="text-[var(--muted)] hover:text-white">
                Nový záznam
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[var(--muted)]">
            {user.name}
            {isAdmin && (
              <span className="ml-1 rounded bg-blue-900/50 px-1.5 py-0.5 text-xs text-blue-200">
                admin
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-md border border-[var(--border)] px-3 py-1 text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
          >
            Odhlásit
          </button>
        </div>
      </div>
    </header>
  );
}
