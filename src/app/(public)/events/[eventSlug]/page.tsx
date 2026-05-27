import Link from "next/link";
import { notFound } from "next/navigation";
import {
  extractProvinceLabel,
  getPublishedCategoriesByEventId,
  getPublishedEventBySlug,
  getPublishedNewsByEventId,
} from "@/lib/public-events";

type Props = {
  params: Promise<{ eventSlug: string }>;
};

export default async function EventDetailPage({ params }: Props) {
  const { eventSlug } = await params;
  const event = await getPublishedEventBySlug(eventSlug);
  if (!event) notFound();
  const categories = await getPublishedCategoriesByEventId(event.id);
  const news = await getPublishedNewsByEventId(event.id);

  return (
    <div className="site-frame space-y-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-soft)]">{extractProvinceLabel(event.city, event.name)}</p>
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">{event.name}</h1>
        <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">
          {new Date(event.start_at).toLocaleDateString("id-ID")} - {new Date(event.end_at).toLocaleDateString("id-ID")} |{" "}
          {event.venue ?? "-"}
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="font-title text-4xl uppercase text-[var(--ink-strong)]">Kategori</h2>
          <Link href="/form-pendaftaran" className="text-sm font-bold text-[var(--ink-soft)]">
            Buka Form Pendaftaran
          </Link>
        </div>
        {categories.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <article key={category.id} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
                <h3 className="text-xl font-bold text-[var(--ink-strong)]">{category.name}</h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{category.description ?? "Kategori event."}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {category.competition_start_at
                    ? new Date(category.competition_start_at).toLocaleDateString("id-ID")
                    : "Tanggal belum ditentukan"}
                </p>
                <Link
                  href={`/events/${event.slug}/categories/${category.slug}`}
                  className="mt-4 inline-flex rounded-full bg-[var(--ink-strong)] px-4 py-2 text-sm font-bold text-[var(--surface-card)]"
                >
                  Buka Detail Kategori
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5 text-sm text-[var(--ink-soft)]">
            Belum ada kategori event yang dipublish.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-title text-4xl uppercase text-[var(--ink-strong)]">Berita Event</h2>
        {news.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {news.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
                <p className="text-xs font-bold uppercase text-[var(--ink-soft)]">
                  {item.published_at ? new Date(item.published_at).toLocaleDateString("id-ID") : "-"}
                </p>
                <h3 className="mt-2 text-lg font-bold text-[var(--ink-strong)]">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.summary ?? "-"}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5 text-sm text-[var(--ink-soft)]">
            Belum ada berita event yang dipublish.
          </div>
        )}
      </section>
    </div>
  );
}

