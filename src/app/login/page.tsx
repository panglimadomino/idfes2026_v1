export default function LoginPage() {
  return (
    <div className="site-frame max-w-xl space-y-6 px-4 pb-16 pt-8 sm:px-6">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">Login Admin</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Akses admin untuk `super_admin` dan `admin_category` akan dihubungkan ke Supabase Auth.
        </p>
      </section>

      <form className="space-y-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6">
        <label className="block space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Email
          <input
            type="email"
            className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            placeholder="admin@idfes.com"
          />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Password
          <input
            type="password"
            className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            placeholder="********"
          />
        </label>
        <button type="button" className="rounded-full bg-[var(--ink-strong)] px-6 py-3 text-sm font-bold text-[var(--surface-card)]">
          Masuk
        </button>
      </form>
    </div>
  );
}

