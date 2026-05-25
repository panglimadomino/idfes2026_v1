import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Stat = {
  label: string;
  value: number;
};

export default async function AdminOverviewPage() {
  const access = await requireAdminAccess();
  const supabase = await createSupabaseServerClient();

  const [eventsCount, categoriesCount, registrationsCount, pagesCount] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("event_categories").select("*", { count: "exact", head: true }),
    supabase.from("registrations").select("*", { count: "exact", head: true }),
    supabase.from("cms_pages").select("*", { count: "exact", head: true }),
  ]);

  const stats: Stat[] = [
    { label: "Events", value: eventsCount.count ?? 0 },
    { label: "Categories", value: categoriesCount.count ?? 0 },
    { label: "Registrations", value: registrationsCount.count ?? 0 },
    { label: "CMS Pages", value: pagesCount.count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h1 className="font-title text-6xl uppercase leading-none">Dashboard</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Panel pengelolaan IDFES 2026.</p>
      </section>

      {!access.isSuperAdmin ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Akun ini adalah <b>admin_category</b>. Beberapa modul CMS hanya dapat diubah oleh super_admin.
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <p className="text-sm text-[#6b7280]">{stat.label}</p>
            <p className="mt-2 text-4xl font-black">{stat.value}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
