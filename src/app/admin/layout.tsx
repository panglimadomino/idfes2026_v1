import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOutAdminAction } from "./actions";
import { AdminShell } from "./_components/admin-shell";
import { type AdminSidebarItem, type AdminSidebarSection } from "./_components/admin-sidebar-nav";

type EventSidebarRow = {
  id: string;
  name: string;
  start_at: string;
};

type CategorySidebarRow = {
  id: string;
  event_id: string;
  name: string;
  sort_order: number | null;
};

const baseAdminMenu: AdminSidebarSection[] = [
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
      { href: "/admin/events", label: "Event" },
      { href: "/admin/registrations", label: "Registrasi Peserta" },
      { href: "/admin/admins", label: "Manajemen Admin" },
    ],
  },
];

function buildEventTreeItems(events: EventSidebarRow[], categories: CategorySidebarRow[], isSuperAdmin: boolean): AdminSidebarItem[] {
  const categoriesByEvent = new Map<string, CategorySidebarRow[]>();
  for (const category of categories) {
    const list = categoriesByEvent.get(category.event_id) ?? [];
    list.push(category);
    categoriesByEvent.set(category.event_id, list);
  }

  const eventChildren: AdminSidebarItem[] = [];

  if (isSuperAdmin) {
    eventChildren.push({ href: "/admin/events/new", label: "Buat Event", exact: true });
  }

  for (const eventRow of events) {
    const eventCategories = (categoriesByEvent.get(eventRow.id) ?? []).sort((a, b) => {
      const left = a.sort_order ?? 0;
      const right = b.sort_order ?? 0;
      if (left !== right) return left - right;
      return a.name.localeCompare(b.name, "id");
    });

    const categoryChildren: AdminSidebarItem[] = eventCategories.map((categoryRow) => ({
      href: `/admin/events/${eventRow.id}/categories/${categoryRow.id}`,
      label: categoryRow.name,
      children: [
        {
          href: `/admin/admins?event_id=${eventRow.id}&category_id=${categoryRow.id}`,
          label: "Admin Pertandingan",
          exact: true,
        },
        {
          href: `/admin/registrations?event_id=${eventRow.id}&category_id=${categoryRow.id}`,
          label: "Peserta",
          exact: true,
        },
      ],
    }));

    const eventItemChildren: AdminSidebarItem[] = [];
    if (isSuperAdmin) {
      eventItemChildren.push({
        href: `/admin/events/schedule?manage_event_id=${eventRow.id}`,
        label: "Buat Pertandingan",
        exact: true,
      });
    }
    eventItemChildren.push(...categoryChildren);

    eventChildren.push({
      href: `/admin/events/${eventRow.id}`,
      label: eventRow.name,
      children: eventItemChildren,
    });
  }

  return [
    {
      href: "/admin/events",
      label: "Event",
      children: eventChildren,
    },
  ];
}

async function buildAdminMenu(isSuperAdmin: boolean): Promise<AdminSidebarSection[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: events }, { data: categories }] = await Promise.all([
    supabase.from("events").select("id, name, start_at").order("start_at", { ascending: false }).limit(200),
    supabase.from("event_categories").select("id, event_id, name, sort_order").limit(1000),
  ]);

  const eventRows = ((events ?? []) as EventSidebarRow[]).filter((row) => !!row.id && !!row.name);
  const categoryRows = ((categories ?? []) as CategorySidebarRow[]).filter((row) => !!row.id && !!row.event_id && !!row.name);

  return baseAdminMenu.map((section) => {
    if (section.title !== "Event & Operasional") return section;

    const eventItems = buildEventTreeItems(eventRows, categoryRows, isSuperAdmin);
    return {
      ...section,
      items: [
        ...eventItems,
        { href: "/admin/registrations", label: "Registrasi Peserta" },
        { href: "/admin/admins", label: "Manajemen Admin" },
      ],
    };
  });
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await requireAdminAccess();
  const adminMenu = await buildAdminMenu(access.isSuperAdmin);

  return (
    <AdminShell email={access.email} isSuperAdmin={access.isSuperAdmin} sections={adminMenu} onSignOut={signOutAdminAction}>
      {children}
    </AdminShell>
  );
}
