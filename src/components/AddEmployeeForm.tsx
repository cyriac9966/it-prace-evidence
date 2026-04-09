"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddEmployeeForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        fields?: Record<string, string[] | undefined>;
        user?: { email: string };
      };
      if (!res.ok) {
        if (data.fields) setFieldErrors(data.fields);
        setError(data.error ?? "Vytvoření účtu selhalo.");
        return;
      }
      setSuccess(`Účet ${data.user?.email ?? email} byl vytvořen. Předejte zaměstnanci přihlašovací údaje.`);
      setEmail("");
      setName("");
      setPassword("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const hint = (key: string) => {
    const v = fieldErrors[key];
    if (!v?.length) return null;
    return <p className="mt-1 text-xs text-red-300">{v.join(" ")}</p>;
  };

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-6"
    >
      <h2 className="text-lg font-medium">Přidat zaměstnance</h2>
      <p className="text-sm text-[var(--muted)]">
        Nový účet má roli zaměstnanec – může zapisovat a upravovat jen svou práci. Akce se zapisuje do
        auditního logu.
      </p>
      {error && (
        <p className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
          {success}
        </p>
      )}
      <div>
        <label htmlFor="emp-email" className="mb-1 block text-sm text-[var(--muted)]">
          E-mail (přihlašovací jméno)
        </label>
        <input
          id="emp-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
          required
        />
        {hint("email")}
      </div>
      <div>
        <label htmlFor="emp-name" className="mb-1 block text-sm text-[var(--muted)]">
          Jméno
        </label>
        <input
          id="emp-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
          required
        />
        {hint("name")}
      </div>
      <div>
        <label htmlFor="emp-pass" className="mb-1 block text-sm text-[var(--muted)]">
          Počáteční heslo (min. 8 znaků)
        </label>
        <input
          id="emp-pass"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
          required
          minLength={8}
        />
        {hint("password")}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? "Vytvářím…" : "Vytvořit účet"}
      </button>
    </form>
  );
}
