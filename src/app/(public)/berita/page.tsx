import Link from "next/link";
import { formatDateId } from "@/lib/date-id";
import { getPublishedNews } from "@/lib/public-events";

export default async function BeritaPage() {
  const newsItems = await getPublishedNews(60);

  return (
    <section className="site-frame px-4 py-8 sm:px-8">
      <div className="rounded-4xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">Berita</h1>
        <p className="mt-4 max-w-3xl text-xl text-[var(--ink-soft)]">Update terbaru seputar rangkaian roadshow ID Fes 2026.</p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {newsItems.map((item) => (
          <article key={item.id} className="rounded-3xl border border-[var(--line-soft)] bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
              {item.published_at ? formatDateId(item.published_at) : "-"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--ink-strong)]">{item.title}</h2>
            <p className="mt-3 text-[var(--ink-soft)]">{item.summary ?? "Ringkasan artikel belum tersedia."}</p>
            <div className="mt-4">
              <Link
                href={`/berita/${item.id}`}
                className="inline-flex rounded-full border border-black px-4 py-2 text-xs font-bold text-black hover:bg-black hover:text-white"
              >
                baca semua
              </Link>
            </div>
          </article>
        ))}
        {newsItems.length === 0 ? (
          <article className="rounded-3xl border border-[var(--line-soft)] bg-white p-6 text-[var(--ink-soft)]">
            Belum ada berita yang dipublish.
          </article>
        ) : null}
      </div>
    </section>
  );
}
