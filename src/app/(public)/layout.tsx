import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();

  // Fetch header and footer logos from CMS media
  const { data: mediaAssets } = await supabase
    .from("cms_media_assets")
    .select("usage_type, public_url, alt_text")
    .in("usage_type", ["header_logo", "footer_logo"]);

  const headerLogo = mediaAssets?.find((m) => m.usage_type === "header_logo");
  const footerLogo = mediaAssets?.find((m) => m.usage_type === "footer_logo");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader logoUrl={headerLogo?.public_url} logoAlt={headerLogo?.alt_text} />
      <main className="w-full flex-1">{children}</main>
      <SiteFooter logoUrl={footerLogo?.public_url} logoAlt={footerLogo?.alt_text} />
    </div>
  );
}
