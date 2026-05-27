import { updateEventScheduleAction } from "@/app/admin/actions";
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

type AdminEventSchedulePageProps = {
  searchParams: Promise<{ updated?: string; error?: string }>;
};

function getErrorMessage(errorCode?: string) {
  if (!errorCode) return null;
  if (errorCode === "unauthorized") return "Akses ditolak. Hanya super_admin yang dapat mengubah event.";
  if (errorCode === "required_fields") return "Field wajib belum lengkap.";
  if (errorCode === "invalid_status") return "Status event tidak valid.";
  if (errorCode === "invalid_slug") return "Slug event tidak valid.";
  if (errorCode === "duplicate_slug") return "Slug sudah dipakai event lain.";
  if (errorCode === "update_failed") return "Gagal update event. Coba lagi.";
  return "Terjadi kesalahan saat update event.";
}

export default async function AdminEventSchedulePage({ searchParams }: AdminEventSchedulePageProps) {
  const params = await searchParams;
  const access = await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  const errorMessage = getErrorMessage(params.error);
  const showSuccess = params.updated === "1";

  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, slug, city, venue, start_at, end_at, status, is_featured")
    .order("start_at", { ascending: false })
    .limit(100);

  const rows = (events ?? []) as EventRow[];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h1 className="font-title text-5xl uppercase leading-none">Event Schedule</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Edit event yang sudah dibuat: nama, slug, lokasi, tanggal, status, dan featured.</p>
      </section>

      {showSuccess ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">Event berhasil diupdate.</section>
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
            <section key={event.id} className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
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
                  <button type="submit" className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </section>
          ))
        : null}

      {rows.length === 0 ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#6b7280]">Belum ada data event.</section>
      ) : null}
    </div>
  );
}
