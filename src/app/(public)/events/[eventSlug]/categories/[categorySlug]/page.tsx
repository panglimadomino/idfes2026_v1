import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { getPublishedEventBySlug } from "@/lib/public-events";

type Props = {
  params: Promise<{ eventSlug: string; categorySlug: string }>;
};

export default async function CategoryDetailPage({ params }: Props) {
  const { eventSlug, categorySlug } = await params;
  const event = await getPublishedEventBySlug(eventSlug);
  if (!event) notFound();

  const supabase = createSupabaseClient();
  const { data: category } = await supabase
    .from("event_categories")
    .select("id, name, slug, description, competition_start_at, competition_end_at")
    .eq("event_id", event.id)
    .eq("slug", categorySlug)
    .eq("is_published", true)
    .maybeSingle();
  if (!category) notFound();

  return (
    <div className="site-frame space-y-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-soft)]">{event.name}</p>
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">{category.name}</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Match Start:{" "}
          {category.competition_start_at
            ? new Date(category.competition_start_at).toLocaleDateString("id-ID", { dateStyle: "full" })
            : "Belum ditentukan"}
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
          <h2 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Info Kategori</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{category.description ?? "Deskripsi kategori belum tersedia."}</p>
        </article>
        <article className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
          <h2 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Periode Kategori</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {category.competition_start_at ? new Date(category.competition_start_at).toLocaleDateString("id-ID") : "-"} -{" "}
            {category.competition_end_at ? new Date(category.competition_end_at).toLocaleDateString("id-ID") : "-"}
          </p>
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

