import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateId } from "@/lib/date-id";
import { createSupabaseClient } from "@/lib/supabase/client";
import { getPublishedEventBySlug } from "@/lib/public-events";

type Props = {
  params: Promise<{ eventSlug: string; categorySlug: string }>;
};

export default async function CategoryDetailPage({ params }: Props) {
  const { eventSlug, categorySlug } = await params;
  const event = await getPublishedEventBySlug(eventSlug);
  if (!event) notFound();

  const supabase = createSupabaseClient();
  const { data: category } = await supabase
    .from("event_categories")
    .select(
      "id, name, slug, description, age_group, gender_category, participant_count, participant_unit, registration_fee, registration_bank_name_1, registration_bank_account_number_1, registration_bank_account_holder_1, registration_bank_name_2, registration_bank_account_number_2, registration_bank_account_holder_2, registration_open_at, registration_close_at, competition_start_at, competition_end_at, pairing_zone_count, pairing_cluster_count, pairing_group_count, pairing_table_count, prize_breakdown",
    )
    .eq("event_id", event.id)
    .eq("slug", categorySlug)
    .eq("is_published", true)
    .maybeSingle();
  if (!category) notFound();

  const prizes = Array.isArray(category.prize_breakdown)
    ? (category.prize_breakdown as Array<{ label?: unknown; amount?: unknown }>)
        .map((item) => {
          const label = typeof item.label === "string" ? item.label : "";
          const amount = Number(item.amount);
          if (!label || !Number.isFinite(amount) || amount <= 0) return null;
          return { label, amount: Math.trunc(amount) };
        })
        .filter((item): item is { label: string; amount: number } => item !== null)
    : [];

  const formatWindow = (start: string | null, end: string | null) => {
    if (!start && !end) return "-";
    if (start && end) return `${formatDateId(start)} - ${formatDateId(end)}`;
    return start ? formatDateId(start) : formatDateId(end as string);
  };

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

  return (
    <div className="site-frame space-y-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-soft)]">{event.name}</p>
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">{category.name}</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Match Start:{" "}
          {category.competition_start_at
            ? formatDateId(category.competition_start_at, { dateStyle: "full" })
            : "Belum ditentukan"}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/form-pendaftaran?event=${event.slug}&category=${category.slug}`}
            className="rounded-full bg-[var(--ink-strong)] px-5 py-2 text-sm font-bold text-[var(--surface-card)]"
          >
            Daftar Kategori Ini
          </Link>
          <Link
            href={`/events/${event.slug}`}
            className="rounded-full border border-[var(--ink-strong)] px-5 py-2 text-sm font-bold"
          >
            Kembali ke Event
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
          <h2 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Identitas</h2>
          <dl className="mt-2 space-y-2 text-sm text-[var(--ink-soft)]">
            <div className="flex justify-between gap-2">
              <dt>Batas Usia</dt>
              <dd>{category.age_group ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Jenis Kelamin</dt>
              <dd>{category.gender_category ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Jumlah Peserta</dt>
              <dd>
                {category.participant_count ?? "-"}{" "}
                {category.participant_unit === "pasang"
                  ? "pasang"
                  : category.participant_unit === "athlet"
                    ? "atlet"
                    : "peserta"}
              </dd>
            </div>
          </dl>
        </article>
        <article className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
          <h2 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Jadwal</h2>
          <dl className="mt-2 space-y-2 text-sm text-[var(--ink-soft)]">
            <div className="flex justify-between gap-2">
              <dt>Pendaftaran</dt>
              <dd>{formatWindow(category.registration_open_at, category.registration_close_at)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Biaya Pendaftaran</dt>
              <dd>{typeof category.registration_fee === "number" ? formatRupiah(category.registration_fee) : "-"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Pertandingan</dt>
              <dd>{formatWindow(category.competition_start_at, category.competition_end_at)}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
          <h2 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Bank Pendaftaran 1</h2>
          <dl className="mt-2 space-y-2 text-sm text-[var(--ink-soft)]">
            <div className="flex justify-between gap-2">
              <dt>Nama Bank</dt>
              <dd>{category.registration_bank_name_1 ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>No Rekening</dt>
              <dd>{category.registration_bank_account_number_1 ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Atas Nama</dt>
              <dd>{category.registration_bank_account_holder_1 ?? "-"}</dd>
            </div>
          </dl>
        </article>
        <article className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
          <h2 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Bank Pendaftaran 2</h2>
          <dl className="mt-2 space-y-2 text-sm text-[var(--ink-soft)]">
            <div className="flex justify-between gap-2">
              <dt>Nama Bank</dt>
              <dd>{category.registration_bank_name_2 ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>No Rekening</dt>
              <dd>{category.registration_bank_account_number_2 ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Atas Nama</dt>
              <dd>{category.registration_bank_account_holder_2 ?? "-"}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
          <h2 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Pairing</h2>
          <dl className="mt-2 space-y-2 text-sm text-[var(--ink-soft)]">
            <div className="flex justify-between gap-2">
              <dt>Zona</dt>
              <dd>{category.pairing_zone_count ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Cluster</dt>
              <dd>{category.pairing_cluster_count ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Group</dt>
              <dd>{category.pairing_group_count ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Meja</dt>
              <dd>{category.pairing_table_count ?? 0}</dd>
            </div>
          </dl>
        </article>
        <article className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
          <h2 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Hadiah</h2>
          {prizes.length > 0 ? (
            <ul className="mt-2 space-y-2 text-sm text-[var(--ink-soft)]">
              {prizes.map((prize) => (
                <li key={prize.label} className="flex justify-between gap-2">
                  <span>{prize.label}</span>
                  <span>{formatRupiah(prize.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--ink-soft)]">Belum ada data hadiah.</p>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5">
        <h2 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Keterangan</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{category.description ?? "Deskripsi kategori belum tersedia."}</p>
      </section>
    </div>
  );
}

