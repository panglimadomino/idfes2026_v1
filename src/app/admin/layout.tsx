import { requireAdminAccess } from "@/lib/auth/server";
import { signOutAdminAction } from "./actions";
import { AdminShell } from "./_components/admin-shell";
import { type AdminSidebarSection } from "./_components/admin-sidebar-nav";

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
      { href: "/admin/events/schedule", label: "Event Schedule" },
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
    <AdminShell email={access.email} isSuperAdmin={access.isSuperAdmin} sections={adminMenu} onSignOut={signOutAdminAction}>
      {children}
    </AdminShell>
  );
}
