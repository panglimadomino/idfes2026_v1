import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminAccess } from "@/lib/auth/server";
import { formatDateId } from "@/lib/date-id";
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
};

type AdminCategoryDetailPageProps = {
  params: Promise<{ eventId: string; categoryId: string }>;
};

function formatRupiah(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value as number);
}

function formatParticipantUnit(value: string | null) {
  if (value === "pasang") return "pasang";
  if (value === "athlet") return "athlet";
  return "peserta";
}

export default async function AdminCategoryDetailPage({ params }: AdminCategoryDetailPageProps) {
  await requireAdminAccess();
  const { eventId, categoryId } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: event }, { data: category }] = await Promise.all([
    supabase.from("events").select("id, name, slug, city, venue").eq("id", eventId).maybeSingle(),
    supabase
      .from("event_categories")
      .select(
        "id, event_id, name, slug, description, age_group, gender_category, participant_count, participant_unit, registration_fee, registration_open_at, registration_close_at, competition_start_at, competition_end_at, registration_bank_name_1, registration_bank_account_number_1, registration_bank_account_holder_1, registration_bank_name_2, registration_bank_account_number_2, registration_bank_account_holder_2, pairing_zone_count, pairing_cluster_count, pairing_group_count, pairing_table_count, prize_breakdown, is_published",
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
        <h2 className="text-lg font-bold text-[#111827]">Data Pertandingan</h2>
        <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[#6b7280]">Nama Pertandingan</dt>
            <dd className="font-semibold">{categoryRow.name}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Slug</dt>
            <dd className="font-semibold">{categoryRow.slug}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Status</dt>
            <dd className="font-semibold">{categoryRow.is_published ? "published" : "draft"}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Batas Usia</dt>
            <dd className="font-semibold">{categoryRow.age_group ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Jenis Kelamin</dt>
            <dd className="font-semibold">{categoryRow.gender_category ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Jumlah Peserta</dt>
            <dd className="font-semibold">
              {categoryRow.participant_count ?? 0} {formatParticipantUnit(categoryRow.participant_unit)}
            </dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Biaya Pendaftaran</dt>
            <dd className="font-semibold">{formatRupiah(categoryRow.registration_fee)}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Admin Pertandingan</dt>
            <dd className="font-semibold">{adminCount ?? 0} admin</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Peserta Terdaftar</dt>
            <dd className="font-semibold">{participantCount ?? 0} peserta</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Periode Pendaftaran</dt>
            <dd className="font-semibold">
              {categoryRow.registration_open_at ? formatDateId(categoryRow.registration_open_at) : "-"} -{" "}
              {categoryRow.registration_close_at ? formatDateId(categoryRow.registration_close_at) : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Periode Pertandingan</dt>
            <dd className="font-semibold">
              {categoryRow.competition_start_at ? formatDateId(categoryRow.competition_start_at) : "-"} -{" "}
              {categoryRow.competition_end_at ? formatDateId(categoryRow.competition_end_at) : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Pairing</dt>
            <dd className="font-semibold">
              Z{categoryRow.pairing_zone_count ?? 0} C{categoryRow.pairing_cluster_count ?? 0} G{categoryRow.pairing_group_count ?? 0} M
              {categoryRow.pairing_table_count ?? 0}
            </dd>
          </div>
        </dl>

        {categoryRow.description ? (
          <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#374151]">{categoryRow.description}</div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h2 className="text-lg font-bold text-[#111827]">Data Bank Pendaftaran</h2>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-lg border border-[#e5e7eb] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Bank 1</p>
            <p className="mt-1 font-semibold">{categoryRow.registration_bank_name_1 || "-"}</p>
            <p className="text-[#374151]">{categoryRow.registration_bank_account_number_1 || "-"}</p>
            <p className="text-[#374151]">{categoryRow.registration_bank_account_holder_1 || "-"}</p>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Bank 2</p>
            <p className="mt-1 font-semibold">{categoryRow.registration_bank_name_2 || "-"}</p>
            <p className="text-[#374151]">{categoryRow.registration_bank_account_number_2 || "-"}</p>
            <p className="text-[#374151]">{categoryRow.registration_bank_account_holder_2 || "-"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h2 className="text-lg font-bold text-[#111827]">Hadiah</h2>
        {parsedPrizes.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-[#e5e7eb]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
                <tr>
                  <th className="px-4 py-3">Posisi</th>
                  <th className="px-4 py-3">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {parsedPrizes.map((item) => (
                  <tr key={item.label} className="border-t border-[#f1f5f9]">
                    <td className="px-4 py-3 font-semibold">{item.label}</td>
                    <td className="px-4 py-3">{formatRupiah(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#6b7280]">Belum ada data hadiah.</p>
        )}
      </section>
    </div>
  );
}
