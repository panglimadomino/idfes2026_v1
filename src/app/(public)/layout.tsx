import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createSupabaseClient } from "@/lib/supabase/client";

type EventMenuItem = {
  href: string;
  label: string;
};

function extractProvinceLabel(city: string | null, fallback: string) {
  if (!city) return fallback;
  const parts = city
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || fallback;
}

async function getHeaderLogoUrl() {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("cms_media_assets")
      .select("public_url")
      .eq("usage_type", "header_logo")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data?.public_url ?? null;
  } catch {
    return null;
  }
}

async function getPublishedEventMenuItems(): Promise<EventMenuItem[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("events")
      .select("slug, city, name, start_at")
      .eq("status", "published")
      .order("start_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      return [];
    }

    return data
      .map((event) => ({
        href: `/events/${event.slug}`,
        label: extractProvinceLabel(event.city, event.name),
      }))
      .filter((item) => Boolean(item.href) && Boolean(item.label));
  } catch {
    return [];
  }
}

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerLogoUrl = await getHeaderLogoUrl();
  const eventMenuItems = await getPublishedEventMenuItems();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader headerLogoUrl={headerLogoUrl} eventMenuItems={eventMenuItems} />
      <main className="w-full flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
