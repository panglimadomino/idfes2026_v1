import { requireAdminAccess } from "@/lib/auth/server";
import { signOutAdminAction } from "./actions";
import { AdminSidebarNav, type AdminSidebarSection } from "./_components/admin-sidebar-nav";

const adminMenu: AdminSidebarSection[] = [
  {
    title: "Utama",
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    title: "Kelola Halaman Public",
    items: [
      { href: "/admin/cms/pages", label: "CMS Halaman" },
      { href: "/admin/cms/media", label: "CMS Media" },
    ],
  },
  {
    title: "Event & Operasional",
    items: [
      { href: "/admin/events", label: "Buat Event" },
      { href: "/admin/registrations", label: "Registrasi Peserta" },
      { href: "/admin/admins", label: "Manajemen Admin" },
    ],
  },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await requireAdminAccess();

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#111827]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">
        <aside className="border-r border-[#e5e7eb] bg-white p-6 lg:sticky lg:top-0 lg:h-screen">
          <p className="font-title text-4xl uppercase leading-none">Admin IDFES</p>
          <p className="mt-2 text-sm text-[#6b7280]">{access.email}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#374151]">
            {access.isSuperAdmin ? "super_admin" : "admin_category"}
          </p>

          <AdminSidebarNav sections={adminMenu} />

          <form action={signOutAdminAction} className="mt-8">
            <button type="submit" className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
              Logout
            </button>
          </form>
        </aside>

        <section className="w-full p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </section>
      </div>
    </div>
  );
}
