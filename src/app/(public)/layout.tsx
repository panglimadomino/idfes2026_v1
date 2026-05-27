import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createSupabaseClient } from "@/lib/supabase/client";
import { getPublishedEventMenuItems } from "@/lib/public-events";

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
