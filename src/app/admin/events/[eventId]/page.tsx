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
  venue_map_url: string | null;
  start_at: string;
  end_at: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
};

type EventCategoryRow = {
  id: string;
  name: string;
  slug: string;
  competition_start_at: string | null;
  competition_end_at: string | null;
  is_published: boolean;
};

type CategoryCountRow = {
  category_id: string | null;
};

type AdminEventDetailPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function AdminEventDetailPage({ params }: AdminEventDetailPageProps) {
  await requireAdminAccess();
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, slug, city, venue, venue_map_url, start_at, end_at, status, is_featured")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const { data: categories } = await supabase
    .from("event_categories")
    .select("id, name, slug, competition_start_at, competition_end_at, is_published")
    .eq("event_id", event.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const eventRow = event as EventRow;
  const categoryRows = (categories ?? []) as EventCategoryRow[];
  const categoryIds = categoryRows.map((category) => category.id);

  const adminCountMap = new Map<string, number>();
  const participantCountMap = new Map<string, number>();

  if (categoryIds.length > 0) {
    const [{ data: adminRows }, { data: participantRows }] = await Promise.all([
      supabase
        .from("admin_category_access")
        .select("category_id")
        .eq("event_id", eventRow.id)
        .eq("is_active", true)
        .in("category_id", categoryIds),
      supabase.from("registrations").select("category_id").eq("event_id", eventRow.id).in("category_id", categoryIds),
    ]);

    for (const row of ((adminRows ?? []) as CategoryCountRow[])) {
      const categoryId = row.category_id ?? "";
      if (!categoryId) continue;
      adminCountMap.set(categoryId, (adminCountMap.get(categoryId) ?? 0) + 1);
    }

    for (const row of ((participantRows ?? []) as CategoryCountRow[])) {
      const categoryId = row.category_id ?? "";
      if (!categoryId) continue;
      participantCountMap.set(categoryId, (participantCountMap.get(categoryId) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-title text-5xl uppercase leading-none">Detail Event</h1>
            <p className="mt-2 text-sm text-[#6b7280]">{eventRow.name}</p>
          </div>
          <Link href="/admin/events" className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-semibold text-[#111827]">
            Kembali ke List Event
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[#6b7280]">Nama Event</dt>
            <dd className="font-semibold">{eventRow.name}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Slug</dt>
            <dd className="font-semibold">{eventRow.slug}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Lokasi</dt>
            <dd className="font-semibold">{eventRow.city ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Penyelenggara</dt>
            <dd className="font-semibold">{eventRow.venue ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Periode</dt>
            <dd className="font-semibold">
              {formatDateId(eventRow.start_at)} - {formatDateId(eventRow.end_at)}
            </dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Status</dt>
            <dd className="font-semibold">{eventRow.status}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/admin/events/schedule#event-${eventRow.id}`} className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-semibold text-[#111827]">
            Edit Event
          </Link>
          <Link
            href={`/admin/events/schedule?manage_event_id=${eventRow.id}#event-${eventRow.id}`}
            className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
          >
            Buat Pertandingan
          </Link>
          {eventRow.venue_map_url ? (
            <a
              href={eventRow.venue_map_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-semibold text-[#111827]"
            >
              Buka Map Venue
            </a>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
        <div className="border-b border-[#e5e7eb] px-6 py-4">
          <h2 className="text-lg font-bold">List Pertandingan (Kategori)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
              <tr>
                <th className="px-4 py-3">Nama Pertandingan</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Peserta</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categoryRows.map((category) => (
                <tr key={category.id} className="border-t border-[#f1f5f9]">
                  <td className="px-4 py-3 font-semibold">{category.name}</td>
                  <td className="px-4 py-3">{category.slug}</td>
                  <td className="px-4 py-3">
                    {category.competition_start_at ? formatDateId(category.competition_start_at) : "-"} -{" "}
                    {category.competition_end_at ? formatDateId(category.competition_end_at) : "-"}
                  </td>
                  <td className="px-4 py-3">{category.is_published ? "published" : "draft"}</td>
                  <td className="px-4 py-3">{adminCountMap.get(category.id) ?? 0}</td>
                  <td className="px-4 py-3">{participantCountMap.get(category.id) ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/events/schedule?manage_event_id=${eventRow.id}#category-${category.id}`}
                        className="rounded-lg border border-[#d1d5db] px-3 py-1 font-semibold text-[#111827]"
                      >
                        Edit Pertandingan
                      </Link>
                      <Link
                        href={`/admin/admins?event_id=${eventRow.id}&category_id=${category.id}`}
                        className="rounded-lg border border-[#d1d5db] px-3 py-1 font-semibold text-[#111827]"
                      >
                        Kelola Admin
                      </Link>
                      <Link
                        href={`/admin/registrations?event_id=${eventRow.id}&category_id=${category.id}`}
                        className="rounded-lg border border-[#d1d5db] px-3 py-1 font-semibold text-[#111827]"
                      >
                        Lihat Peserta
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {categoryRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-[#6b7280]">
                    Belum ada pertandingan untuk event ini.
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
