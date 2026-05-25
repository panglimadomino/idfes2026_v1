import { getActiveEvent } from "@/lib/site-data";

export default function RegistrationFormPage() {
  const activeEvent = getActiveEvent();

  return (
    <div className="site-frame space-y-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">Form Pendaftaran</h1>
        <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">
          Form publik untuk event aktif. Versi ini adalah kerangka UI; backend Supabase dan OTP email akan disambungkan
          di tahap berikutnya.
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6">
        <h2 className="text-lg font-bold text-[var(--ink-strong)]">Event Aktif: {activeEvent.name}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeEvent.categories.map((category) => (
            <div key={category.slug} className="rounded-xl border border-[var(--line-soft)] p-4">
              <p className="text-sm font-bold text-[var(--ink-strong)]">{category.name}</p>
              <p className="text-xs text-[var(--ink-soft)]">
                Kuota {category.registered}/{category.quota}
              </p>
            </div>
          ))}
        </div>
      </section>

      <form className="grid gap-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Pilih Kategori
          <select className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]">
            {activeEvent.categories.map((category) => (
              <option key={category.slug}>{category.name}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Email (OTP)
          <input
            type="email"
            placeholder="nama@email.com"
            className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
          />
        </label>

        <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Nama Atlet 1
          <input className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]" />
        </label>

        <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Nomor WhatsApp Atlet 1
          <input className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]" />
        </label>

        <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Nama Atlet 2
          <input className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]" />
        </label>

        <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Nomor WhatsApp Atlet 2
          <input className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]" />
        </label>

        <div className="md:col-span-2">
          <button type="button" className="rounded-full bg-[var(--ink-strong)] px-6 py-3 text-sm font-bold text-[var(--surface-card)]">
            Kirim Pendaftaran
          </button>
        </div>
      </form>
    </div>
  );
}

