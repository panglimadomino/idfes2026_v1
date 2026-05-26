import { createEventAction } from "@/app/admin/actions";
import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EventRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  start_at: string;
  end_at: string;
  status: "draft" | "published" | "archived";
};

export default async function AdminEventsPage() {
  const access = await requireAdminAccess();
  const supabase = await createSupabaseServerClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, slug, city, start_at, end_at, status")
    .order("start_at", { ascending: false })
    .limit(50);

  const rows = (events ?? []) as EventRow[];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h1 className="font-title text-5xl uppercase leading-none">Buat Event</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Kelola event roadshow IDFES 2026.</p>
      </section>

      {access.isSuperAdmin ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-lg font-bold">Form Event Baru</h2>
          <form action={createEventAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="name" required placeholder="Nama Event" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
            <input name="slug" required placeholder="Slug (contoh: surabaya-2026)" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
            <input name="city" placeholder="Kota" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
            <input name="venue" placeholder="Venue" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
            <label className="text-sm font-semibold text-[#374151]">
              Tanggal Mulai
              <input name="start_at" required type="datetime-local" className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
            </label>
            <label className="text-sm font-semibold text-[#374151]">
              Tanggal Selesai
              <input name="end_at" required type="datetime-local" className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
            </label>
            <label className="text-sm font-semibold text-[#374151]">
              Status
              <select name="status" defaultValue="draft" className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm">
              <input type="checkbox" name="is_featured" />
              Jadikan event aktif/featured
            </label>
            <button type="submit" className="w-fit rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white md:col-span-2">
              Simpan Event
            </button>
          </form>
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Hanya super_admin yang dapat membuat event.
        </section>
      )}

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
                <th className="px-4 py-3">Kota</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => (
                <tr key={event.id} className="border-t border-[#f1f5f9]">
                  <td className="px-4 py-3 font-semibold">{event.name}</td>
                  <td className="px-4 py-3">{event.slug}</td>
                  <td className="px-4 py-3">{event.city ?? "-"}</td>
                  <td className="px-4 py-3">
                    {new Date(event.start_at).toLocaleDateString("id-ID")} - {new Date(event.end_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3">{event.status}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[#6b7280]" colSpan={5}>
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
