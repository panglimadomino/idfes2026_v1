import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteCmsMediaAction, uploadCmsMediaAction } from "@/app/admin/actions";

type MediaAssetRow = {
  id: string;
  asset_key: string | null;
  usage_type: string;
  object_path: string;
  public_url: string | null;
  alt_text: string | null;
  created_at: string;
};

type AdminCmsMediaPageProps = {
  searchParams: Promise<{ deleted?: string; error?: string }>;
};

function getDeleteMessage(errorCode?: string) {
  if (!errorCode) return null;
  if (errorCode === "unauthorized") return "Akses ditolak. Hanya super_admin yang dapat menghapus media.";
  if (errorCode === "invalid_id") return "Gagal menghapus media: ID tidak valid.";
  if (errorCode === "not_found") return "Media tidak ditemukan. Mungkin sudah terhapus.";
  if (errorCode === "fetch_failed") return "Gagal memuat data media untuk dihapus.";
  if (errorCode === "delete_failed") return "Gagal menghapus data media dari database.";
  return "Terjadi kesalahan saat menghapus media.";
}

export default async function AdminCmsMediaPage({ searchParams }: AdminCmsMediaPageProps) {
  const params = await searchParams;
  const access = await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  const deleteErrorMessage = getDeleteMessage(params.error);
  const showDeleteSuccess = params.deleted === "1";

  const { data: mediaAssets, error } = await supabase
    .from("cms_media_assets")
    .select("id, asset_key, usage_type, object_path, public_url, alt_text, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (mediaAssets ?? []) as MediaAssetRow[];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h1 className="font-title text-5xl uppercase leading-none">CMS Media</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Upload logo header/footer dan hero background.</p>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Gagal memuat data CMS media: {error.message}
        </section>
      ) : null}

      {showDeleteSuccess ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Media berhasil dihapus.
        </section>
      ) : null}

      {deleteErrorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{deleteErrorMessage}</section>
      ) : null}

      {access.isSuperAdmin ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-lg font-bold">Upload Gambar</h2>
          <form action={uploadCmsMediaAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="asset_key" placeholder="asset_key (opsional, unik)" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
            <select name="folder" className="rounded-lg border border-[#d1d5db] px-3 py-2">
              <option value="branding">branding</option>
              <option value="pages">pages</option>
              <option value="sections">sections</option>
            </select>
            <select name="usage_type" className="rounded-lg border border-[#d1d5db] px-3 py-2">
              <option value="header_logo">header_logo</option>
              <option value="footer_logo">footer_logo</option>
              <option value="hero_background">hero_background</option>
              <option value="section_background">section_background</option>
              <option value="generic">generic</option>
            </select>
            <input name="alt_text" placeholder="Alt text (opsional)" className="rounded-lg border border-[#d1d5db] px-3 py-2" />
            <input
              required
              name="file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="rounded-lg border border-[#d1d5db] px-3 py-2 md:col-span-2"
            />
            <button type="submit" className="w-fit rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
              Upload
            </button>
          </form>
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Upload media hanya untuk super_admin.
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
              <tr>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Asset Key</th>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Uploaded</th>
                {access.isSuperAdmin ? <th className="px-4 py-3">Aksi</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((asset) => (
                <tr key={asset.id} className="border-t border-[#f1f5f9]">
                  <td className="px-4 py-3">
                    {asset.public_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.public_url} alt={asset.alt_text ?? asset.usage_type} className="h-12 w-24 rounded border border-[#e5e7eb] object-cover" />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">{asset.usage_type}</td>
                  <td className="px-4 py-3">{asset.asset_key ?? "-"}</td>
                  <td className="px-4 py-3">{asset.object_path}</td>
                  <td className="px-4 py-3">{new Date(asset.created_at).toLocaleString("id-ID")}</td>
                  {access.isSuperAdmin ? (
                    <td className="px-4 py-3">
                      <form action={deleteCmsMediaAction}>
                        <input type="hidden" name="media_asset_id" value={asset.id} />
                        <button
                          type="submit"
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Hapus
                        </button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[#6b7280]" colSpan={access.isSuperAdmin ? 6 : 5}>
                    Belum ada media.
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
