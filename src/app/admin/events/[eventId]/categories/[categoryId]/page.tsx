import Link from "next/link";
import { notFound } from "next/navigation";
import { upsertEventCategoryAction } from "@/app/admin/actions";
import { EventCategoryForm } from "@/app/admin/events/categories/_components/event-category-form";
import { requireAdminAccess } from "@/lib/auth/server";
import { formatDateId, toDateInputValueId } from "@/lib/date-id";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EventRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  venue: string | null;
};

type EventCategoryRow = {
  id: string;
  event_id: string;
  name: string;
  slug: string;
  description: string | null;
  age_group: string | null;
  gender_category: string | null;
  participant_count: number | null;
  participant_unit: string | null;
  registration_fee: number | null;
  registration_open_at: string | null;
  registration_close_at: string | null;
  competition_start_at: string | null;
  competition_end_at: string | null;
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
  sort_order: number | null;
};

type AdminCategoryDetailPageProps = {
  params: Promise<{ eventId: string; categoryId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
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
  if (errorCode === "required_fields") return "Field wajib belum lengkap.";
  if (errorCode === "invalid_sort_order") return "Sort order harus berupa angka.";
  if (errorCode === "invalid_identity_config") return "Konfigurasi No Pertandingan, Batas Usia, atau Jenis Kelamin tidak valid.";
  if (errorCode === "invalid_participant_count") return "Jumlah peserta harus lebih dari 0.";
  if (errorCode === "invalid_registration_fee") return "Biaya pendaftaran tidak valid.";
  if (errorCode === "invalid_pairing_config") return "Nilai pairing tidak valid. Gunakan angka 0 atau lebih.";
  if (errorCode === "invalid_prize_config") return "Konfigurasi hadiah tidak valid.";
  if (errorCode === "invalid_registration_window") return "Tanggal selesai pendaftaran tidak boleh lebih awal dari tanggal mulai pendaftaran.";
  if (errorCode === "invalid_competition_window") return "Tanggal selesai pertandingan tidak boleh lebih awal dari tanggal mulai.";
  if (errorCode === "schema_not_ready") return "Schema database belum siap. Jalankan SQL migration terbaru di Supabase.";
  if (errorCode === "save_failed") return "Gagal menyimpan perubahan pertandingan.";
  if (errorCode === "duplicate_slug") return "Slug pertandingan sudah dipakai.";
  return "Terjadi kesalahan saat memproses data pertandingan.";
}

export default async function AdminCategoryDetailPage({ params, searchParams }: AdminCategoryDetailPageProps) {
  await requireAdminAccess();
  const { eventId, categoryId } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const errorMessage = getErrorMessage(query.error);
  const showSaved = query.saved === "1";

  const [{ data: event }, { data: category }] = await Promise.all([
    supabase.from("events").select("id, name, slug, city, venue").eq("id", eventId).maybeSingle(),
    supabase
      .from("event_categories")
      .select(
        "id, event_id, name, slug, description, age_group, gender_category, participant_count, participant_unit, registration_fee, registration_open_at, registration_close_at, competition_start_at, competition_end_at, registration_bank_name_1, registration_bank_account_number_1, registration_bank_account_holder_1, registration_bank_name_2, registration_bank_account_number_2, registration_bank_account_holder_2, pairing_zone_count, pairing_cluster_count, pairing_group_count, pairing_table_count, prize_breakdown, is_published, sort_order",
      )
      .eq("id", categoryId)
      .maybeSingle(),
  ]);

  if (!event || !category) notFound();

  const eventRow = event as EventRow;
  const categoryRow = category as EventCategoryRow;
  if (categoryRow.event_id !== eventRow.id) notFound();

  const [{ count: adminCount }, { count: participantCount }] = await Promise.all([
    supabase
      .from("admin_category_access")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventRow.id)
      .eq("category_id", categoryRow.id)
      .eq("is_active", true),
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", eventRow.id).eq("category_id", categoryRow.id),
  ]);

  const parsedPrizes = Array.isArray(categoryRow.prize_breakdown)
    ? (categoryRow.prize_breakdown as Array<{ label?: unknown; amount?: unknown }>)
        .map((item) => {
          const label = typeof item.label === "string" ? item.label : "";
          const amount = Number(item.amount);
          if (!label || !Number.isFinite(amount)) return null;
          return { label, amount };
        })
        .filter((item): item is { label: string; amount: number } => item !== null)
    : [];
  const identity = parseCategoryIdentity(categoryRow.name, categoryRow.age_group, categoryRow.gender_category);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-title text-5xl uppercase leading-none">Detail Pertandingan</h1>
            <p className="mt-2 text-sm text-[#6b7280]">{categoryRow.name}</p>
          </div>
          <Link href={`/admin/events/${eventRow.id}`} className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-semibold text-[#111827]">
            Kembali ke Detail Event
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-[#111827] px-3 py-2 text-sm font-semibold text-white">Data Pertandingan</span>
          <Link
            href={`/admin/admins?event_id=${eventRow.id}&category_id=${categoryRow.id}`}
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#111827]"
          >
            Admin Pertandingan
          </Link>
          <Link
            href={`/admin/registrations?event_id=${eventRow.id}&category_id=${categoryRow.id}`}
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#111827]"
          >
            Daftar Peserta (Terdaftar)
          </Link>
          <Link
            href={`/admin/events/${eventRow.id}/categories/${categoryRow.id}/pairing/rr`}
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#111827]"
          >
            RR Pairing
          </Link>
          <Link
            href={`/admin/events/${eventRow.id}/categories/${categoryRow.id}/pairing/se`}
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#111827]"
          >
            SE Pairing
          </Link>
        </div>
      </section>

      {showSaved ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Data pertandingan berhasil diupdate.
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</section>
      ) : null}

      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h2 className="text-lg font-bold text-[#111827]">Data Event</h2>
        <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[#6b7280]">Event</dt>
            <dd className="font-semibold">{eventRow.name}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Slug Event</dt>
            <dd className="font-semibold">{eventRow.slug}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Lokasi Event</dt>
            <dd className="font-semibold">{eventRow.city ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Penyelenggara Event</dt>
            <dd className="font-semibold">{eventRow.venue ?? "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h2 className="text-lg font-bold text-[#111827]">Data Pertandingan (Editable)</h2>
        <div className="mt-4">
          <EventCategoryForm
            action={upsertEventCategoryAction}
            eventId={eventRow.id}
            submitLabel="Simpan Perubahan"
            isEdit
            redirectTo={`/admin/events/${eventRow.id}/categories/${categoryRow.id}`}
            defaults={{
              categoryId: categoryRow.id,
              noPertandingan: identity.noPertandingan,
              ageGroup: identity.ageGroup,
              genderCategory: identity.genderCategory,
              slug: categoryRow.slug,
              description: categoryRow.description ?? "",
              participantCount: categoryRow.participant_count,
              participantUnit: categoryRow.participant_unit ?? "peserta",
              registrationFee: categoryRow.registration_fee,
              registrationBankName1: categoryRow.registration_bank_name_1 ?? "",
              registrationBankAccountNumber1: categoryRow.registration_bank_account_number_1 ?? "",
              registrationBankAccountHolder1: categoryRow.registration_bank_account_holder_1 ?? "",
              registrationBankName2: categoryRow.registration_bank_name_2 ?? "",
              registrationBankAccountNumber2: categoryRow.registration_bank_account_number_2 ?? "",
              registrationBankAccountHolder2: categoryRow.registration_bank_account_holder_2 ?? "",
              competitionStartDate: categoryRow.competition_start_at ? toDateInputValueId(categoryRow.competition_start_at) : "",
              competitionEndDate: categoryRow.competition_end_at ? toDateInputValueId(categoryRow.competition_end_at) : "",
              registrationOpenDate: categoryRow.registration_open_at ? toDateInputValueId(categoryRow.registration_open_at) : "",
              registrationCloseDate: categoryRow.registration_close_at ? toDateInputValueId(categoryRow.registration_close_at) : "",
              pairingZoneCount: categoryRow.pairing_zone_count ?? 0,
              pairingClusterCount: categoryRow.pairing_cluster_count ?? 0,
              pairingGroupCount: categoryRow.pairing_group_count ?? 0,
              pairingTableCount: categoryRow.pairing_table_count ?? 0,
              sortOrder: categoryRow.sort_order ?? 10,
              isPublished: categoryRow.is_published,
              prizes: parsedPrizes,
            }}
          />
        </div>

        <div className="mt-4 grid gap-2 text-sm text-[#374151] md:grid-cols-2">
          <p>
            <span className="text-[#6b7280]">Admin Pertandingan:</span> <strong>{adminCount ?? 0} admin</strong>
          </p>
          <p>
            <span className="text-[#6b7280]">Peserta Terdaftar:</span> <strong>{participantCount ?? 0} peserta</strong>
          </p>
          <p>
            <span className="text-[#6b7280]">Periode Pendaftaran:</span>{" "}
            <strong>
              {categoryRow.registration_open_at ? formatDateId(categoryRow.registration_open_at) : "-"} -{" "}
              {categoryRow.registration_close_at ? formatDateId(categoryRow.registration_close_at) : "-"}
            </strong>
          </p>
          <p>
            <span className="text-[#6b7280]">Periode Pertandingan:</span>{" "}
            <strong>
              {categoryRow.competition_start_at ? formatDateId(categoryRow.competition_start_at) : "-"} -{" "}
              {categoryRow.competition_end_at ? formatDateId(categoryRow.competition_end_at) : "-"}
            </strong>
          </p>
          <p className="md:col-span-2">
            <span className="text-[#6b7280]">Pairing:</span>{" "}
            <strong>
              Z{categoryRow.pairing_zone_count ?? 0} C{categoryRow.pairing_cluster_count ?? 0} G{categoryRow.pairing_group_count ?? 0} M
              {categoryRow.pairing_table_count ?? 0}
            </strong>
          </p>
        </div>
      </section>
    </div>
  );
}
