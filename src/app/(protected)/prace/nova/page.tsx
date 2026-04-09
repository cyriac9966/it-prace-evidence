import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { EntryForm } from "@/components/EntryForm";

export default async function NovaPracePage() {
  const user = await getSessionUser();
  if (user?.role === "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/prace" className="text-sm text-[var(--muted)] hover:text-white">
          ← Zpět na seznam
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Nový záznam práce</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Vyplňte údaje tak, aby bylo později možné přesně rekonstruovat průběh. U polí je nápověda u
          otazníku – připomene, co do zápisu nezapomenout.
        </p>
      </div>
      <EntryForm mode="create" />
    </div>
  );
}
