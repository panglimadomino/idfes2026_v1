import { getActiveEvent } from "@/lib/site-data";

export default function BeritaPage() {
  const activeEvent = getActiveEvent();

  return (
    <section className="site-frame px-4 py-8 sm:px-8">
      <div className="rounded-4xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">Berita</h1>
        <p className="mt-4 max-w-3xl text-xl text-[var(--ink-soft)]">
          Update terbaru seputar {activeEvent.name} dan rangkaian roadshow ID Fes 2026.
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        {activeEvent.news.map((item) => (
          <article
            key={`${item.title}-${item.publishedAt}`}
            className="rounded-3xl border border-[var(--line-soft)] bg-white p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">{item.publishedAt}</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--ink-strong)]">{item.title}</h2>
            <p className="mt-3 text-[var(--ink-soft)]">{item.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
