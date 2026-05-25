import Link from "next/link";
import { festivalEvents, getActiveEvent, getEventStatus } from "@/lib/site-data";

export default function EventPage() {
  const activeEvent = getActiveEvent();

  return (
    <div className="site-frame space-y-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">Event</h1>
        <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">
          Halaman ini menampilkan daftar event roadshow IDFES 2026, sekaligus ringkasan kategori dari event aktif.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-title text-4xl uppercase text-[var(--ink-strong)]">Daftar Event</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {festivalEvents.map((event) => {
            const status = getEventStatus(event);
            return (
              <article key={event.slug} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink-soft)]">{event.city}</p>
                    <h3 className="text-2xl font-bold text-[var(--ink-strong)]">{event.name}</h3>
                  </div>
                  <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold text-[var(--ink-strong)]">
                    {status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[var(--ink-soft)]">
                  {new Date(event.startDate).toLocaleDateString("id-ID")} -{" "}
                  {new Date(event.endDate).toLocaleDateString("id-ID")} | {event.venue}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/events/${event.slug}`}
                    className="rounded-full bg-[var(--ink-strong)] px-4 py-2 text-sm font-bold text-[var(--surface-card)]"
                  >
                    Lihat Detail Event
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-title text-4xl uppercase text-[var(--ink-strong)]">Kategori Event Aktif</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeEvent.categories.map((category) => (
            <article key={category.slug} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">{category.venue}</p>
              <h3 className="mt-2 text-lg font-bold text-[var(--ink-strong)]">{category.name}</h3>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Kuota {category.registered}/{category.quota}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/events/${activeEvent.slug}/categories/${category.slug}`}
                  className="rounded-full bg-[var(--surface-muted)] px-4 py-2 text-xs font-bold text-[var(--ink-strong)]"
                >
                  Detail
                </Link>
                <Link
                  href="/form-pendaftaran"
                  className="rounded-full border border-[var(--ink-strong)] px-4 py-2 text-xs font-bold text-[var(--ink-strong)]"
                >
                  Daftar
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

