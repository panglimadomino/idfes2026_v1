import {
  type PublicEventCategory,
  getActivePublishedEventWithCategories,
  getPublishedCategoriesByEventId,
  getPublishedEventBySlug,
} from "@/lib/public-events";
import { formatDateId } from "@/lib/date-id";

type RegistrationFormPageProps = {
  searchParams: Promise<{ event?: string; category?: string }>;
};

function formatWindow(start: string | null, end: string | null) {
  if (!start && !end) return "Belum ditentukan";
  if (start && end) return `${formatDateId(start)} - ${formatDateId(end)}`;
  return start ? formatDateId(start) : formatDateId(end as string);
}

function formatParticipant(category: PublicEventCategory) {
  if (!category.participant_count || category.participant_count <= 0) return "-";
  const unit = category.participant_unit === "pasang" ? "pasang" : category.participant_unit === "athlet" ? "atlet" : "peserta";
  return `${category.participant_count} ${unit}`;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default async function RegistrationFormPage({ searchParams }: RegistrationFormPageProps) {
  const params = await searchParams;

  let eventData = await getActivePublishedEventWithCategories();
  if (params.event) {
    const selectedEvent = await getPublishedEventBySlug(params.event);
    if (selectedEvent) {
      const selectedEventCategories = await getPublishedCategoriesByEventId(selectedEvent.id);
      eventData = { event: selectedEvent, categories: selectedEventCategories };
    }
  }

  const event = eventData?.event ?? null;
  const categories = eventData?.categories ?? [];
  const selectedCategory =
    categories.find((item) => item.slug === params.category) ??
    categories[0] ??
    null;

  const isPairCategory = selectedCategory?.participant_unit === "pasang";

  return (
    <div className="site-frame space-y-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">Form Pendaftaran</h1>
        <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">
          Form pendaftaran mengikuti kategori pertandingan yang dipilih. Setelah submit, peserta akan masuk antrean verifikasi admin.
        </p>
      </section>

      {event ? (
        <section className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6">
          <h2 className="text-lg font-bold text-[var(--ink-strong)]">Event Aktif: {event.name}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div key={category.id} className="rounded-xl border border-[var(--line-soft)] p-4">
                <p className="text-sm font-bold text-[var(--ink-strong)]">{category.name}</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">Kuota {formatParticipant(category)}</p>
                <p className="text-xs text-[var(--ink-soft)]">{formatWindow(category.registration_open_at, category.registration_close_at)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Belum ada event published yang aktif untuk pendaftaran.
        </section>
      )}

      <form className="grid gap-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Pilih Kategori
          <select
            name="category_slug"
            defaultValue={selectedCategory?.slug ?? ""}
            className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Email (OTP)
          <input
            name="email"
            type="email"
            placeholder="nama@email.com"
            className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
          />
        </label>

        <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          {isPairCategory ? "Nama Atlet 1" : "Nama Peserta"}
          <input name="athlete_1_name" className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]" />
        </label>

        <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          {isPairCategory ? "Nomor WhatsApp Atlet 1" : "Nomor WhatsApp Peserta"}
          <input name="athlete_1_whatsapp" className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]" />
        </label>

        {isPairCategory ? (
          <>
            <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
              Nama Atlet 2
              <input
                name="athlete_2_name"
                className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
              Nomor WhatsApp Atlet 2
              <input
                name="athlete_2_whatsapp"
                className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
              />
            </label>
          </>
        ) : null}

        <div className="md:col-span-2">
          <button type="button" className="rounded-full bg-[var(--ink-strong)] px-6 py-3 text-sm font-bold text-[var(--surface-card)]">
            Kirim Pendaftaran
          </button>
        </div>
      </form>

      {selectedCategory ? (
        <section className="grid gap-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6 md:grid-cols-2">
          <article>
            <h3 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Ringkasan Kategori</h3>
            <dl className="mt-2 space-y-2 text-sm text-[var(--ink-soft)]">
              <div className="flex justify-between gap-2">
                <dt>Nama</dt>
                <dd>{selectedCategory.name}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Biaya Pendaftaran</dt>
                <dd>
                  {typeof selectedCategory.registration_fee === "number"
                    ? formatRupiah(selectedCategory.registration_fee)
                    : "-"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Pendaftaran</dt>
                <dd>{formatWindow(selectedCategory.registration_open_at, selectedCategory.registration_close_at)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Pertandingan</dt>
                <dd>{formatWindow(selectedCategory.competition_start_at, selectedCategory.competition_end_at)}</dd>
              </div>
            </dl>
          </article>
          <article>
            <h3 className="text-sm font-bold uppercase text-[var(--ink-soft)]">Rekening Pembayaran</h3>
            <div className="mt-2 space-y-3 text-sm text-[var(--ink-soft)]">
              <div className="rounded-xl border border-[var(--line-soft)] p-3">
                <p className="font-semibold text-[var(--ink-strong)]">{selectedCategory.registration_bank_name_1 ?? "Bank 1"}</p>
                <p>No Rek: {selectedCategory.registration_bank_account_number_1 ?? "-"}</p>
                <p>Atas Nama: {selectedCategory.registration_bank_account_holder_1 ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-[var(--line-soft)] p-3">
                <p className="font-semibold text-[var(--ink-strong)]">{selectedCategory.registration_bank_name_2 ?? "Bank 2"}</p>
                <p>No Rek: {selectedCategory.registration_bank_account_number_2 ?? "-"}</p>
                <p>Atas Nama: {selectedCategory.registration_bank_account_holder_2 ?? "-"}</p>
              </div>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}

