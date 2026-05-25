import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/server";
import { signOutAdminAction } from "./actions";

const adminMenu = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/cms/pages", label: "CMS Pages" },
  { href: "/admin/cms/media", label: "CMS Media" },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await requireAdminAccess();

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#111827]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-[#e5e7eb] bg-white p-6">
          <p className="font-title text-4xl uppercase leading-none">Admin IDFES</p>
          <p className="mt-2 text-sm text-[#6b7280]">{access.email}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#374151]">
            {access.isSuperAdmin ? "super_admin" : "admin_category"}
          </p>

          <nav className="mt-8 space-y-2">
            {adminMenu.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#111827] hover:bg-[#f3f4f6]">
                {item.label}
              </Link>
            ))}
          </nav>

          <form action={signOutAdminAction} className="mt-8">
            <button type="submit" className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
              Logout
            </button>
          </form>
        </aside>

        <section className="p-6 lg:p-8">{children}</section>
      </div>
    </div>
  );
}
