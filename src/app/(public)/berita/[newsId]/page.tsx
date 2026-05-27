import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateId } from "@/lib/date-id";
import { getPublishedNewsById } from "@/lib/public-events";

type NewsDetailPageProps = {
  params: Promise<{ newsId: string }>;
};

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { newsId } = await params;
  const news = await getPublishedNewsById(newsId);
  if (!news) notFound();

  return (
    <section className="site-frame px-4 py-8 sm:px-8">
      <article className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
          {news.published_at ? formatDateId(news.published_at) : "-"}
        </p>
        <h1 className="mt-2 font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">{news.title}</h1>

        {news.cover_image_url ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line-soft)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={news.cover_image_url} alt={news.title} className="h-auto w-full object-cover" />
          </div>
        ) : null}

        <p className="mt-6 text-lg text-[var(--ink-soft)]">{news.summary ?? "Ringkasan artikel belum tersedia."}</p>
        <div className="prose mt-6 max-w-none text-[var(--ink-soft)]">
          <p className="whitespace-pre-wrap">{news.body?.trim() || "Isi artikel belum tersedia."}</p>
        </div>

        <div className="mt-8">
          <Link href="/berita" className="inline-flex rounded-full border border-black px-4 py-2 text-xs font-bold text-black hover:bg-black hover:text-white">
            Kembali ke Berita
          </Link>
        </div>
      </article>
    </section>
  );
}
