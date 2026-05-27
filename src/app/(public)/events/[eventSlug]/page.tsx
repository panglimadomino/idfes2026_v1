import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateId } from "@/lib/date-id";
import {
  type PublicEventCategory,
  extractProvinceLabel,
  getPublishedCategoriesByEventId,
  getPublishedEventBySlug,
  getPublishedNewsByEventId,
} from "@/lib/public-events";

type Props = {
  params: Promise<{ eventSlug: string }>;
};

function formatWindow(start: string | null, end: string | null) {
  if (!start && !end) return "Belum ditentukan";
  if (start && end) return `${formatDateId(start)} - ${formatDateId(end)}`;
  return start ? formatDateId(start) : formatDateId(end as string);
}

function formatParticipant(category: PublicEventCategory) {
  const count = category.participant_count;
  const unit = category.participant_unit === "pasang" ? "pasang" : category.participant_unit === "athlet" ? "atlet" : "peserta";
  if (!count || count <= 0) return "-";
  return `${count} ${unit}`;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function parseCategoryIdentityLabel(categoryName: string) {
  const parts = categoryName
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    noPertandingan: parts[0] ?? categoryName,
    batasUsia: parts[1] ?? "-",
    jenisKelamin: parts[2] ?? "-",
  };
}

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
          {formatDateId(event.start_at)} - {formatDateId(event.end_at)} |{" "}
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
            {categories.map((category) => {
              const identity = parseCategoryIdentityLabel(category.name);
              return (
                <article key={category.id} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
                  <h3 className="text-xl font-bold text-[var(--ink-strong)]">{category.name}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{category.description ?? "Kategori event."}</p>
                  <dl className="mt-3 space-y-1 text-sm text-[var(--ink-soft)]">
                    <div className="flex justify-between gap-2">
                      <dt>No Pertandingan</dt>
                      <dd>{identity.noPertandingan}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Batas Usia</dt>
                      <dd>{category.age_group ?? identity.batasUsia}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Jenis Kelamin</dt>
                      <dd>{category.gender_category ?? identity.jenisKelamin}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Slug</dt>
                      <dd>{category.slug}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Label Kategori</dt>
                      <dd>{category.name}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Jumlah Peserta</dt>
                      <dd>{formatParticipant(category)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Mulai Pendaftaran</dt>
                      <dd>{category.registration_open_at ? formatDateId(category.registration_open_at) : "-"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Selesai Pendaftaran</dt>
                      <dd>{category.registration_close_at ? formatDateId(category.registration_close_at) : "-"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Mulai Pertandingan</dt>
                      <dd>{category.competition_start_at ? formatDateId(category.competition_start_at) : "-"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Selesai Pertandingan</dt>
                      <dd>{category.competition_end_at ? formatDateId(category.competition_end_at) : "-"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Periode Pendaftaran</dt>
                      <dd>{formatWindow(category.registration_open_at, category.registration_close_at)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Periode Pertandingan</dt>
                      <dd>{formatWindow(category.competition_start_at, category.competition_end_at)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Jumlah Zona</dt>
                      <dd>{category.pairing_zone_count ?? 0}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Jumlah Cluster</dt>
                      <dd>{category.pairing_cluster_count ?? 0}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Jumlah Group</dt>
                      <dd>{category.pairing_group_count ?? 0}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Jumlah Meja</dt>
                      <dd>{category.pairing_table_count ?? 0}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Sort Order</dt>
                      <dd>{category.sort_order ?? "-"}</dd>
                    </div>
                    {category.prize_breakdown.length > 0 ? (
                      <div className="flex justify-between gap-2">
                        <dt>Total Pos Hadiah</dt>
                        <dd>{category.prize_breakdown.length} juara</dd>
                      </div>
                    ) : null}
                    {category.prize_breakdown.map((prize) => (
                      <div key={prize.label} className="flex justify-between gap-2">
                        <dt>{prize.label}</dt>
                        <dd>{formatRupiah(prize.amount)}</dd>
                      </div>
                    ))}
                  </dl>
                  <Link
                    href={`/events/${event.slug}/categories/${category.slug}`}
                    className="mt-4 inline-flex rounded-full bg-[var(--ink-strong)] px-4 py-2 text-sm font-bold text-[var(--surface-card)]"
                  >
                    Buka Detail Kategori
                  </Link>
                </article>
              );
            })}
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
                  {item.published_at ? formatDateId(item.published_at) : "-"}
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

