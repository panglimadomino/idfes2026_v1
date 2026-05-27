import Link from "next/link";
import { extractProvinceLabel, getPublishedEvents } from "@/lib/public-events";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID");
}

export default async function EventPage() {
  const events = await getPublishedEvents(100);

  return (
    <div className="site-frame space-y-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">Event</h1>
        <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">Daftar event roadshow IDFES 2026 yang sudah dipublish.</p>
      </section>

      <section className="space-y-4">
        <h2 className="font-title text-4xl uppercase text-[var(--ink-strong)]">Daftar Event</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-soft)]">{extractProvinceLabel(event.city, event.name)}</p>
                  <h3 className="text-2xl font-bold text-[var(--ink-strong)]">{event.name}</h3>
                </div>
                <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold text-[var(--ink-strong)]">Published</span>
              </div>
              <p className="mt-3 text-sm text-[var(--ink-soft)]">
                {formatDate(event.start_at)} - {formatDate(event.end_at)} | {event.venue ?? "-"}
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
          ))}
          {events.length === 0 ? (
            <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6 text-sm text-[var(--ink-soft)] lg:col-span-2">
              Belum ada event yang dipublish.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

