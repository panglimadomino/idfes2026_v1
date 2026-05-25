import Link from "next/link";
import { festivalEvents, getEventStatus } from "@/lib/site-data";

export default function EventsArchivePage() {
  return (
    <div className="site-frame space-y-6 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">Arsip Event</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Semua seri roadshow IDFES ditampilkan di sini dengan halaman detail yang permanen.
        </p>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {festivalEvents.map((event) => (
          <article key={event.slug} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6">
            <p className="text-xs font-bold uppercase text-[var(--ink-soft)]">{getEventStatus(event)}</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--ink-strong)]">{event.name}</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              {event.city} | {event.venue}
            </p>
            <Link
              href={`/events/${event.slug}`}
              className="mt-4 inline-flex rounded-full bg-[var(--ink-strong)] px-4 py-2 text-sm font-bold text-[var(--surface-card)]"
            >
              Buka Halaman Event
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

