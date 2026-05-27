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

export async function upsertCmsSectionAction(formData: FormData) {
  const access = await requireAdminAccess();
  if (!access.isSuperAdmin) {
    throw new Error("Hanya super admin yang dapat mengubah CMS sections.");
  }

  const pageId = String(formData.get("page_id") ?? "").trim();
  const sectionKey = String(formData.get("section_key") ?? "").trim();
  const sectionType = String(formData.get("section_type") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const isVisible = formData.get("is_visible") === "on";
  const sortOrderRaw = String(formData.get("sort_order") ?? "0").trim();
  const contentRaw = String(formData.get("content_json") ?? "{}").trim();

  if (!pageId || !sectionKey || !sectionType) {
    throw new Error("page_id, section_key, dan section_type wajib diisi.");
  }

  const sortOrder = Number.parseInt(sortOrderRaw || "0", 10);
  if (Number.isNaN(sortOrder)) {
    throw new Error("sort_order harus berupa angka.");
  }

  let content: Record<string, unknown>;
  try {
    content = JSON.parse(contentRaw || "{}") as Record<string, unknown>;
  } catch {
    throw new Error("content_json harus valid JSON.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("cms_page_sections").upsert(
    {
      page_id: pageId,
      section_key: sectionKey,
      section_type: sectionType,
      title: title || null,
      subtitle: subtitle || null,
      content,
      is_visible: isVisible,
      sort_order: sortOrder,
      updated_by: access.userId,
      created_by: access.userId,
    },
    { onConflict: "page_id,section_key" },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/cms/pages");
}

export async function upsertCmsBlockAction(formData: FormData) {
  const access = await requireAdminAccess();
  if (!access.isSuperAdmin) {
    throw new Error("Hanya super admin yang dapat mengubah CMS blocks.");
  }

  const sectionId = String(formData.get("section_id") ?? "").trim();
  const blockKey = String(formData.get("block_key") ?? "").trim();
  const blockType = String(formData.get("block_type") ?? "").trim();
  const isVisible = formData.get("is_visible") === "on";
  const sortOrderRaw = String(formData.get("sort_order") ?? "0").trim();
  const payloadRaw = String(formData.get("payload_json") ?? "{}").trim();

  if (!sectionId || !blockKey || !blockType) {
    throw new Error("section_id, block_key, dan block_type wajib diisi.");
  }

  const sortOrder = Number.parseInt(sortOrderRaw || "0", 10);
  if (Number.isNaN(sortOrder)) {
    throw new Error("sort_order harus berupa angka.");
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(payloadRaw || "{}") as Record<string, unknown>;
  } catch {
    throw new Error("payload_json harus valid JSON.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("cms_page_blocks").upsert(
    {
      section_id: sectionId,
      block_key: blockKey,
      block_type: blockType,
      payload,
      is_visible: isVisible,
      sort_order: sortOrder,
      updated_by: access.userId,
      created_by: access.userId,
    },
    { onConflict: "section_id,block_key" },
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
  const province = String(formData.get("province") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const organizer = String(formData.get("organizer") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const startDate = String(formData.get("start_date") ?? formData.get("start_at") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? formData.get("end_at") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const isFeatured = formData.get("is_featured") === "on";
  const bannerFiles = formData
    .getAll("banners")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!name || !province || !city || !startDate || !endDate) {
    throw new Error("Nama event, provinsi, kabupaten/kota, tanggal mulai, dan tanggal selesai wajib diisi.");
  }

  if (!["draft", "published", "archived"].includes(status)) {
    throw new Error("Status event tidak valid.");
  }

  if (bannerFiles.length > 5) {
    throw new Error("Maksimal 5 banner per event.");
  }

  if (!slug) {
    slug = name;
  }
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) {
    throw new Error("Slug event tidak valid.");
  }

  const startAt = /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? `${startDate}T00:00:00+07:00` : startDate;
  const endAt = /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? `${endDate}T23:59:59+07:00` : endDate;

  const supabase = await createSupabaseServerClient();
  const eventCity = `${city}, ${province}`;
  const { data: insertedEvent, error } = await supabase
    .from("events")
    .insert({
      name,
      slug,
      city: eventCity,
      venue: organizer || null,
      start_at: startAt,
      end_at: endAt,
      status,
      is_featured: isFeatured,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (insertedEvent && bannerFiles.length > 0) {
    for (let index = 0; index < bannerFiles.length; index += 1) {
      const file = bannerFiles[index];
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const objectPath = `events/${insertedEvent.id}/${Date.now()}-${index + 1}-${safeName}`;
      const bytes = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage.from("event-banners").upload(objectPath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

      if (uploadError) {
        throw new Error(`Gagal upload banner: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage.from("event-banners").getPublicUrl(objectPath);
      const { error: insertBannerError } = await supabase.from("event_banners").insert({
        event_id: insertedEvent.id,
        bucket_id: "event-banners",
        object_path: objectPath,
        public_url: publicUrlData.publicUrl,
        file_name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
        sort_order: index + 1,
        uploaded_by: access.userId,
        is_active: true,
      });

      if (insertBannerError) {
        throw new Error(`Gagal simpan metadata banner: ${insertBannerError.message}`);
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/events");
}
