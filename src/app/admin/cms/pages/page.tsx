import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  updateHeroSectionAction,
  uploadCmsMediaAction,
  upsertCmsBlockAction,
  upsertCmsPageAction,
  upsertCmsSectionAction,
} from "@/app/admin/actions";

type CmsPageRow = {
  id: string;
  page_key: string;
  title: string;
  slug: string;
  is_published: boolean;
  updated_at: string;
};

type CmsSectionRow = {
  id: string;
  page_id: string;
  section_key: string;
  section_type: string;
  title: string | null;
  content: Record<string, unknown> | null;
  is_visible: boolean;
  sort_order: number;
  updated_at: string;
};

type CmsBlockRow = {
  id: string;
  section_id: string;
  block_key: string;
  block_type: string;
  is_visible: boolean;
  sort_order: number;
  updated_at: string;
};

type NavItemRow = {
  id: string;
  label: string;
  target_url: string;
  item_type: string;
  is_visible: boolean;
  sort_order: number;
};

type SiteSettingRow = {
  id: string;
  setting_key: string;
  setting_group: string;
  is_public: boolean;
  updated_at: string;
};

type HeroMediaRow = {
  public_url: string | null;
  file_name: string | null;
  created_at: string;
};

type AdminCmsPagesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleQueryParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function getContentString(content: Record<string, unknown> | null | undefined, key: string, fallback = "") {
  const value = content?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

export default async function AdminCmsPagesPage({ searchParams }: AdminCmsPagesPageProps) {
  const access = await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedPageKey = getSingleQueryParam(resolvedSearchParams.page_key).trim();
  const selectedSectionKey = getSingleQueryParam(resolvedSearchParams.section_key).trim();

  const [pagesQuery, sectionsQuery, blocksQuery, navQuery, settingsQuery, heroMediaQuery] = await Promise.all([
    supabase.from("cms_pages").select("id, page_key, title, slug, is_published, updated_at").order("updated_at", { ascending: false }),
    supabase
      .from("cms_page_sections")
      .select("id, page_id, section_key, section_type, title, content, is_visible, sort_order, updated_at")
      .order("page_id", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("cms_page_blocks")
      .select("id, section_id, block_key, block_type, is_visible, sort_order, updated_at")
      .order("section_id", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("cms_navigation_items")
      .select("id, label, target_url, item_type, is_visible, sort_order")
      .order("sort_order", { ascending: true })
      .limit(30),
    supabase.from("cms_site_settings").select("id, setting_key, setting_group, is_public, updated_at").order("setting_group", { ascending: true }).limit(30),
    supabase
      .from("cms_media_assets")
      .select("public_url, file_name, created_at")
      .eq("usage_type", "hero_background")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const pages = (pagesQuery.data ?? []) as CmsPageRow[];
  const sections = (sectionsQuery.data ?? []) as CmsSectionRow[];
  const blocks = (blocksQuery.data ?? []) as CmsBlockRow[];
  const navItems = (navQuery.data ?? []) as NavItemRow[];
  const settings = (settingsQuery.data ?? []) as SiteSettingRow[];
  const heroMedia = (heroMediaQuery.data ?? null) as HeroMediaRow | null;

  const selectedPage = pages.find((page) => page.page_key === selectedPageKey) ?? null;
  const sectionsForSelectedPage = selectedPage ? sections.filter((section) => section.page_id === selectedPage.id) : sections;
  const selectedSection =
    selectedPage && selectedSectionKey
      ? sections.find((section) => section.page_id === selectedPage.id && section.section_key === selectedSectionKey) ?? null
      : null;

  const visibleSections = selectedPage ? sectionsForSelectedPage : sections;
  const visibleSectionIds = new Set(visibleSections.map((section) => section.id));
  const visibleBlocks = blocks.filter((block) => visibleSectionIds.has(block.section_id));

  const isHeroEditor = selectedPageKey === "home" && selectedSectionKey === "hero";
  const simpleHomeSections = new Set(["category_cards", "news_updates", "partner_banner"]);
  const isSimpleHomeSectionEditor = selectedPageKey === "home" && simpleHomeSections.has(selectedSectionKey);
  const sectionDisplayNameMap: Record<string, string> = {
    category_cards: "Card Event ID Fes 2026",
    news_updates: "Berita",
    partner_banner: "Footer",
  };
  const simpleSectionName = sectionDisplayNameMap[selectedSectionKey] ?? "Section";
  const simpleSectionTitle = selectedSection?.title?.trim() || "";
  const simpleSectionSubtitle = selectedSection?.subtitle?.trim() || "";
  const simpleSectionContentJson = JSON.stringify(selectedSection?.content ?? {}, null, 2);
  const simpleSectionTypeMap: Record<string, string> = {
    category_cards: "cards",
    news_updates: "news",
    partner_banner: "partners",
  };
  const simpleSectionType = selectedSection?.section_type || simpleSectionTypeMap[selectedSectionKey] || "section";
  const heroContent = selectedSection?.content ?? {};
  const heroDateText = getContentString(heroContent, "hero_date_text", "22-25 October 2026");
  const heroHeadline = getContentString(heroContent, "hero_headline", "A city that plays. A festival that celebrates.");
  const heroSubtitle = getContentString(heroContent, "hero_subtitle", "Public Registration is now open.");
  const heroCategoryName = getContentString(heroContent, "hero_category_name", "Open Team");
  const heroCategoryDate = getContentString(heroContent, "hero_category_date", "5 May 2026");
  const heroCtaLabel = getContentString(heroContent, "cta_label", "Register Now");
  const heroFooterText = getContentString(heroContent, "hero_footer_text", "Stay tuned to our official channels for more updates.");

  const errors = [
    pagesQuery.error ? `CMS pages: ${pagesQuery.error.message}` : null,
    sectionsQuery.error ? `CMS sections: ${sectionsQuery.error.message}` : null,
    blocksQuery.error ? `CMS blocks: ${blocksQuery.error.message}` : null,
    navQuery.error ? `CMS navigation: ${navQuery.error.message}` : null,
    settingsQuery.error ? `CMS settings: ${settingsQuery.error.message}` : null,
    heroMediaQuery.error ? `CMS hero background: ${heroMediaQuery.error.message}` : null,
  ].filter(Boolean) as string[];

  const header = (
    <>
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h1 className="font-title text-5xl uppercase leading-none">CMS Pages</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Kelola halaman public beserta section, block, navigation, dan site settings dari satu tempat.</p>
      </section>

      {selectedPage ? (
        <section className="rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-sm text-[#1e3a8a]">
          <p className="font-semibold">
            Konteks Edit: {selectedPage.title} ({selectedPage.page_key})
            {selectedSection ? ` -> ${selectedSection.title?.trim() || selectedSection.section_key}` : ""}
          </p>
          <p className="mt-1">Sidebar sudah mengarahkan ke halaman/section terpilih. Form di bawah siap dipakai untuk update konten section ini.</p>
        </section>
      ) : null}

      {errors.length > 0 ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </section>
      ) : null}
    </>
  );

  if (isHeroEditor) {
    return (
      <div className="space-y-6">
        {header}

        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-lg font-bold">Uploader Foto Background Hero</h2>
          <p className="mt-1 text-sm text-[#6b7280]">Upload foto background terbaru untuk Hero Section.</p>

          {heroMedia?.public_url ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-[#e5e7eb]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroMedia.public_url} alt="Hero background aktif" className="h-52 w-full object-cover" />
              <p className="border-t border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-xs text-[#6b7280]">
                Aktif: {heroMedia.file_name ?? "-"} ({new Date(heroMedia.created_at).toLocaleString("id-ID")})
              </p>
            </div>
          ) : null}

          <form action={uploadCmsMediaAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="folder" value="branding" />
            <input type="hidden" name="usage_type" value="hero_background" />
            <input type="hidden" name="asset_key" value="hero_background" />
            <input type="hidden" name="alt_text" value="Hero Background" />
            <input
              required
              name="file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="rounded-lg border border-[#d1d5db] px-3 py-2 md:col-span-2"
            />
            <button type="submit" className="w-fit rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
              Upload Background
            </button>
          </form>
        </section>

        {access.isSuperAdmin ? (
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
            <h2 className="text-lg font-bold">Ubah Kata-kata Label Hero Section</h2>
            <form action={updateHeroSectionAction} className="mt-4 grid gap-3">
              <input
                name="hero_date_text"
                defaultValue={heroDateText}
                placeholder="Tanggal hero (contoh: 22-25 October 2026)"
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <textarea
                name="hero_headline"
                defaultValue={heroHeadline}
                rows={2}
                placeholder="Judul utama hero"
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <input
                name="hero_subtitle"
                defaultValue={heroSubtitle}
                placeholder="Subjudul hero"
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <input
                name="hero_category_name"
                defaultValue={heroCategoryName}
                placeholder="Label kategori (contoh: Open Team)"
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <input
                name="hero_category_date"
                defaultValue={heroCategoryDate}
                placeholder="Tanggal kategori (contoh: 5 May 2026)"
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <input
                name="cta_label"
                defaultValue={heroCtaLabel}
                placeholder="Teks tombol (contoh: Register Now)"
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <textarea
                name="hero_footer_text"
                defaultValue={heroFooterText}
                rows={2}
                placeholder="Teks footer hero"
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <button type="submit" className="w-fit rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                Simpan Hero Section
              </button>
            </form>
          </section>
        ) : null}
      </div>
    );
  }

  if (isSimpleHomeSectionEditor) {
    return (
      <div className="space-y-6">
        {header}

        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-lg font-bold">Editor {simpleSectionName}</h2>
          <p className="mt-1 text-sm text-[#6b7280]">Mode ringkas agar konsisten. Ubah judul/subjudul section dari sini.</p>

          {access.isSuperAdmin && selectedPage ? (
            <form action={upsertCmsSectionAction} className="mt-4 grid gap-3">
              <input type="hidden" name="page_id" value={selectedPage.id} />
              <input type="hidden" name="section_key" value={selectedSectionKey} />
              <input type="hidden" name="section_type" value={simpleSectionType} />
              <input type="hidden" name="sort_order" value={String(selectedSection?.sort_order ?? 0)} />
              <textarea
                name="content_json"
                defaultValue={simpleSectionContentJson}
                rows={4}
                className="font-mono rounded-lg border border-[#d1d5db] px-3 py-2 text-xs"
              />
              <input
                name="title"
                defaultValue={simpleSectionTitle}
                placeholder={`Judul ${simpleSectionName}`}
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <input
                name="subtitle"
                defaultValue={simpleSectionSubtitle}
                placeholder={`Subjudul ${simpleSectionName} (opsional)`}
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm">
                <input type="checkbox" name="is_visible" defaultChecked={selectedSection?.is_visible ?? true} />
                Visible
              </label>
              <button type="submit" className="w-fit rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                Simpan {simpleSectionName}
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-[#6b7280]">Pilih page/section yang valid dari sidebar untuk mengedit section ini.</p>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {access.isSuperAdmin ? (
        <section className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <p className="text-sm text-[#6b7280]">Total Pages</p>
            <p className="mt-2 text-4xl font-black">{pages.length}</p>
          </article>
          <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <p className="text-sm text-[#6b7280]">Total Sections</p>
            <p className="mt-2 text-4xl font-black">{sections.length}</p>
          </article>
          <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <p className="text-sm text-[#6b7280]">Total Blocks</p>
            <p className="mt-2 text-4xl font-black">{blocks.length}</p>
          </article>
        </section>
      ) : null}

      {access.isSuperAdmin ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-lg font-bold">Tambah / Update Page</h2>
          <form action={upsertCmsPageAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="page_key" required placeholder="page_key (contoh: home)" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
            <input name="title" required placeholder="Title" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
            <input name="slug" required placeholder="/slug-halaman" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
            <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm">
              <input type="checkbox" name="is_published" />
              Published
            </label>
            <textarea
              name="description"
              placeholder="Deskripsi halaman"
              className="rounded-lg border border-[#d1d5db] px-3 py-2 md:col-span-2"
              rows={3}
            />
            <button type="submit" className="w-fit rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
              Simpan Page
            </button>
          </form>
        </section>
      ) : null}

      {access.isSuperAdmin ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
            <h2 className="text-lg font-bold">Tambah / Update Section</h2>
            <form action={upsertCmsSectionAction} className="mt-4 grid gap-3">
              <select
                name="page_id"
                required
                defaultValue={selectedPage?.id || ""}
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              >
                <option value="">Pilih Page</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.page_key} ({page.slug})
                  </option>
                ))}
              </select>
              <input
                name="section_key"
                required
                defaultValue={selectedSection?.section_key || ""}
                placeholder="section_key (contoh: hero)"
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <input
                name="section_type"
                required
                defaultValue={selectedSection?.section_type || ""}
                placeholder="section_type (contoh: hero/cards/news)"
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <input
                name="title"
                defaultValue={selectedSection?.title || ""}
                placeholder="Title section (opsional)"
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <input name="subtitle" placeholder="Subtitle section (opsional)" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
              <input
                name="sort_order"
                defaultValue="0"
                placeholder="sort_order"
                type="number"
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <textarea
                name="content_json"
                defaultValue={selectedSection ? JSON.stringify(selectedSection.content ?? {}, null, 2) : "{}"}
                rows={4}
                className="font-mono rounded-lg border border-[#d1d5db] px-3 py-2 text-xs"
              />
              <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm">
                <input type="checkbox" name="is_visible" defaultChecked />
                Visible
              </label>
              <button type="submit" className="w-fit rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                Simpan Section
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
            <h2 className="text-lg font-bold">Tambah / Update Block</h2>
            <form action={upsertCmsBlockAction} className="mt-4 grid gap-3">
              <select
                name="section_id"
                required
                defaultValue={selectedSection?.id || ""}
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              >
                <option value="">Pilih Section</option>
                {visibleSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.section_key} ({section.section_type})
                  </option>
                ))}
              </select>
              <input name="block_key" required placeholder="block_key (contoh: cta_primary)" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
              <input name="block_type" required placeholder="block_type (contoh: text/card/button)" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
              <input
                name="sort_order"
                defaultValue="0"
                placeholder="sort_order"
                type="number"
                className="rounded-lg border border-[#d1d5db] px-3 py-2"
              />
              <textarea
                name="payload_json"
                defaultValue="{}"
                rows={4}
                className="font-mono rounded-lg border border-[#d1d5db] px-3 py-2 text-xs"
              />
              <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm">
                <input type="checkbox" name="is_visible" defaultChecked />
                Visible
              </label>
              <button type="submit" className="w-fit rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                Simpan Block
              </button>
            </form>
          </article>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
              <tr>
                <th className="px-4 py-3">Page Key</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-t border-[#f1f5f9]">
                  <td className="px-4 py-3 font-semibold">{page.page_key}</td>
                  <td className="px-4 py-3">{page.title}</td>
                  <td className="px-4 py-3">{page.slug}</td>
                  <td className="px-4 py-3">{page.is_published ? "Published" : "Draft"}</td>
                  <td className="px-4 py-3">{new Date(page.updated_at).toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {pages.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[#6b7280]" colSpan={5}>
                    Belum ada data halaman.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#f1f5f9] px-4 py-3 text-sm font-bold">CMS Sections</div>
          <div className="max-h-[360px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
                <tr>
                  <th className="px-4 py-3">Section Key</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Visible</th>
                  <th className="px-4 py-3">Sort</th>
                </tr>
              </thead>
              <tbody>
                {visibleSections.map((section) => (
                  <tr key={section.id} className="border-t border-[#f1f5f9]">
                    <td className="px-4 py-3 font-semibold">{section.section_key}</td>
                    <td className="px-4 py-3">{section.section_type}</td>
                    <td className="px-4 py-3">{section.is_visible ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{section.sort_order}</td>
                  </tr>
                ))}
                {visibleSections.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-[#6b7280]" colSpan={4}>
                      Belum ada section.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#f1f5f9] px-4 py-3 text-sm font-bold">CMS Blocks</div>
          <div className="max-h-[360px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
                <tr>
                  <th className="px-4 py-3">Block Key</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Visible</th>
                  <th className="px-4 py-3">Sort</th>
                </tr>
              </thead>
              <tbody>
                {visibleBlocks.map((block) => (
                  <tr key={block.id} className="border-t border-[#f1f5f9]">
                    <td className="px-4 py-3 font-semibold">{block.block_key}</td>
                    <td className="px-4 py-3">{block.block_type}</td>
                    <td className="px-4 py-3">{block.is_visible ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{block.sort_order}</td>
                  </tr>
                ))}
                {visibleBlocks.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-[#6b7280]" colSpan={4}>
                      Belum ada block.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#f1f5f9] px-4 py-3 text-sm font-bold">Navigation Items</div>
          <div className="max-h-[320px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
                <tr>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Visible</th>
                </tr>
              </thead>
              <tbody>
                {navItems.map((item) => (
                  <tr key={item.id} className="border-t border-[#f1f5f9]">
                    <td className="px-4 py-3 font-semibold">{item.label}</td>
                    <td className="px-4 py-3">{item.target_url}</td>
                    <td className="px-4 py-3">{item.item_type}</td>
                    <td className="px-4 py-3">{item.is_visible ? "Yes" : "No"}</td>
                  </tr>
                ))}
                {navItems.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-[#6b7280]" colSpan={4}>
                      Belum ada navigation item.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#f1f5f9] px-4 py-3 text-sm font-bold">Site Settings</div>
          <div className="max-h-[320px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
                <tr>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Public</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((setting) => (
                  <tr key={setting.id} className="border-t border-[#f1f5f9]">
                    <td className="px-4 py-3 font-semibold">{setting.setting_key}</td>
                    <td className="px-4 py-3">{setting.setting_group}</td>
                    <td className="px-4 py-3">{setting.is_public ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{new Date(setting.updated_at).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
                {settings.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-[#6b7280]" colSpan={4}>
                      Belum ada site settings.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
