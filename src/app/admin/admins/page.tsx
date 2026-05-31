import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UserRoleRow = {
  id: string;
  user_id: string;
  role: "super_admin" | "admin_category";
  created_at: string;
};

type CategoryAccessRow = {
  id: string;
  user_id: string;
  event_id: string;
  category_id: string;
  can_verify_registration: boolean;
  can_score_rr: boolean;
  can_score_se: boolean;
  is_active: boolean;
};

type AdminManagementPageProps = {
  searchParams: Promise<{ event_id?: string; category_id?: string }>;
};

export default async function AdminManagementPage({ searchParams }: AdminManagementPageProps) {
  const access = await requireAdminAccess();
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const eventId = String(params.event_id ?? "").trim();
  const categoryId = String(params.category_id ?? "").trim();

  let categoryAccessBaseQuery = supabase
    .from("admin_category_access")
    .select("id, user_id, event_id, category_id, can_verify_registration, can_score_rr, can_score_se, is_active")
    .order("created_at", { ascending: false })
    .limit(200);

  if (eventId) categoryAccessBaseQuery = categoryAccessBaseQuery.eq("event_id", eventId);
  if (categoryId) categoryAccessBaseQuery = categoryAccessBaseQuery.eq("category_id", categoryId);

  const [rolesQuery, categoryAccessQuery] = await Promise.all([
    supabase.from("user_roles").select("id, user_id, role, created_at").order("created_at", { ascending: false }).limit(50),
    categoryAccessBaseQuery,
  ]);

  const roles = (rolesQuery.data ?? []) as UserRoleRow[];
  const categoryAccess = (categoryAccessQuery.data ?? []) as CategoryAccessRow[];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h1 className="font-title text-5xl uppercase leading-none">Manajemen Admin</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Kontrol role super admin dan akses admin pertandingan.</p>
        {eventId || categoryId ? (
          <p className="mt-2 text-xs text-[#6b7280]">
            Filter aktif:
            {eventId ? ` event_id=${eventId}` : ""}
            {categoryId ? ` | category_id=${categoryId}` : ""}
          </p>
        ) : null}
      </section>

      {!access.isSuperAdmin ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Anda admin_category. Pengelolaan role hanya terlihat penuh untuk super_admin.
        </section>
      ) : null}

      {rolesQuery.error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Gagal memuat user roles: {rolesQuery.error.message}
        </section>
      ) : null}

      {categoryAccessQuery.error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Gagal memuat admin category access: {categoryAccessQuery.error.message}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-sm text-[#6b7280]">Total Role</p>
          <p className="mt-2 text-4xl font-black">{roles.length}</p>
        </article>
        <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-sm text-[#6b7280]">Super Admin</p>
          <p className="mt-2 text-4xl font-black">{roles.filter((item) => item.role === "super_admin").length}</p>
        </article>
        <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-sm text-[#6b7280]">Admin Category</p>
          <p className="mt-2 text-4xl font-black">{roles.filter((item) => item.role === "admin_category").length}</p>
        </article>
        <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-sm text-[#6b7280]">Akses Aktif</p>
          <p className="mt-2 text-4xl font-black">{categoryAccess.filter((item) => item.is_active).length}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
        <div className="border-b border-[#f1f5f9] px-4 py-3 text-sm font-bold">User Roles</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
              <tr>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((item) => (
                <tr key={item.id} className="border-t border-[#f1f5f9]">
                  <td className="px-4 py-3">{item.user_id}</td>
                  <td className="px-4 py-3 font-semibold">{item.role}</td>
                  <td className="px-4 py-3">{new Date(item.created_at).toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {roles.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[#6b7280]" colSpan={3}>
                    Belum ada role admin.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
        <div className="border-b border-[#f1f5f9] px-4 py-3 text-sm font-bold">Akses Admin Pertandingan</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
              <tr>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Pertandingan ID</th>
                <th className="px-4 py-3">Verif Peserta</th>
                <th className="px-4 py-3">Score RR</th>
                <th className="px-4 py-3">Score SE</th>
                <th className="px-4 py-3">Aktif</th>
              </tr>
            </thead>
            <tbody>
              {categoryAccess.map((item) => (
                <tr key={item.id} className="border-t border-[#f1f5f9]">
                  <td className="px-4 py-3">{item.user_id}</td>
                  <td className="px-4 py-3">{item.event_id}</td>
                  <td className="px-4 py-3">{item.category_id}</td>
                  <td className="px-4 py-3">{item.can_verify_registration ? "Ya" : "Tidak"}</td>
                  <td className="px-4 py-3">{item.can_score_rr ? "Ya" : "Tidak"}</td>
                  <td className="px-4 py-3">{item.can_score_se ? "Ya" : "Tidak"}</td>
                  <td className="px-4 py-3">{item.is_active ? "Ya" : "Tidak"}</td>
                </tr>
              ))}
              {categoryAccess.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[#6b7280]" colSpan={7}>
                    Belum ada akses admin pertandingan.
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
