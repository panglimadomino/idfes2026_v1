import Link from "next/link";
import { headers } from "next/headers";
import {
  deleteCategoryAdminAccessAction,
  registerCategoryAdminAction,
  sendCategoryAdminResetPasswordAction,
} from "@/app/admin/actions";
import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

type EventOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  event_id: string;
  name: string;
};

type AdminManagementPageProps = {
  searchParams: Promise<{
    event_id?: string;
    category_id?: string;
    invited?: string;
    reset_sent?: string;
    deleted?: string;
    error?: string;
  }>;
};

function getErrorMessage(code?: string) {
  if (!code) return null;
  if (code === "unauthorized") return "Akses ditolak. Hanya super_admin yang dapat mengelola admin pertandingan.";
  if (code === "required_fields") return "Field wajib belum lengkap.";
  if (code === "email_must_be_google") return "Email admin harus menggunakan akun Google (gmail.com/googlemail.com).";
  if (code === "permission_required") return "Minimal satu hak akses harus dipilih.";
  if (code === "invalid_event_category") return "Event / pertandingan yang dipilih tidak valid.";
  if (code === "invite_failed") return "Gagal mengirim undangan admin ke email.";
  if (code === "user_not_found_after_invite") return "Undangan terkirim, tapi user belum bisa diproses. Coba ulang lagi.";
  if (code === "save_role_failed") return "Gagal menyimpan role admin.";
  if (code === "save_access_failed") return "Gagal menyimpan akses admin pertandingan.";
  if (code === "reset_password_failed") return "Gagal mengirim email reset password.";
  if (code === "delete_access_failed") return "Gagal menghapus akses admin pertandingan.";
  if (code === "delete_role_failed") return "Akses terhapus, tapi role admin_category gagal dibersihkan.";
  return "Terjadi kesalahan saat memproses data admin.";
}

async function getUserEmailMap(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, string>();

  const adminClient = createSupabaseAdminClient();
  const targets = new Set(userIds);
  const emailMap = new Map<string, string>();
  let page = 1;
  const perPage = 200;

  for (let guard = 0; guard < 20; guard += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) break;

    const users = data.users ?? [];
    for (const user of users) {
      if (targets.has(user.id)) {
        emailMap.set(user.id, user.email ?? "-");
      }
    }

    if (users.length < perPage || emailMap.size >= targets.size) {
      break;
    }
    page += 1;
  }

  return emailMap;
}

export default async function AdminManagementPage({ searchParams }: AdminManagementPageProps) {
  const access = await requireAdminAccess();
  const params = await searchParams;
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const appOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
  const resetRedirectTo = `${appOrigin}/login`;
  const supabase = await createSupabaseServerClient();
  const eventId = String(params.event_id ?? "").trim();
  const categoryId = String(params.category_id ?? "").trim();
  const showInvited = params.invited === "1";
  const showResetSent = params.reset_sent === "1";
  const showDeleted = params.deleted === "1";
  const errorMessage = getErrorMessage(params.error);

  let categoryAccessBaseQuery = supabase
    .from("admin_category_access")
    .select("id, user_id, event_id, category_id, can_verify_registration, can_score_rr, can_score_se, is_active")
    .order("created_at", { ascending: false })
    .limit(200);

  if (eventId) categoryAccessBaseQuery = categoryAccessBaseQuery.eq("event_id", eventId);
  if (categoryId) categoryAccessBaseQuery = categoryAccessBaseQuery.eq("category_id", categoryId);

  const [rolesQuery, categoryAccessQuery, eventsQuery, categoriesQuery] = await Promise.all([
    supabase.from("user_roles").select("id, user_id, role, created_at").order("created_at", { ascending: false }).limit(200),
    categoryAccessBaseQuery,
    supabase.from("events").select("id, name").order("start_at", { ascending: false }).limit(200),
    supabase.from("event_categories").select("id, event_id, name").order("created_at", { ascending: false }).limit(500),
  ]);

  const roles = (rolesQuery.data ?? []) as UserRoleRow[];
  const categoryAccess = (categoryAccessQuery.data ?? []) as CategoryAccessRow[];
  const eventOptions = (eventsQuery.data ?? []) as EventOption[];
  const allCategoryOptions = (categoriesQuery.data ?? []) as CategoryOption[];
  const categoryOptions = eventId ? allCategoryOptions.filter((item) => item.event_id === eventId) : allCategoryOptions;

  const managedEvent = eventOptions.find((item) => item.id === eventId) ?? null;
  const managedCategory = allCategoryOptions.find((item) => item.id === categoryId) ?? null;

  const allUserIds = Array.from(new Set([...roles.map((item) => item.user_id), ...categoryAccess.map((item) => item.user_id)]));
  const userEmailMap = await getUserEmailMap(allUserIds);

  const selectedEventId = managedEvent?.id ?? eventOptions[0]?.id ?? "";
  const selectedCategoryId =
    managedCategory?.id ?? categoryOptions.find((item) => item.event_id === selectedEventId)?.id ?? categoryOptions[0]?.id ?? "";

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

      {showInvited ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Admin pertandingan berhasil didaftarkan / diundang via email.
        </section>
      ) : null}

      {showResetSent ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Email reset password berhasil dikirim.
        </section>
      ) : null}

      {showDeleted ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Akses admin pertandingan berhasil dihapus.
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</section>
      ) : null}

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

      {access.isSuperAdmin ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-lg font-bold text-[#111827]">Daftarkan Admin Pertandingan</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Daftarkan admin via email Google, kirim verifikasi email, lalu admin bisa membuat password sendiri.
          </p>
          <form action={registerCategoryAdminAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-[#374151] md:col-span-2">
              Email Admin (Google)
              <input
                required
                type="email"
                name="email"
                placeholder="admin@gmail.com"
                className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
              />
            </label>

            <label className="text-sm font-semibold text-[#374151]">
              Event
              <select
                name="event_id"
                required
                defaultValue={selectedEventId}
                className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
              >
                {eventOptions.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-[#374151]">
              Pertandingan
              <select
                name="category_id"
                required
                defaultValue={selectedCategoryId}
                className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
              >
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm">
              <input type="checkbox" name="can_verify_registration" defaultChecked />
              Verifikasi Pendaftaran
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm">
              <input type="checkbox" name="can_score_rr" defaultChecked />
              Input Score RR
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm md:col-span-2">
              <input type="checkbox" name="can_score_se" defaultChecked />
              Input Score SE
            </label>

            <div className="md:col-span-2">
              <button type="submit" className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                Daftarkan Admin Pertandingan
              </button>
            </div>
          </form>
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
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((item) => (
                <tr key={item.id} className="border-t border-[#f1f5f9]">
                  <td className="px-4 py-3">{userEmailMap.get(item.user_id) ?? "-"}</td>
                  <td className="px-4 py-3">{item.user_id}</td>
                  <td className="px-4 py-3 font-semibold">{item.role}</td>
                  <td className="px-4 py-3">{new Date(item.created_at).toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {roles.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[#6b7280]" colSpan={4}>
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
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Pertandingan ID</th>
                <th className="px-4 py-3">Verif Peserta</th>
                <th className="px-4 py-3">Score RR</th>
                <th className="px-4 py-3">Score SE</th>
                <th className="px-4 py-3">Aktif</th>
                {access.isSuperAdmin ? <th className="px-4 py-3">Aksi</th> : null}
              </tr>
            </thead>
            <tbody>
              {categoryAccess.map((item) => {
                const email = userEmailMap.get(item.user_id) ?? "-";
                return (
                  <tr key={item.id} className="border-t border-[#f1f5f9]">
                    <td className="px-4 py-3">{email}</td>
                    <td className="px-4 py-3">{item.user_id}</td>
                    <td className="px-4 py-3">{item.event_id}</td>
                    <td className="px-4 py-3">{item.category_id}</td>
                    <td className="px-4 py-3">{item.can_verify_registration ? "Ya" : "Tidak"}</td>
                    <td className="px-4 py-3">{item.can_score_rr ? "Ya" : "Tidak"}</td>
                    <td className="px-4 py-3">{item.can_score_se ? "Ya" : "Tidak"}</td>
                    <td className="px-4 py-3">{item.is_active ? "Ya" : "Tidak"}</td>
                    {access.isSuperAdmin ? (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {email !== "-" ? (
                            <form action={sendCategoryAdminResetPasswordAction}>
                              <input type="hidden" name="event_id" value={eventId} />
                              <input type="hidden" name="category_id" value={categoryId} />
                              <input type="hidden" name="email" value={email} />
                              <input type="hidden" name="reset_redirect_to" value={resetRedirectTo} />
                              <button
                                type="submit"
                                className="rounded-lg border border-[#d1d5db] px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#f9fafb]"
                              >
                                Buat Ulang Password
                              </button>
                            </form>
                          ) : null}
                          <form action={deleteCategoryAdminAccessAction}>
                            <input type="hidden" name="event_id" value={eventId} />
                            <input type="hidden" name="category_id" value={categoryId} />
                            <input type="hidden" name="access_id" value={item.id} />
                            <input type="hidden" name="user_id" value={item.user_id} />
                            <button type="submit" className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white">
                              Hapus Admin
                            </button>
                          </form>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
              {categoryAccess.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[#6b7280]" colSpan={access.isSuperAdmin ? 9 : 8}>
                    Belum ada akses admin pertandingan.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {eventId || categoryId ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-4 text-sm">
          <Link href="/admin/admins" className="font-semibold text-[#111827] underline">
            Reset Filter Manajemen Admin
          </Link>
        </section>
      ) : null}
    </div>
  );
}
