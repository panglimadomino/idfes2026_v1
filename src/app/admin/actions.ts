"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signOutAdminAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function upsertCmsPageAction(formData: FormData) {
  const access = await requireAdminAccess();
  if (!access.isSuperAdmin) {
    throw new Error("Hanya super admin yang dapat mengubah CMS pages.");
  }

  const pageKey = String(formData.get("page_key") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isPublished = formData.get("is_published") === "on";

  if (!pageKey || !title || !slug) {
    throw new Error("page_key, title, dan slug wajib diisi.");
  }

  if (!slug.startsWith("/")) {
    slug = `/${slug}`;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("cms_pages").upsert(
    {
      page_key: pageKey,
      title,
      slug,
      description: description || null,
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      updated_by: access.userId,
      created_by: access.userId,
    },
    { onConflict: "page_key" },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/cms/pages");
}

export async function uploadCmsMediaAction(formData: FormData) {
  const access = await requireAdminAccess();
  if (!access.isSuperAdmin) {
    throw new Error("Hanya super admin yang dapat upload media.");
  }

  const folder = String(formData.get("folder") ?? "branding").trim().toLowerCase();
  const usageType = String(formData.get("usage_type") ?? "generic").trim();
  const altText = String(formData.get("alt_text") ?? "").trim();
  const assetKey = String(formData.get("asset_key") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("File gambar wajib dipilih.");
  }

  if (!["branding", "pages", "sections"].includes(folder)) {
    throw new Error("Folder media tidak valid.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `${folder}/${Date.now()}-${safeName}`;
  const bytes = await file.arrayBuffer();

  const supabase = await createSupabaseServerClient();
  const { error: uploadError } = await supabase.storage.from("cms-assets").upload(objectPath, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage.from("cms-assets").getPublicUrl(objectPath);

  const { error: insertError } = await supabase.from("cms_media_assets").insert({
    asset_key: assetKey || null,
    usage_type: usageType,
    bucket_id: "cms-assets",
    object_path: objectPath,
    public_url: publicUrlData.publicUrl,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    alt_text: altText || null,
    uploaded_by: access.userId,
    is_active: true,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath("/admin/cms/media");
}
