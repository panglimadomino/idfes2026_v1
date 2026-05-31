import Link from "next/link";
import { deleteEventCategoryAction, updateEventScheduleAction, upsertEventCategoryAction } from "@/app/admin/actions";
import { EventCategoryForm } from "@/app/admin/events/categories/_components/event-category-form";
import { requireAdminAccess } from "@/lib/auth/server";
import { toDateInputValueId } from "@/lib/date-id";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EventRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  venue: string | null;
  start_at: string;
  end_at: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
};

type EventCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  age_group: string | null;
  gender_category: string | null;
  registration_open_at: string | null;
  registration_close_at: string | null;
  competition_start_at: string | null;
  competition_end_at: string | null;
  participant_count: number | null;
  participant_unit: string | null;
  registration_fee: number | null;
  registration_bank_name_1: string | null;
  registration_bank_account_number_1: string | null;
  registration_bank_account_holder_1: string | null;
  registration_bank_name_2: string | null;
  registration_bank_account_number_2: string | null;
  registration_bank_account_holder_2: string | null;
  pairing_zone_count: number | null;
  pairing_cluster_count: number | null;
  pairing_group_count: number | null;
  pairing_table_count: number | null;
  prize_breakdown: unknown;
  is_published: boolean;
  sort_order: number;
};

type AdminEventSchedulePageProps = {
  searchParams: Promise<{
    updated?: string;
    error?: string;
    manage_event_id?: string;
    saved?: string;
    deleted?: string;
  }>;
};

function parseCategoryIdentity(name: string, ageGroup: string | null, genderCategory: string | null) {
  const parts = name
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    noPertandingan: parts[0] || name,
    ageGroup: ageGroup ?? parts[1] ?? "Bebas",
    genderCategory: genderCategory ?? parts[2] ?? "Putra",
  };
}

function getErrorMessage(errorCode?: string) {
  if (!errorCode) return null;
  if (errorCode === "unauthorized") return "Akses ditolak. Hanya super_admin yang dapat mengubah event.";
  if (errorCode === "required_fields") return "Field wajib belum lengkap.";
  if (errorCode === "invalid_status") return "Status event tidak valid.";
  if (errorCode === "event_requires_match") return "Event harus memiliki minimal 1 pertandingan sebelum status diubah ke published.";
  if (errorCode === "invalid_slug") return "Slug event tidak valid.";
  if (errorCode === "duplicate_slug") return "Slug sudah dipakai event lain.";
  if (errorCode === "update_failed") return "Gagal update event. Coba lagi.";
  if (errorCode === "invalid_sort_order") return "Sort order harus berupa angka.";
  if (errorCode === "invalid_identity_config") return "Konfigurasi No Pertandingan, Batas Usia, atau Jenis Kelamin tidak valid.";
  if (errorCode === "invalid_participant_count") return "Jumlah peserta harus lebih dari 0.";
  if (errorCode === "invalid_registration_fee") return "Biaya pendaftaran tidak valid.";
  if (errorCode === "invalid_pairing_config") return "Nilai pairing tidak valid. Gunakan angka 0 atau lebih.";
  if (errorCode === "invalid_prize_config") return "Konfigurasi hadiah tidak valid.";
  if (errorCode === "invalid_registration_window") return "Tanggal selesai pendaftaran tidak boleh lebih awal dari tanggal mulai pendaftaran.";
  if (errorCode === "invalid_competition_window") return "Tanggal selesai pertandingan tidak boleh lebih awal dari tanggal mulai.";
  if (errorCode === "schema_not_ready") return "Schema database belum siap. Jalankan SQL migration terbaru di Supabase.";
  if (errorCode === "save_failed") return "Gagal menyimpan kategori pertandingan.";
  if (errorCode === "delete_failed") return "Gagal menghapus kategori pertandingan.";
  return "Terjadi kesalahan saat memproses data.";
}

export default async function AdminEventSchedulePage({ searchParams }: AdminEventSchedulePageProps) {
  const params = await searchParams;
  const access = await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  const errorMessage = getErrorMessage(params.error);
  const showSuccess = params.updated === "1";
  const showCategorySaved = params.saved === "1";
  const showCategoryDeleted = params.deleted === "1";
  const manageEventId = String(params.manage_event_id ?? "").trim();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, slug, city, venue, start_at, end_at, status, is_featured")
    .order("start_at", { ascending: false })
    .limit(100);

  const rows = (events ?? []) as EventRow[];
  const managingEvent = rows.find((row) => row.id === manageEventId);

  let managedCategories: EventCategoryRow[] = [];
  let managedCategoriesError: string | null = null;
  if (managingEvent) {
    const { data, error: categoryError } = await supabase
      .from("event_categories")
      .select(
        "id, name, slug, description, age_group, gender_category, registration_open_at, registration_close_at, competition_start_at, competition_end_at, participant_count, participant_unit, registration_fee, registration_bank_name_1, registration_bank_account_number_1, registration_bank_account_holder_1, registration_bank_name_2, registration_bank_account_number_2, registration_bank_account_holder_2, pairing_zone_count, pairing_cluster_count, pairing_group_count, pairing_table_count, prize_breakdown, is_published, sort_order",
      )
      .eq("event_id", managingEvent.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    managedCategories = (data ?? []) as EventCategoryRow[];
    managedCategoriesError = categoryError?.message ?? null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h1 className="font-title text-5xl uppercase leading-none">Event Schedule</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Edit event yang sudah dibuat: nama, slug, lokasi, tanggal, status, dan featured.</p>
      </section>

      {showSuccess ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">Event berhasil diupdate.</section>
      ) : null}

      {showCategorySaved ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Kategori pertandingan berhasil disimpan.
        </section>
      ) : null}

      {showCategoryDeleted ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Kategori pertandingan berhasil dihapus.
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</section>
      ) : null}

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Gagal memuat event: {error.message}
        </section>
      ) : null}

      {!access.isSuperAdmin ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Hanya super_admin yang dapat mengubah event schedule.
        </section>
      ) : null}

      {access.isSuperAdmin
        ? rows.map((event) => (
            <section key={event.id} id={`event-${event.id}`} className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
              <form action={updateEventScheduleAction} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="event_id" value={event.id} />

                <label className="text-sm font-semibold text-[#374151] md:col-span-2">
                  Nama Event
                  <input
                    required
                    name="name"
                    defaultValue={event.name}
                    className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
                  />
                </label>

                <label className="text-sm font-semibold text-[#374151]">
                  Slug
                  <input
                    required
                    name="slug"
                    defaultValue={event.slug}
                    className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
                  />
                </label>

                <label className="text-sm font-semibold text-[#374151]">
                  Status
                  <select name="status" defaultValue={event.status} className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2">
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                    <option value="archived">archived</option>
                  </select>
                </label>

                <label className="text-sm font-semibold text-[#374151]">
                  Lokasi
                  <input
                    required
                    name="location"
                    defaultValue={event.city ?? ""}
                    className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
                  />
                </label>

                <label className="text-sm font-semibold text-[#374151]">
                  Penyelenggara
                  <input
                    name="organizer"
                    defaultValue={event.venue ?? ""}
                    className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
                  />
                </label>

                <label className="text-sm font-semibold text-[#374151]">
                  Tanggal Mulai
                  <input
                    required
                    name="start_date"
                    type="date"
                    defaultValue={toDateInputValueId(event.start_at)}
                    className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
                  />
                </label>

                <label className="text-sm font-semibold text-[#374151]">
                  Tanggal Selesai
                  <input
                    required
                    name="end_date"
                    type="date"
                    defaultValue={toDateInputValueId(event.end_at)}
                    className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
                  />
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm md:col-span-2">
                  <input type="checkbox" name="is_featured" defaultChecked={event.is_featured} />
                  Jadikan event aktif/featured
                </label>

                <div className="md:col-span-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="submit" className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                      Simpan Perubahan
                    </button>
                    <Link
                      href={`/admin/events/schedule?manage_event_id=${event.id}#event-${event.id}`}
                      className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#f9fafb]"
                    >
                      Kelola Kategori Pertandingan
                    </Link>
                  </div>
                </div>
              </form>

              {manageEventId === event.id ? (
                <div className="mt-6 space-y-4 border-t border-[#e5e7eb] pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-[#111827]">Kelola Kategori: {event.name}</h2>
                    <Link
                      href="/admin/events/schedule"
                      className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#111827] hover:bg-[#f9fafb]"
                    >
                      Tutup
                    </Link>
                  </div>

                  <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
                    <h3 className="text-lg font-bold">Tambah Kategori Baru</h3>
                    <div className="mt-4">
                      <EventCategoryForm
                        action={upsertEventCategoryAction}
                        eventId={event.id}
                        submitLabel="Simpan Kategori"
                        defaults={{
                          noPertandingan: "Open Tournament",
                          ageGroup: "Bebas",
                          genderCategory: "Putra",
                          slug: "open-tournament",
                          description: "",
                          participantCount: null,
                          participantUnit: "peserta",
                          registrationFee: null,
                          registrationBankName1: "",
                          registrationBankAccountNumber1: "",
                          registrationBankAccountHolder1: "",
                          registrationBankName2: "",
                          registrationBankAccountNumber2: "",
                          registrationBankAccountHolder2: "",
                          competitionStartDate: "",
                          competitionEndDate: "",
                          registrationOpenDate: "",
                          registrationCloseDate: "",
                          pairingZoneCount: 0,
                          pairingClusterCount: 0,
                          pairingGroupCount: 0,
                          pairingTableCount: 0,
                          sortOrder:
                            managedCategories.length > 0
                              ? Math.max(...managedCategories.map((item) => item.sort_order)) + 10
                              : 10,
                          isPublished: true,
                          prizes: [],
                        }}
                      />
                    </div>
                  </section>

                  {managedCategoriesError ? (
                    <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      Gagal memuat kategori pertandingan: {managedCategoriesError}
                    </section>
                  ) : null}

                  {managedCategories.length > 0 ? (
                    <section className="space-y-4">
                      {managedCategories.map((category) => {
                        const identity = parseCategoryIdentity(category.name, category.age_group, category.gender_category);
                        return (
                          <article id={`category-${category.id}`} key={category.id} className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
                            <EventCategoryForm
                              action={upsertEventCategoryAction}
                              eventId={event.id}
                              submitLabel="Simpan Perubahan"
                              isEdit
                              defaults={{
                                categoryId: category.id,
                                noPertandingan: identity.noPertandingan,
                                ageGroup: identity.ageGroup,
                                genderCategory: identity.genderCategory,
                                slug: category.slug,
                                description: category.description ?? "",
                                participantCount: category.participant_count,
                                participantUnit: category.participant_unit ?? "",
                                registrationFee: category.registration_fee,
                                registrationBankName1: category.registration_bank_name_1 ?? "",
                                registrationBankAccountNumber1: category.registration_bank_account_number_1 ?? "",
                                registrationBankAccountHolder1: category.registration_bank_account_holder_1 ?? "",
                                registrationBankName2: category.registration_bank_name_2 ?? "",
                                registrationBankAccountNumber2: category.registration_bank_account_number_2 ?? "",
                                registrationBankAccountHolder2: category.registration_bank_account_holder_2 ?? "",
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
                            <form action={deleteEventCategoryAction} className="mt-3">
                              <input type="hidden" name="event_id" value={event.id} />
                              <input type="hidden" name="category_id" value={category.id} />
                              <button type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                                Hapus Kategori
                              </button>
                            </form>
                          </article>
                        );
                      })}
                    </section>
                  ) : (
                    <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 text-sm text-[#6b7280]">
                      Belum ada kategori pertandingan untuk event ini.
                    </section>
                  )}
                </div>
              ) : null}
            </section>
          ))
        : null}

      {rows.length === 0 ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#6b7280]">Belum ada data event.</section>
      ) : null}
    </div>
  );
}
