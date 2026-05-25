import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/site-data";

type Props = {
  params: Promise<{ eventSlug: string; categorySlug: string }>;
};

export default async function CategoryDetailPage({ params }: Props) {
  const { eventSlug, categorySlug } = await params;
  const event = getEventBySlug(eventSlug);
  if (!event) notFound();

  const category = event.categories.find((item) => item.slug === categorySlug);
  if (!category) notFound();

  const occupancy = category.quota > 0 ? Math.min(100, Math.round((category.registered / category.quota) * 100)) : 0;

  return (
    <div className="site-frame space-y-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-soft)]">{event.name}</p>
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">{category.name}</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Venue: {category.venue} | Match Start:{" "}
          {new Date(category.matchStartAt).toLocaleDateString("id-ID", { dateStyle: "full" })}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/form-pendaftaran"
            className="rounded-full bg-[var(--ink-strong)] px-5 py-2 text-sm font-bold text-[var(--surface-card)]"
          >
            Daftar Kategori Ini
          </Link>
          <Link
            href={`/events/${event.slug}`}
            className="rounded-full border border-[var(--ink-strong)] px-5 py-2 text-sm font-bold"
          >
            Kembali ke Event
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
          <h2 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Countdown Kategori</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Start pertandingan mengikuti jadwal resmi kategori.</p>
        </article>
        <article className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
          <h2 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Kuota & Gate</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {category.registered}/{category.quota} ({occupancy}%)
          </p>
          <div className="mt-3 h-2 rounded-full bg-[var(--surface-muted)]">
            <div className="h-2 rounded-full bg-[var(--brand-olive)]" style={{ width: `${occupancy}%` }} />
          </div>
        </article>
        <article className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
          <h2 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Update Kategori</h2>
          <ul className="mt-2 space-y-1 text-sm text-[var(--ink-soft)]">
            {category.updates.map((update) => (
              <li key={update}>* {update}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          "Live Report Status Pendaftaran",
          "Pairing RR",
          "Pairing SE",
          "Standing / Klasemen",
          "Bracket / Hasil Pertandingan",
          "Berita Khusus Kategori",
        ].map((item) => (
          <article key={item} className="rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
            <h3 className="text-lg font-bold text-[var(--ink-strong)]">{item}</h3>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">Slot modul ini siap dihubungkan ke API Supabase.</p>
          </article>
        ))}
      </section>
    </div>
  );
}

