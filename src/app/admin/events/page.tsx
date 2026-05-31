import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/server";
import { formatDateId } from "@/lib/date-id";
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
};

type AdminEventsPageProps = {
  searchParams: Promise<{ created?: string; error?: string }>;
};

function getCreateErrorMessage(errorCode?: string) {
  if (!errorCode) return null;
  if (errorCode === "unauthorized") return "Akses ditolak. Hanya super_admin yang dapat membuat event.";
  if (errorCode === "required_fields") return "Form belum lengkap. Mohon isi semua field wajib.";
  if (errorCode === "invalid_status") return "Status event tidak valid.";
  if (errorCode === "max_banners") return "Maksimal 5 banner per event.";
  if (errorCode === "invalid_slug") return "Slug event tidak valid.";
  if (errorCode === "duplicate_slug") return "Slug event sudah dipakai. Coba ubah nama event.";
  if (errorCode === "banner_upload_failed") return "Upload banner gagal. Cek ukuran/format file lalu coba lagi.";
  if (errorCode === "banner_metadata_failed") return "Banner terupload, tetapi metadata gagal disimpan.";
  if (errorCode === "create_failed") return "Gagal menyimpan event. Mohon coba lagi.";
  return "Terjadi kesalahan saat menyimpan event.";
}

export default async function AdminEventsPage({ searchParams }: AdminEventsPageProps) {
  const params = await searchParams;
  const access = await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  const createErrorMessage = getCreateErrorMessage(params.error);
  const showCreateSuccess = params.created === "1";

  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, slug, city, venue, start_at, end_at, status")
    .order("start_at", { ascending: false })
    .limit(200);

  const rows = (events ?? []) as EventRow[];
  const eventIds = rows.map((event) => event.id);

  const categoryCountMap = new Map<string, number>();
  if (eventIds.length > 0) {
    const { data: categories } = await supabase
      .from("event_categories")
      .select("event_id")
      .in("event_id", eventIds);

    for (const row of ((categories ?? []) as Array<{ event_id: string | null }>)) {
      const eventId = row.event_id ?? "";
      if (!eventId) continue;
      categoryCountMap.set(eventId, (categoryCountMap.get(eventId) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-title text-5xl uppercase leading-none">Event</h1>
            <p className="mt-2 text-sm text-[#6b7280]">List semua event (sudah berjalan atau akan berjalan).</p>
          </div>
          {access.isSuperAdmin ? (
            <Link href="/admin/events/new" className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
              + Buat Event
            </Link>
          ) : null}
        </div>
      </section>

      {showCreateSuccess ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Event berhasil disimpan.
        </section>
      ) : null}

      {createErrorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{createErrorMessage}</section>
      ) : null}

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Gagal memuat data event: {error.message}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3">Penyelenggara</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pertandingan</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => (
                <tr key={event.id} className="border-t border-[#f1f5f9]">
                  <td className="px-4 py-3 font-semibold">{event.name}</td>
                  <td className="px-4 py-3">{event.slug}</td>
                  <td className="px-4 py-3">{event.city ?? "-"}</td>
                  <td className="px-4 py-3">{event.venue ?? "-"}</td>
                  <td className="px-4 py-3">
                    {formatDateId(event.start_at)} - {formatDateId(event.end_at)}
                  </td>
                  <td className="px-4 py-3">{event.status}</td>
                  <td className="px-4 py-3">{categoryCountMap.get(event.id) ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/events/${event.id}`} className="rounded-lg border border-[#d1d5db] px-3 py-1 font-semibold text-[#111827]">
                        Detail
                      </Link>
                      <Link href={`/admin/events/schedule#event-${event.id}`} className="rounded-lg border border-[#d1d5db] px-3 py-1 font-semibold text-[#111827]">
                        Edit Event
                      </Link>
                      <Link
                        href={`/admin/events/schedule?manage_event_id=${event.id}#event-${event.id}`}
                        className="rounded-lg border border-[#111827] px-3 py-1 font-semibold text-[#111827]"
                      >
                        Buat Pertandingan
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[#6b7280]" colSpan={8}>
                    Belum ada data event.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
