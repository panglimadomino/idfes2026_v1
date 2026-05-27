"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  const supabase = createSupabaseAdminClient();
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

  const supabase = createSupabaseAdminClient();
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

export async function deleteCmsMediaAction(formData: FormData) {
  const access = await requireAdminAccess();
  if (!access.isSuperAdmin) {
    redirect("/admin/cms/media?error=unauthorized");
  }

  const mediaAssetId = String(formData.get("media_asset_id") ?? "").trim();
  if (!mediaAssetId) {
    redirect("/admin/cms/media?error=invalid_id");
  }

  const supabase = await createSupabaseServerClient();

  const { data: deletedAsset, error: dbDeleteError } = await supabase
    .from("cms_media_assets")
    .delete()
    .eq("id", mediaAssetId)
    .select("bucket_id, object_path")
    .maybeSingle();

  if (dbDeleteError) {
    redirect("/admin/cms/media?error=delete_failed");
  }

  if (!deletedAsset) {
    redirect("/admin/cms/media?error=not_found");
  }

  const bucketId = deletedAsset.bucket_id || "cms-assets";
  const objectPath = deletedAsset.object_path;
  if (objectPath) {
    // Best-effort: if storage delete fails, DB state is still consistent.
    const { error: storageDeleteError } = await supabase.storage.from(bucketId).remove([objectPath]);
    if (storageDeleteError) {
      const rawMessage =
        typeof storageDeleteError.message === "string"
          ? storageDeleteError.message
          : JSON.stringify(storageDeleteError);
      const normalizedMessage = rawMessage.toLowerCase();
      if (!normalizedMessage.includes("not found")) {
        console.error("Storage delete warning:", rawMessage);
      }
    }
  }

  revalidatePath("/admin/cms/media");
  redirect("/admin/cms/media?deleted=1");
}

export async function createEventAction(formData: FormData) {
  const access = await requireAdminAccess();
  if (!access.isSuperAdmin) {
    throw new Error("Hanya super admin yang dapat membuat event.");
  }

  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const city = String(formData.get("city") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const startAt = String(formData.get("start_at") ?? "").trim();
  const endAt = String(formData.get("end_at") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const isFeatured = formData.get("is_featured") === "on";

  if (!name || !slug || !startAt || !endAt) {
    throw new Error("name, slug, start_at, dan end_at wajib diisi.");
  }

  if (!["draft", "published", "archived"].includes(status)) {
    throw new Error("Status event tidak valid.");
  }

  slug = slug.replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "");
  if (!slug) {
    throw new Error("Slug event tidak valid.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("events").insert({
    name,
    slug,
    city: city || null,
    venue: venue || null,
    start_at: startAt,
    end_at: endAt,
    status,
    is_featured: isFeatured,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/events");
}
