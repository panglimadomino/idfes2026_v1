import Link from "next/link";
import { getActiveEvent } from "@/lib/site-data";

export default function HomePage() {
  const activeEvent = getActiveEvent();
  const heroCategory = activeEvent.categories[0];

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

      <section className="site-frame px-6 py-16">
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
