"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Přihlášení selhalo.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto max-w-md space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8"
    >
      <h1 className="text-xl font-semibold">Přihlášení</h1>
      <p className="text-sm text-[var(--muted)]">
        <strong>Zaměstnanec</strong> zapisuje svou práci. <strong>Administrátor</strong> přidává účty
        zaměstnanců a sleduje záznamy a auditní log – vlastní práci do systému nezadává.
      </p>
      {error && (
        <p className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-[var(--muted)]">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-[var(--muted)]">
          Heslo
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? "Přihlašuji…" : "Přihlásit"}
      </button>
    </form>
  );
}
