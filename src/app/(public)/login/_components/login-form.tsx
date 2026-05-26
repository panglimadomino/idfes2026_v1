"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginFormProps = {
  nextPath: string;
  unauthorized: boolean;
};

export function LoginForm({ nextPath, unauthorized }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function waitForTimeout(ms: number) {
    return new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Permintaan login timeout. Coba lagi.")), ms);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const signInResult = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        waitForTimeout(15000),
      ]);

      if (signInResult.error) {
        setError(signInResult.error.message);
        return;
      }

      // Use hard navigation so auth cookies are guaranteed to be picked up by middleware/server.
      window.location.assign(nextPath);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Gagal login. Coba lagi.";
      setError(message);
    } finally {
      setLoading(false);
    }
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
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 pr-12 text-[var(--ink-strong)]"
              placeholder="********"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-2 inline-flex items-center text-[var(--ink-soft)] hover:text-[var(--ink-strong)]"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                  <path d="M9.9 5.2A11 11 0 0112 5c5.2 0 9 4.5 9 7s-1.3 4.2-3.2 5.5" />
                  <path d="M6.3 6.3C4.2 7.7 3 9.7 3 12c0 2.5 3.8 7 9 7 1.9 0 3.5-.6 4.9-1.4" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
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
