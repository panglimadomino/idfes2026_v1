import Link from "next/link";
import { upsertEventCategoryAction } from "@/app/admin/actions";
import { EventCategoryForm } from "@/app/admin/events/categories/_components/event-category-form";
import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EventRow = {
  id: string;
  name: string;
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
  const showCategorySaved = params.saved === "1";
  const manageEventId = String(params.manage_event_id ?? "").trim();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, name")
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
        <p className="mt-2 text-sm text-[#6b7280]">Halaman ini khusus untuk pembuatan pertandingan baru.</p>
      </section>

      {showCategorySaved ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Kategori pertandingan berhasil disimpan.
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

      {access.isSuperAdmin && managingEvent ? (
        <section key={managingEvent.id} id={`event-${managingEvent.id}`} className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#111827]">Buat Pertandingan Baru: {managingEvent.name}</h2>
            <Link
              href={`/admin/events/${managingEvent.id}`}
              className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#111827] hover:bg-[#f9fafb]"
            >
              Kembali ke Detail Event
            </Link>
          </div>

          <section className="mt-4 rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <EventCategoryForm
              action={upsertEventCategoryAction}
              eventId={managingEvent.id}
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
          </section>

          {managedCategoriesError ? (
            <section className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Gagal memuat data pertandingan existing: {managedCategoriesError}
            </section>
          ) : null}
        </section>
      ) : null}

      {access.isSuperAdmin && !manageEventId ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#6b7280]">
          Pilih event dari halaman{" "}
          <Link href="/admin/events" className="font-semibold text-[#111827] underline">
            Event
          </Link>{" "}
          lalu klik tombol Buat Pertandingan.
        </section>
      ) : null}

      {rows.length === 0 ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#6b7280]">Belum ada data event.</section>
      ) : null}
    </div>
  );
}
