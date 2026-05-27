import Link from "next/link";
import { getActiveEvent } from "@/lib/site-data";
import { extractProvinceLabel, getPublishedEvents } from "@/lib/public-events";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID");
}

export default async function HomePage() {
  const activeEvent = getActiveEvent();
  const heroCategory = activeEvent.categories[0];
  const publishedEvents = await getPublishedEvents(8);

  return (
    <div>
      <section
        className="relative min-h-[82vh] border-b border-black/20 bg-cover bg-center text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,.68), rgba(0,0,0,.68)), url('/images/hero-surabaya-domino-2026.webp')",
        }}
      >
        <div className="site-frame flex min-h-[82vh] items-center justify-center px-6 py-20 text-center">
          <div className="max-w-3xl space-y-4">
            <p className="text-5xl font-black leading-none sm:text-6xl">22-25 October 2026</p>
            <h1 className="text-4xl font-black leading-tight sm:text-6xl">
              A city that plays. A festival that celebrates.
            </h1>
            <p className="text-xl">Public Registration is now open.</p>
            <p className="text-3xl font-black">{heroCategory?.name ?? "Public Registration"}</p>
            <p className="text-3xl font-semibold">5 May 2026</p>
            <Link
              href="/form-pendaftaran"
              className="mt-2 inline-flex bg-white px-10 py-4 text-2xl font-bold text-black transition hover:bg-zinc-100"
            >
              Register Now
            </Link>
            <p className="pt-4 text-2xl">Stay tuned to our official channels for more updates.</p>
          </div>
        </div>
      </section>

      <section id="id-fes-2026" className="site-frame px-6 py-16 pb-24">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-title text-5xl uppercase leading-none text-[var(--ink-strong)]">ID Fes 2026</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">Roadshow event per provinsi. Geser untuk melihat hingga 8 event.</p>
          </div>
          <Link href="/event" className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white hover:bg-black/85">
            Lihat Semua
          </Link>
        </div>

        {publishedEvents.length > 0 ? (
          <div className="grid auto-cols-[85%] grid-flow-col gap-4 overflow-x-auto pb-3 md:auto-cols-[calc((100%-1rem)/2)]">
            {publishedEvents.map((event) => (
              <article
                key={event.id}
                className="snap-start rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5 shadow-sm min-h-[26rem] md:min-h-[28rem] flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                    {extractProvinceLabel(event.city, event.name)}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-[var(--ink-strong)]">{event.name}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {formatDate(event.start_at)} - {formatDate(event.end_at)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{event.city ?? "-"}</p>
                </div>
                <div className="mt-6">
                  <Link
                    href={`/events/${event.slug}`}
                    className="inline-flex rounded-full border border-black px-4 py-2 text-sm font-semibold text-black hover:bg-black hover:text-white"
                  >
                    Buka Event
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5 text-sm text-[var(--ink-soft)]">
            Belum ada event published.
          </div>
        )}
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="site-frame px-6 py-24">
        <div className="text-center">
          <h2 className="text-6xl font-bold text-black">Race Results</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {["2025", "2024", "2023"].map((year) => (
              <button
                key={year}
                type="button"
                className="min-w-36 bg-black px-8 py-6 text-4xl font-bold text-white transition hover:bg-black/80"
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        </div>
      </section>

      <section className="site-frame grid gap-12 px-6 pb-20 lg:grid-cols-2">
        <div>
          <h2 className="text-7xl font-semibold leading-tight text-[var(--ink-strong)]">
            Indonesia Domino Festival is not simply about games!
          </h2>
        </div>
        <div className="space-y-7">
          <p className="text-4xl leading-relaxed text-[var(--ink-soft)]">
            It&apos;s about sparking a city-wide festivity that resonates through every sector, lighting up Indonesia in
            the continuous spirit of #LangkahBersama.
          </p>
          <div className="aspect-video overflow-hidden bg-black">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/N5B1d2BI6m8"
              title="IDFES Teaser"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </div>
  );
}
