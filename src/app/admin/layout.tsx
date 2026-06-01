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

type CmsPageSidebarRow = {
  id: string;
  page_key: string;
  title: string;
  slug: string;
};

type CmsSectionSidebarRow = {
  id: string;
  page_id: string;
  section_key: string;
  title: string | null;
  sort_order: number | null;
};

function toTitleCaseLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildPublicPageItem(page: CmsPageSidebarRow | null, cmsSections: CmsSectionSidebarRow[], fallbackLabel: string): AdminSidebarItem {
  if (!page) {
    return {
      href: "/admin/cms/pages",
      label: fallbackLabel,
      exact: true,
    };
  }

  const pageSections = cmsSections
    .filter((section) => section.page_id === page.id)
    .sort((a, b) => {
      const left = a.sort_order ?? 0;
      const right = b.sort_order ?? 0;
      if (left !== right) return left - right;
      return a.section_key.localeCompare(b.section_key, "id");
    });

  const sectionItems: AdminSidebarItem[] = pageSections.map((section) => ({
    href: `/admin/cms/pages?page_key=${page.page_key}&section_key=${section.section_key}`,
    label: section.title?.trim() || toTitleCaseLabel(section.section_key),
    exact: true,
  }));

  return {
    href: `/admin/cms/pages?page_key=${page.page_key}`,
    label: fallbackLabel,
    exact: true,
    children: sectionItems,
  };
}

function buildPublicContentTreeItems(cmsPages: CmsPageSidebarRow[], cmsSections: CmsSectionSidebarRow[]): AdminSidebarItem[] {
  const homePage = cmsPages.find((page) => page.page_key === "home" || page.slug === "/") ?? null;
  const idFesPage =
    cmsPages.find((page) => page.page_key === "event" || page.slug === "/event" || page.slug === "/events") ?? null;
  const newsPage = cmsPages.find((page) => page.page_key === "berita" || page.page_key === "news" || page.slug === "/berita") ?? null;

  return [
    buildPublicPageItem(homePage, cmsSections, "HOME"),
    buildPublicPageItem(idFesPage, cmsSections, "ID FES 2026"),
    buildPublicPageItem(newsPage, cmsSections, "BERITA"),
    {
      href: "/admin/cms/media",
      label: "Media Public",
      exact: true,
    },
  ];
}

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
          href: `/admin/events/${eventRow.id}/categories/${categoryRow.id}`,
          label: "Data Pertandingan",
          exact: true,
        },
        {
          href: `/admin/admins?event_id=${eventRow.id}&category_id=${categoryRow.id}`,
          label: "Admin Pertandingan",
          exact: true,
        },
        {
          href: `/admin/registrations?event_id=${eventRow.id}&category_id=${categoryRow.id}`,
          label: "Pendaftaran & Verifikasi Peserta",
          exact: true,
        },
        {
          href: `/admin/events/${eventRow.id}/categories/${categoryRow.id}/pairing/rr`,
          label: "RR Pairing",
          exact: true,
        },
        {
          href: `/admin/events/${eventRow.id}/categories/${categoryRow.id}/pairing/rr?view=bracket`,
          label: "Bagan RR",
          exact: true,
        },
        {
          href: `/admin/events/${eventRow.id}/categories/${categoryRow.id}/pairing/se`,
          label: "SE Pairing",
          exact: true,
        },
        {
          href: `/admin/events/${eventRow.id}/categories/${categoryRow.id}/pairing/se?view=bracket`,
          label: "Bagan SE",
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
      label: "ID FES 2026",
      children: eventChildren,
    },
  ];
}

async function buildAdminMenu(isSuperAdmin: boolean): Promise<AdminSidebarSection[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: events }, { data: categories }, { data: cmsPages }, { data: cmsSections }] = await Promise.all([
    supabase.from("events").select("id, name, start_at").order("start_at", { ascending: false }).limit(200),
    supabase.from("event_categories").select("id, event_id, name, sort_order").limit(1000),
    supabase.from("cms_pages").select("id, page_key, title, slug"),
    supabase
      .from("cms_page_sections")
      .select("id, page_id, section_key, title, sort_order")
      .eq("is_visible", true),
  ]);

  const eventRows = ((events ?? []) as EventSidebarRow[]).filter((row) => !!row.id && !!row.name);
  const categoryRows = ((categories ?? []) as CategorySidebarRow[]).filter((row) => !!row.id && !!row.event_id && !!row.name);
  const cmsPageRows = ((cmsPages ?? []) as CmsPageSidebarRow[]).filter((row) => !!row.id && !!row.page_key);
  const cmsSectionRows = ((cmsSections ?? []) as CmsSectionSidebarRow[]).filter(
    (row) => !!row.id && !!row.page_id && !!row.section_key,
  );

  return [
    {
      title: "Halaman",
      items: [{ href: "/admin", label: "Dashboard", exact: true }, ...buildPublicContentTreeItems(cmsPageRows, cmsSectionRows)],
    },
    {
      title: "ID FES 2026",
      items: buildEventTreeItems(eventRows, categoryRows, isSuperAdmin),
    },
  ];
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
