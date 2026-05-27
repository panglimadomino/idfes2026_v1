import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { upsertCmsBlockAction, upsertCmsPageAction, upsertCmsSectionAction } from "@/app/admin/actions";

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

export default async function AdminCmsPagesPage() {
  const access = await requireAdminAccess();
  const supabase = await createSupabaseServerClient();

  const [pagesQuery, sectionsQuery, blocksQuery, navQuery, settingsQuery] = await Promise.all([
    supabase.from("cms_pages").select("id, page_key, title, slug, is_published, updated_at").order("updated_at", { ascending: false }),
    supabase
      .from("cms_page_sections")
      .select("id, page_id, section_key, section_type, title, is_visible, sort_order, updated_at")
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
  ]);

  const pages = (pagesQuery.data ?? []) as CmsPageRow[];
  const sections = (sectionsQuery.data ?? []) as CmsSectionRow[];
  const blocks = (blocksQuery.data ?? []) as CmsBlockRow[];
  const navItems = (navQuery.data ?? []) as NavItemRow[];
  const settings = (settingsQuery.data ?? []) as SiteSettingRow[];

  const errors = [
    pagesQuery.error ? `CMS pages: ${pagesQuery.error.message}` : null,
    sectionsQuery.error ? `CMS sections: ${sectionsQuery.error.message}` : null,
    blocksQuery.error ? `CMS blocks: ${blocksQuery.error.message}` : null,
    navQuery.error ? `CMS navigation: ${navQuery.error.message}` : null,
    settingsQuery.error ? `CMS settings: ${settingsQuery.error.message}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h1 className="font-title text-5xl uppercase leading-none">CMS Pages</h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          Kelola halaman public beserta section, block, navigation, dan site settings dari satu tempat.
        </p>
      </section>

      {errors.length > 0 ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </section>
      ) : null}

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
              <select name="page_id" required className="rounded-lg border border-[#d1d5db] px-3 py-2">
                <option value="">Pilih Page</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.page_key} ({page.slug})
                  </option>
                ))}
              </select>
              <input name="section_key" required placeholder="section_key (contoh: hero)" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
              <input name="section_type" required placeholder="section_type (contoh: hero/cards/news)" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
              <input name="title" placeholder="Title section (opsional)" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
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
                defaultValue='{}'
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
              <select name="section_id" required className="rounded-lg border border-[#d1d5db] px-3 py-2">
                <option value="">Pilih Section</option>
                {sections.map((section) => (
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
                defaultValue='{}'
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
                {sections.map((section) => (
                  <tr key={section.id} className="border-t border-[#f1f5f9]">
                    <td className="px-4 py-3 font-semibold">{section.section_key}</td>
                    <td className="px-4 py-3">{section.section_type}</td>
                    <td className="px-4 py-3">{section.is_visible ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{section.sort_order}</td>
                  </tr>
                ))}
                {sections.length === 0 ? (
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
                {blocks.map((block) => (
                  <tr key={block.id} className="border-t border-[#f1f5f9]">
                    <td className="px-4 py-3 font-semibold">{block.block_key}</td>
                    <td className="px-4 py-3">{block.block_type}</td>
                    <td className="px-4 py-3">{block.is_visible ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{block.sort_order}</td>
                  </tr>
                ))}
                {blocks.length === 0 ? (
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
