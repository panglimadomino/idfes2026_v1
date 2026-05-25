import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { upsertCmsPageAction } from "@/app/admin/actions";

type CmsPageRow = {
  id: string;
  page_key: string;
  title: string;
  slug: string;
  is_published: boolean;
  updated_at: string;
};

export default async function AdminCmsPagesPage() {
  const access = await requireAdminAccess();
  const supabase = await createSupabaseServerClient();

  const { data: pages, error } = await supabase
    .from("cms_pages")
    .select("id, page_key, title, slug, is_published, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (pages ?? []) as CmsPageRow[];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h1 className="font-title text-5xl uppercase leading-none">CMS Pages</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Kelola halaman public (home, event, peraturan, form, login).</p>
      </section>

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
              Simpan
            </button>
          </form>
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
              {rows.map((page) => (
                <tr key={page.id} className="border-t border-[#f1f5f9]">
                  <td className="px-4 py-3 font-semibold">{page.page_key}</td>
                  <td className="px-4 py-3">{page.title}</td>
                  <td className="px-4 py-3">{page.slug}</td>
                  <td className="px-4 py-3">{page.is_published ? "Published" : "Draft"}</td>
                  <td className="px-4 py-3">{new Date(page.updated_at).toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
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
    </div>
  );
}
