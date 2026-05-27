import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();

  // Fetch header logo (latest uploaded)
  const { data: headerLogoData } = await supabase
    .from("cms_media_assets")
    .select("public_url, alt_text")
    .eq("usage_type", "header_logo")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch footer logo (latest uploaded)
  const { data: footerLogoData } = await supabase
    .from("cms_media_assets")
    .select("public_url, alt_text")
    .eq("usage_type", "footer_logo")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const headerLogo = headerLogoData;
  const footerLogo = footerLogoData;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader logoUrl={headerLogo?.public_url} logoAlt={headerLogo?.alt_text} />
      <main className="w-full flex-1">{children}</main>
      <SiteFooter logoUrl={footerLogo?.public_url} logoAlt={footerLogo?.alt_text} />
    </div>
  );
}
