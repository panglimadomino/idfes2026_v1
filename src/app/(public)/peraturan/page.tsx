import { getActiveEvent } from "@/lib/site-data";

export default function PeraturanPage() {
  const activeEvent = getActiveEvent();

  return (
    <div className="site-frame space-y-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">Peraturan</h1>
        <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">
          Setiap event memiliki technical handbook, dengan lampiran peraturan teknis per kategori dalam format PDF.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6">
        <h2 className="font-title text-4xl uppercase text-[var(--ink-strong)]">{activeEvent.name}</h2>
        <a
          href={activeEvent.technicalHandbook.fileUrl}
          className="inline-flex rounded-full bg-[var(--ink-strong)] px-4 py-2 text-sm font-bold text-[var(--surface-card)]"
        >
          {activeEvent.technicalHandbook.title}
        </a>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {activeEvent.regulations.map((document) => (
          <article key={document.title} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--ink-strong)]">{document.title}</h3>
            <a href={document.fileUrl} className="mt-3 inline-flex text-sm font-bold text-[var(--brand-olive)]">
              Buka PDF
            </a>
          </article>
        ))}
      </section>
    </div>
  );
}

