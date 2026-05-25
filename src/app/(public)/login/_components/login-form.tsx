"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginFormProps = {
  nextPath: string;
  unauthorized: boolean;
};

export function LoginForm({ nextPath, unauthorized }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <div className="site-frame max-w-xl space-y-6 px-4 pb-16 pt-8 sm:px-6">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">Login Admin</h1>
        <p className="mt-3 text-[var(--ink-soft)]">Masuk untuk mengelola CMS IDFES 2026.</p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6">
        <label className="block space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            placeholder="admin@idfes.com"
          />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            placeholder="********"
          />
        </label>

        {unauthorized ? <p className="text-sm font-semibold text-amber-700">Akun ini tidak memiliki akses admin.</p> : null}
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--ink-strong)] px-6 py-3 text-sm font-bold text-[var(--surface-card)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Masuk..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
