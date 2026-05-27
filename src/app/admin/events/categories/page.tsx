import Link from "next/link";
import { deleteEventCategoryAction, upsertEventCategoryAction } from "@/app/admin/actions";
import { requireAdminAccess } from "@/lib/auth/server";
import { toDateInputValueId } from "@/lib/date-id";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  competition_start_at: string | null;
  competition_end_at: string | null;
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
  if (errorCode === "invalid_competition_window") return "Tanggal selesai pertandingan tidak boleh lebih awal dari tanggal mulai.";
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
      .select("id, name, slug, description, competition_start_at, competition_end_at, is_published, sort_order")
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
          <form action={upsertEventCategoryAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="event_id" value={selectedEventId} />

            <label className="text-sm font-semibold text-[#374151]">
              Nama Kategori
              <input required name="name" placeholder="Contoh: Tunggal Putra" className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
            </label>

            <label className="text-sm font-semibold text-[#374151]">
              Slug (opsional)
              <input name="slug" placeholder="contoh: tunggal-putra" className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
            </label>

            <label className="text-sm font-semibold text-[#374151] md:col-span-2">
              Deskripsi
              <textarea
                name="description"
                rows={3}
                placeholder="Deskripsi singkat kategori pertandingan"
                className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
              />
            </label>

            <label className="text-sm font-semibold text-[#374151]">
              Tanggal Mulai Pertandingan
              <input name="competition_start_date" type="date" className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
            </label>

            <label className="text-sm font-semibold text-[#374151]">
              Tanggal Selesai Pertandingan
              <input name="competition_end_date" type="date" className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
            </label>

            <label className="text-sm font-semibold text-[#374151]">
              Sort Order
              <input
                name="sort_order"
                type="number"
                min={0}
                defaultValue={categories.length > 0 ? Math.max(...categories.map((item) => item.sort_order)) + 10 : 10}
                className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
              />
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm md:mt-7">
              <input type="checkbox" name="is_published" defaultChecked />
              Publish kategori ini
            </label>

            <div className="md:col-span-2">
              <button type="submit" className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                Simpan Kategori
              </button>
            </div>
          </form>
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
              <form action={upsertEventCategoryAction} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="event_id" value={selectedEventId} />
                <input type="hidden" name="category_id" value={category.id} />

                <label className="text-sm font-semibold text-[#374151]">
                  Nama Kategori
                  <input required name="name" defaultValue={category.name} className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
                </label>

                <label className="text-sm font-semibold text-[#374151]">
                  Slug
                  <input required name="slug" defaultValue={category.slug} className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
                </label>

                <label className="text-sm font-semibold text-[#374151] md:col-span-2">
                  Deskripsi
                  <textarea name="description" rows={3} defaultValue={category.description ?? ""} className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
                </label>

                <label className="text-sm font-semibold text-[#374151]">
                  Tanggal Mulai Pertandingan
                  <input
                    name="competition_start_date"
                    type="date"
                    defaultValue={category.competition_start_at ? toDateInputValueId(category.competition_start_at) : ""}
                    className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
                  />
                </label>

                <label className="text-sm font-semibold text-[#374151]">
                  Tanggal Selesai Pertandingan
                  <input
                    name="competition_end_date"
                    type="date"
                    defaultValue={category.competition_end_at ? toDateInputValueId(category.competition_end_at) : ""}
                    className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
                  />
                </label>

                <label className="text-sm font-semibold text-[#374151]">
                  Sort Order
                  <input
                    name="sort_order"
                    type="number"
                    min={0}
                    defaultValue={category.sort_order}
                    className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
                  />
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm md:mt-7">
                  <input type="checkbox" name="is_published" defaultChecked={category.is_published} />
                  Publish kategori ini
                </label>

                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <button
                    type="submit"
                    disabled={!access.isSuperAdmin}
                    className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>

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
