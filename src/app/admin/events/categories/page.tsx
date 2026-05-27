import Link from "next/link";
import { deleteEventCategoryAction, upsertEventCategoryAction } from "@/app/admin/actions";
import { requireAdminAccess } from "@/lib/auth/server";
import { toDateInputValueId } from "@/lib/date-id";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EventCategoryForm } from "./_components/event-category-form";

type EventRow = {
  id: string;
  name: string;
  slug: string;
};

type EventCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  registration_open_at: string | null;
  registration_close_at: string | null;
  competition_start_at: string | null;
  competition_end_at: string | null;
  participant_count: number | null;
  participant_unit: string | null;
  pairing_zone_count: number | null;
  pairing_cluster_count: number | null;
  pairing_group_count: number | null;
  pairing_table_count: number | null;
  prize_breakdown: unknown;
  is_published: boolean;
  sort_order: number;
};

type AdminEventCategoriesPageProps = {
  searchParams: Promise<{ event_id?: string; saved?: string; deleted?: string; error?: string }>;
};

function getErrorMessage(errorCode?: string) {
  if (!errorCode) return null;
  if (errorCode === "unauthorized") return "Akses ditolak. Hanya super_admin yang dapat mengubah kategori pertandingan.";
  if (errorCode === "required_fields") return "Field wajib belum lengkap.";
  if (errorCode === "invalid_slug") return "Slug kategori tidak valid.";
  if (errorCode === "duplicate_slug") return "Slug kategori sudah dipakai di event ini.";
  if (errorCode === "invalid_sort_order") return "Sort order harus berupa angka.";
  if (errorCode === "invalid_participant_count") return "Jumlah peserta harus lebih dari 0.";
  if (errorCode === "invalid_pairing_config") return "Nilai pairing tidak valid. Gunakan angka 0 atau lebih.";
  if (errorCode === "invalid_prize_config") return "Konfigurasi hadiah tidak valid.";
  if (errorCode === "invalid_registration_window") return "Tanggal selesai pendaftaran tidak boleh lebih awal dari tanggal mulai pendaftaran.";
  if (errorCode === "invalid_competition_window") return "Tanggal selesai pertandingan tidak boleh lebih awal dari tanggal mulai.";
  if (errorCode === "schema_not_ready") return "Schema database belum siap. Jalankan SQL 016 terlebih dahulu di Supabase.";
  if (errorCode === "save_failed") return "Gagal menyimpan kategori pertandingan.";
  if (errorCode === "delete_failed") return "Gagal menghapus kategori pertandingan.";
  return "Terjadi kesalahan pada pengelolaan kategori pertandingan.";
}

export default async function AdminEventCategoriesPage({ searchParams }: AdminEventCategoriesPageProps) {
  const params = await searchParams;
  const access = await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  const errorMessage = getErrorMessage(params.error);
  const showSaved = params.saved === "1";
  const showDeleted = params.deleted === "1";

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, name, slug")
    .order("start_at", { ascending: false })
    .limit(200);

  const eventRows = (events ?? []) as EventRow[];
  const selectedEventIdFromQuery = String(params.event_id ?? "").trim();
  const selectedEvent =
    eventRows.find((event) => event.id === selectedEventIdFromQuery) ??
    (selectedEventIdFromQuery ? eventRows.find((event) => event.slug === selectedEventIdFromQuery) : undefined) ??
    eventRows[0];
  const selectedEventId = selectedEvent?.id ?? "";

  let categories: EventCategoryRow[] = [];
  let categoriesError: string | null = null;
  if (selectedEventId) {
    const { data, error } = await supabase
      .from("event_categories")
      .select(
        "id, name, slug, description, registration_open_at, registration_close_at, competition_start_at, competition_end_at, participant_count, participant_unit, pairing_zone_count, pairing_cluster_count, pairing_group_count, pairing_table_count, prize_breakdown, is_published, sort_order",
      )
      .eq("event_id", selectedEventId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    categories = (data ?? []) as EventCategoryRow[];
    categoriesError = error?.message ?? null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h1 className="font-title text-5xl uppercase leading-none">Kategori Pertandingan</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Buat dan kelola kategori pertandingan untuk event terkait.</p>
      </section>

      {showSaved ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Kategori pertandingan berhasil disimpan.
        </section>
      ) : null}

      {showDeleted ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Kategori pertandingan berhasil dihapus.
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</section>
      ) : null}

      {!access.isSuperAdmin ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Hanya super_admin yang dapat menambah, mengubah, dan menghapus kategori pertandingan.
        </section>
      ) : null}

      {eventsError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Gagal memuat daftar event: {eventsError.message}
        </section>
      ) : null}

      {eventRows.length === 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Belum ada event. Buat event dulu di menu <b>Buat Event</b>.
        </section>
      ) : null}

      {eventRows.length > 0 ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
          <p className="text-sm font-semibold text-[#374151]">Pilih Event</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {eventRows.map((event) => {
              const active = selectedEventId === event.id;
              return (
                <Link
                  key={event.id}
                  href={`/admin/events/categories?event_id=${event.id}`}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                    active ? "border-[#111827] bg-[#111827] text-white" : "border-[#d1d5db] text-[#111827] hover:bg-[#f9fafb]"
                  }`}
                >
                  {event.name}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedEventId && access.isSuperAdmin ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-lg font-bold">Tambah Kategori Baru</h2>
          <div className="mt-4">
            <EventCategoryForm
              action={upsertEventCategoryAction}
              eventId={selectedEventId}
              submitLabel="Simpan Kategori"
              defaults={{
                noPertandingan: "Ganda Open Tournament",
                slug: "ganda-open-tournament",
                description: "",
                participantCount: null,
                participantUnit: "pasang",
                competitionStartDate: "",
                competitionEndDate: "",
                registrationOpenDate: "",
                registrationCloseDate: "",
                pairingZoneCount: 0,
                pairingClusterCount: 0,
                pairingGroupCount: 0,
                pairingTableCount: 0,
                sortOrder: categories.length > 0 ? Math.max(...categories.map((item) => item.sort_order)) + 10 : 10,
                isPublished: true,
                prizes: [],
              }}
            />
          </div>
        </section>
      ) : null}

      {selectedEventId && categoriesError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Gagal memuat kategori pertandingan: {categoriesError}
        </section>
      ) : null}

      {selectedEventId && categories.length > 0 ? (
        <section className="space-y-4">
          {categories.map((category) => (
            <article key={category.id} className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
              <EventCategoryForm
                action={upsertEventCategoryAction}
                eventId={selectedEventId}
                submitLabel="Simpan Perubahan"
                isEdit
                defaults={{
                  categoryId: category.id,
                  noPertandingan: category.name,
                  slug: category.slug,
                  description: category.description ?? "",
                  participantCount: category.participant_count,
                  participantUnit: category.participant_unit ?? "",
                  competitionStartDate: category.competition_start_at ? toDateInputValueId(category.competition_start_at) : "",
                  competitionEndDate: category.competition_end_at ? toDateInputValueId(category.competition_end_at) : "",
                  registrationOpenDate: category.registration_open_at ? toDateInputValueId(category.registration_open_at) : "",
                  registrationCloseDate: category.registration_close_at ? toDateInputValueId(category.registration_close_at) : "",
                  pairingZoneCount: category.pairing_zone_count ?? 0,
                  pairingClusterCount: category.pairing_cluster_count ?? 0,
                  pairingGroupCount: category.pairing_group_count ?? 0,
                  pairingTableCount: category.pairing_table_count ?? 0,
                  sortOrder: category.sort_order,
                  isPublished: category.is_published,
                  prizes: Array.isArray(category.prize_breakdown)
                    ? (category.prize_breakdown as Array<{ label?: unknown; amount?: unknown }>)
                        .map((item) => {
                          const label = typeof item.label === "string" ? item.label : "";
                          const amount = Number(item.amount);
                          if (!label || !Number.isFinite(amount)) return null;
                          return { label, amount };
                        })
                        .filter((item): item is { label: string; amount: number } => item !== null)
                    : [],
                }}
              />
              {access.isSuperAdmin ? (
                <form action={deleteEventCategoryAction} className="mt-3">
                  <input type="hidden" name="event_id" value={selectedEventId} />
                  <input type="hidden" name="category_id" value={category.id} />
                  <button type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                    Hapus Kategori
                  </button>
                </form>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {selectedEventId && categories.length === 0 && !categoriesError ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#6b7280]">Belum ada kategori pertandingan untuk event ini.</section>
      ) : null}
    </div>
  );
}
