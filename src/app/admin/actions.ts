"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeDateInputForStorage(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // Store at noon UTC to avoid off-by-one shifts across timezone conversions.
  return `${value}T12:00:00.000Z`;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildAdminRedirectUrl(basePath: string, query: Record<string, string>) {
  const params = new URLSearchParams(query);
  return `${basePath}?${params.toString()}`;
}

function normalizeCategoryRedirectBase(raw: string, eventId: string) {
  const fallback = buildAdminRedirectUrl("/admin/events/schedule", { manage_event_id: eventId });
  if (!raw) return fallback;

  try {
    const url = new URL(raw, "http://localhost");
    if (!url.pathname.startsWith("/admin/events/")) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

function appendQuery(urlWithOptionalQuery: string, query: Record<string, string>) {
  const [path, rawQuery = ""] = urlWithOptionalQuery.split("?");
  const params = new URLSearchParams(rawQuery);
  for (const [key, value] of Object.entries(query)) {
    params.set(key, value);
  }
  return `${path}?${params.toString()}`;
}

function isAllowedAdminEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith("@gmail.com") || normalized.endsWith("@googlemail.com");
}

async function findUserByEmail(email: string) {
  const adminClient = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  for (let guard = 0; guard < 20; guard += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message);
    }

    const users = data.users ?? [];
    const found = users.find((item) => (item.email ?? "").toLowerCase() === normalizedEmail);
    if (found) {
      return found;
    }

    if (users.length < perPage) {
      break;
    }
    page += 1;
  }

  return null;
}

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

export async function updateHeroSectionAction(formData: FormData) {
  const access = await requireAdminAccess();
  if (!access.isSuperAdmin) {
    throw new Error("Hanya super admin yang dapat mengubah Hero Section.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: homePage, error: pageError } = await supabase.from("cms_pages").select("id").eq("page_key", "home").maybeSingle();
  if (pageError || !homePage) {
    throw new Error(pageError?.message ?? "Halaman home tidak ditemukan.");
  }

  const { data: existingSection, error: sectionError } = await supabase
    .from("cms_page_sections")
    .select("id, title, subtitle, content, sort_order")
    .eq("page_id", homePage.id)
    .eq("section_key", "hero")
    .maybeSingle();
  if (sectionError) {
    throw new Error(sectionError.message);
  }

  const rawContent = (existingSection?.content ?? {}) as Record<string, unknown>;
  const content: Record<string, unknown> = {
    ...rawContent,
    hero_date_text: String(formData.get("hero_date_text") ?? "").trim(),
    hero_headline: String(formData.get("hero_headline") ?? "").trim(),
    hero_subtitle: String(formData.get("hero_subtitle") ?? "").trim(),
    hero_category_name: String(formData.get("hero_category_name") ?? "").trim(),
    hero_category_date: String(formData.get("hero_category_date") ?? "").trim(),
    cta_label: String(formData.get("cta_label") ?? "").trim(),
    hero_footer_text: String(formData.get("hero_footer_text") ?? "").trim(),
    cta_target: rawContent.cta_target ?? "active_event",
    background_asset_slot: rawContent.background_asset_slot ?? "hero_background",
  };

  const { error: upsertError } = await supabase.from("cms_page_sections").upsert(
    {
      page_id: homePage.id,
      section_key: "hero",
      section_type: "hero",
      title: existingSection?.title ?? "Hero Section",
      subtitle: existingSection?.subtitle ?? null,
      content,
      is_visible: true,
      sort_order: existingSection?.sort_order ?? 10,
      updated_by: access.userId,
      created_by: access.userId,
    },
    { onConflict: "page_id,section_key" },
  );
  if (upsertError) {
    throw new Error(upsertError.message);
  }

  revalidatePath("/admin/cms/pages");
  revalidatePath("/");
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
  revalidatePath("/admin/cms/pages");
  if (usageType === "hero_background") {
    revalidatePath("/");
  }
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
    redirect("/admin/events/new?error=unauthorized");
  }

  const name = String(formData.get("name") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const organizer = String(formData.get("organizer") ?? "").trim();
  const venueMapUrl = String(formData.get("venue_map_url") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const startDate = String(formData.get("start_date") ?? formData.get("start_at") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? formData.get("end_at") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const isFeatured = formData.get("is_featured") === "on";
  const bannerFiles = formData
    .getAll("banners")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!name || !province || !city || !startDate || !endDate) {
    redirect("/admin/events/new?error=required_fields");
  }

  if (!["draft", "published", "archived"].includes(status)) {
    redirect("/admin/events/new?error=invalid_status");
  }

  if (bannerFiles.length > 5) {
    redirect("/admin/events/new?error=max_banners");
  }

  if (!slug) {
    slug = name;
  }
  slug = normalizeSlug(slug);
  if (!slug) {
    redirect("/admin/events/new?error=invalid_slug");
  }

  const startAt = normalizeDateInputForStorage(startDate);
  const endAt = normalizeDateInputForStorage(endDate);

  const supabase = await createSupabaseServerClient();
  const eventCity = `${city}, ${province}`;
  const eventPayload = {
    name,
    slug,
    city: eventCity,
    venue: organizer || null,
    venue_map_url: venueMapUrl || null,
    start_at: startAt,
    end_at: endAt,
    status,
    is_featured: isFeatured,
  };

  let { data: insertedEvent, error } = await supabase.from("events").insert(eventPayload).select("id").single();

  // Backward-compatible fallback in case DB migration 015 has not been applied yet.
  if (error && error.message.toLowerCase().includes("venue_map_url")) {
    ({ data: insertedEvent, error } = await supabase
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
      .single());
  }

  if (error) {
    if (error.message.toLowerCase().includes("duplicate key")) {
      redirect("/admin/events/new?error=duplicate_slug");
    }
    redirect("/admin/events/new?error=create_failed");
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
        console.error("Gagal upload banner:", uploadError.message);
        redirect("/admin/events/new?error=banner_upload_failed");
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
        console.error("Gagal simpan metadata banner:", insertBannerError.message);
        redirect("/admin/events/new?error=banner_metadata_failed");
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  redirect("/admin/events?created=1");
}

export async function updateEventScheduleAction(formData: FormData) {
  const access = await requireAdminAccess();
  if (!access.isSuperAdmin) {
    redirect("/admin/events/schedule?error=unauthorized");
  }

  const eventId = String(formData.get("event_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const organizer = String(formData.get("organizer") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim().toLowerCase();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const isFeatured = formData.get("is_featured") === "on";

  if (!eventId || !name || !location || !startDate || !endDate || !slugInput) {
    redirect("/admin/events/schedule?error=required_fields");
  }

  if (!["draft", "published", "archived"].includes(status)) {
    redirect("/admin/events/schedule?error=invalid_status");
  }

  const slug = normalizeSlug(slugInput);

  if (!slug) {
    redirect("/admin/events/schedule?error=invalid_slug");
  }

  const startAt = normalizeDateInputForStorage(startDate);
  const endAt = normalizeDateInputForStorage(endDate);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("events")
    .update({
      name,
      slug,
      city: location,
      venue: organizer || null,
      start_at: startAt,
      end_at: endAt,
      status,
      is_featured: isFeatured,
    })
    .eq("id", eventId);

  if (error) {
    if (error.message.toLowerCase().includes("at least one pertandingan")) {
      redirect("/admin/events/schedule?error=event_requires_match");
    }
    if (error.message.toLowerCase().includes("duplicate key")) {
      redirect("/admin/events/schedule?error=duplicate_slug");
    }
    redirect("/admin/events/schedule?error=update_failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/admin/events/schedule");
  revalidatePath("/event");
  revalidatePath("/events");
  redirect("/admin/events/schedule?updated=1");
}

export async function upsertEventCategoryAction(formData: FormData) {
  const access = await requireAdminAccess();
  const eventId = String(formData.get("event_id") ?? "").trim();
  const redirectBase = normalizeCategoryRedirectBase(String(formData.get("redirect_to") ?? "").trim(), eventId);
  if (!access.isSuperAdmin) {
    redirect(appendQuery(redirectBase, { error: "unauthorized" }));
  }

  const categoryId = String(formData.get("category_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const ageGroupRaw = String(formData.get("age_group") ?? "").trim();
  const genderCategoryRaw = String(formData.get("gender_category") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const participantCountRaw = String(formData.get("participant_count") ?? "").trim();
  const participantUnitRaw = String(formData.get("participant_unit") ?? "").trim().toLowerCase();
  const registrationFeeRaw = String(formData.get("registration_fee") ?? "").trim();
  const registrationBankName1 = String(formData.get("registration_bank_name_1") ?? "").trim();
  const registrationBankAccountNumber1 = String(formData.get("registration_bank_account_number_1") ?? "").trim();
  const registrationBankAccountHolder1 = String(formData.get("registration_bank_account_holder_1") ?? "").trim();
  const registrationBankName2 = String(formData.get("registration_bank_name_2") ?? "").trim();
  const registrationBankAccountNumber2 = String(formData.get("registration_bank_account_number_2") ?? "").trim();
  const registrationBankAccountHolder2 = String(formData.get("registration_bank_account_holder_2") ?? "").trim();
  const registrationOpenDate = String(formData.get("registration_open_date") ?? "").trim();
  const registrationCloseDate = String(formData.get("registration_close_date") ?? "").trim();
  const competitionStartDate = String(formData.get("competition_start_date") ?? "").trim();
  const competitionEndDate = String(formData.get("competition_end_date") ?? "").trim();
  const pairingZoneCountRaw = String(formData.get("pairing_zone_count") ?? "0").trim();
  const pairingClusterCountRaw = String(formData.get("pairing_cluster_count") ?? "0").trim();
  const pairingGroupCountRaw = String(formData.get("pairing_group_count") ?? "0").trim();
  const pairingTableCountRaw = String(formData.get("pairing_table_count") ?? "0").trim();
  const prizeBreakdownRaw = String(formData.get("prize_breakdown_json") ?? "[]").trim();
  const sortOrderRaw = String(formData.get("sort_order") ?? "0").trim();
  const isPublished = formData.get("is_published") === "on";

  if (!eventId || !name || !ageGroupRaw || !genderCategoryRaw || !competitionStartDate || !competitionEndDate || !participantCountRaw) {
    redirect(appendQuery(redirectBase, { error: "required_fields" }));
  }

  const allowedAgeGroups = new Set(["Bebas", "U-25", "O+25"]);
  const allowedGenderCategories = new Set(["Putra", "Putri", "Campuran"]);
  const ageGroup = allowedAgeGroups.has(ageGroupRaw) ? ageGroupRaw : null;
  const genderCategory = allowedGenderCategories.has(genderCategoryRaw) ? genderCategoryRaw : null;
  if (!ageGroup || !genderCategory) {
    redirect(appendQuery(redirectBase, { error: "invalid_identity_config" }));
  }

  const sortOrder = Number.parseInt(sortOrderRaw || "0", 10);
  if (Number.isNaN(sortOrder)) {
    redirect(appendQuery(redirectBase, { error: "invalid_sort_order" }));
  }
  const participantCount = Number.parseInt(participantCountRaw || "0", 10);
  if (Number.isNaN(participantCount) || participantCount <= 0) {
    redirect(appendQuery(redirectBase, { error: "invalid_participant_count" }));
  }

  const allowedParticipantUnits = new Set(["pasang", "athlet", "peserta"]);
  const participantUnit = allowedParticipantUnits.has(participantUnitRaw) ? participantUnitRaw : "peserta";
  const registrationFeeDigits = registrationFeeRaw.replace(/\D/g, "");
  const registrationFee = registrationFeeDigits ? Number.parseInt(registrationFeeDigits, 10) : null;
  if (registrationFee !== null && (Number.isNaN(registrationFee) || registrationFee < 0)) {
    redirect(appendQuery(redirectBase, { error: "invalid_registration_fee" }));
  }

  const pairingZoneCount = Number.parseInt(pairingZoneCountRaw || "0", 10);
  const pairingClusterCount = Number.parseInt(pairingClusterCountRaw || "0", 10);
  const pairingGroupCount = Number.parseInt(pairingGroupCountRaw || "0", 10);
  const pairingTableCount = Number.parseInt(pairingTableCountRaw || "0", 10);
  if (
    [pairingZoneCount, pairingClusterCount, pairingGroupCount, pairingTableCount].some(
      (value) => Number.isNaN(value) || value < 0,
    )
  ) {
    redirect(appendQuery(redirectBase, { error: "invalid_pairing_config" }));
  }

  const slug = normalizeSlug(slugInput || name);
  if (!slug) {
    redirect(appendQuery(redirectBase, { error: "invalid_slug" }));
  }

  if (registrationOpenDate && registrationCloseDate && registrationCloseDate < registrationOpenDate) {
    redirect(appendQuery(redirectBase, { error: "invalid_registration_window" }));
  }

  if (competitionStartDate && competitionEndDate && competitionEndDate < competitionStartDate) {
    redirect(appendQuery(redirectBase, { error: "invalid_competition_window" }));
  }

  let prizeBreakdown: Array<{ label: string; amount: number }> = [];
  try {
    const parsed = JSON.parse(prizeBreakdownRaw) as Array<{ label?: unknown; amount?: unknown }>;
    if (Array.isArray(parsed)) {
      prizeBreakdown = parsed
        .map((item) => {
          const label = typeof item.label === "string" ? item.label.trim() : "";
          const amount = Number(item.amount);
          if (!label || !Number.isFinite(amount) || amount <= 0) return null;
          return { label, amount: Math.trunc(amount) };
        })
        .filter((item): item is { label: string; amount: number } => item !== null);
    }
  } catch {
    redirect(appendQuery(redirectBase, { error: "invalid_prize_config" }));
  }

  const supabase = await createSupabaseServerClient();
  const payload = {
    event_id: eventId,
    name,
    slug,
    description: description || null,
    participant_count: participantCount,
    participant_unit: participantUnit,
    registration_fee: registrationFee,
    registration_bank_name_1: registrationBankName1 || null,
    registration_bank_account_number_1: registrationBankAccountNumber1 || null,
    registration_bank_account_holder_1: registrationBankAccountHolder1 || null,
    registration_bank_name_2: registrationBankName2 || null,
    registration_bank_account_number_2: registrationBankAccountNumber2 || null,
    registration_bank_account_holder_2: registrationBankAccountHolder2 || null,
    age_group: ageGroup,
    gender_category: genderCategory,
    registration_open_at: registrationOpenDate ? normalizeDateInputForStorage(registrationOpenDate) : null,
    registration_close_at: registrationCloseDate ? normalizeDateInputForStorage(registrationCloseDate) : null,
    competition_start_at: competitionStartDate ? normalizeDateInputForStorage(competitionStartDate) : null,
    competition_end_at: competitionEndDate ? normalizeDateInputForStorage(competitionEndDate) : null,
    pairing_zone_count: pairingZoneCount,
    pairing_cluster_count: pairingClusterCount,
    pairing_group_count: pairingGroupCount,
    pairing_table_count: pairingTableCount,
    prize_breakdown: prizeBreakdown,
    is_published: isPublished,
    sort_order: sortOrder,
  };

  let error: { message: string } | null = null;
  if (categoryId) {
    const result = await supabase.from("event_categories").update(payload).eq("id", categoryId).eq("event_id", eventId);
    error = result.error;
  } else {
    const result = await supabase.from("event_categories").insert(payload);
    error = result.error;
  }

  if (error) {
    if (error.message.toLowerCase().includes("column") && error.message.toLowerCase().includes("event_categories")) {
      redirect(appendQuery(redirectBase, { error: "schema_not_ready" }));
    }
    if (error.message.toLowerCase().includes("duplicate key")) {
      redirect(appendQuery(redirectBase, { error: "duplicate_slug" }));
    }
    redirect(appendQuery(redirectBase, { error: "save_failed" }));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/events/schedule");
  revalidatePath("/admin/events/categories");
  revalidatePath("/event");
  revalidatePath("/events");
  redirect(appendQuery(redirectBase, { saved: "1" }));
}

export async function deleteEventCategoryAction(formData: FormData) {
  const access = await requireAdminAccess();
  const eventId = String(formData.get("event_id") ?? "").trim();
  if (!access.isSuperAdmin) {
    redirect(`/admin/events/schedule?manage_event_id=${encodeURIComponent(eventId)}&error=unauthorized`);
  }

  const categoryId = String(formData.get("category_id") ?? "").trim();
  if (!eventId || !categoryId) {
    redirect(`/admin/events/schedule?manage_event_id=${encodeURIComponent(eventId)}&error=required_fields`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("event_categories").delete().eq("id", categoryId).eq("event_id", eventId);
  if (error) {
    redirect(`/admin/events/schedule?manage_event_id=${encodeURIComponent(eventId)}&error=delete_failed`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/events/schedule");
  revalidatePath("/admin/events/categories");
  revalidatePath("/event");
  revalidatePath("/events");
  redirect(`/admin/events/schedule?manage_event_id=${encodeURIComponent(eventId)}&deleted=1`);
}

function buildAdminManagementRedirect(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const params = new URLSearchParams();
  if (eventId) params.set("event_id", eventId);
  if (categoryId) params.set("category_id", categoryId);
  return {
    url: `/admin/admins?${params.toString()}`,
    eventId,
    categoryId,
  };
}

export async function registerCategoryAdminAction(formData: FormData) {
  const access = await requireAdminAccess();
  const { url, eventId, categoryId } = buildAdminManagementRedirect(formData);
  if (!access.isSuperAdmin) {
    redirect(appendQuery(url, { error: "unauthorized" }));
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const canVerifyRegistration = formData.get("can_verify_registration") === "on";
  const canScoreRr = formData.get("can_score_rr") === "on";
  const canScoreSe = formData.get("can_score_se") === "on";

  if (!email || !eventId || !categoryId) {
    redirect(appendQuery(url, { error: "required_fields" }));
  }

  if (!isAllowedAdminEmail(email)) {
    redirect(appendQuery(url, { error: "email_must_be_google" }));
  }

  if (!canVerifyRegistration && !canScoreRr && !canScoreSe) {
    redirect(appendQuery(url, { error: "permission_required" }));
  }

  const supabase = await createSupabaseServerClient();
  const { data: categoryCheck, error: categoryError } = await supabase
    .from("event_categories")
    .select("id, event_id")
    .eq("id", categoryId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (categoryError || !categoryCheck) {
    redirect(appendQuery(url, { error: "invalid_event_category" }));
  }

  const adminClient = createSupabaseAdminClient();

  let user = await findUserByEmail(email);
  if (!user) {
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);
    if (inviteError) {
      redirect(appendQuery(url, { error: "invite_failed" }));
    }
    user = inviteData.user ?? null;
  }

  if (!user?.id) {
    redirect(appendQuery(url, { error: "user_not_found_after_invite" }));
  }

  const userId = user.id;

  const { error: roleError } = await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role: "admin_category",
    },
    { onConflict: "user_id,role" },
  );
  if (roleError) {
    redirect(appendQuery(url, { error: "save_role_failed" }));
  }

  const { error: accessError } = await supabase.from("admin_category_access").upsert(
    {
      user_id: userId,
      event_id: eventId,
      category_id: categoryId,
      can_verify_registration: canVerifyRegistration,
      can_score_rr: canScoreRr,
      can_score_se: canScoreSe,
      is_active: true,
    },
    { onConflict: "user_id,event_id,category_id" },
  );

  if (accessError) {
    redirect(appendQuery(url, { error: "save_access_failed" }));
  }

  revalidatePath("/admin/admins");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/categories/${categoryId}`);
  redirect(appendQuery(url, { invited: "1" }));
}

export async function sendCategoryAdminResetPasswordAction(formData: FormData) {
  const access = await requireAdminAccess();
  const { url } = buildAdminManagementRedirect(formData);
  if (!access.isSuperAdmin) {
    redirect(appendQuery(url, { error: "unauthorized" }));
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    redirect(appendQuery(url, { error: "required_fields" }));
  }

  const resetRedirectTo =
    String(formData.get("reset_redirect_to") ?? "").trim() || process.env.NEXT_PUBLIC_RESET_PASSWORD_REDIRECT_URL || "http://localhost:3000/login";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: resetRedirectTo,
  });

  if (error) {
    redirect(appendQuery(url, { error: "reset_password_failed" }));
  }

  redirect(appendQuery(url, { reset_sent: "1" }));
}

export async function deleteCategoryAdminAccessAction(formData: FormData) {
  const access = await requireAdminAccess();
  const { url } = buildAdminManagementRedirect(formData);
  if (!access.isSuperAdmin) {
    redirect(appendQuery(url, { error: "unauthorized" }));
  }

  const accessId = String(formData.get("access_id") ?? "").trim();
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!accessId || !userId) {
    redirect(appendQuery(url, { error: "required_fields" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error: deleteAccessError } = await supabase.from("admin_category_access").delete().eq("id", accessId).eq("user_id", userId);
  if (deleteAccessError) {
    redirect(appendQuery(url, { error: "delete_access_failed" }));
  }

  const { count, error: countError } = await supabase
    .from("admin_category_access")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!countError && (count ?? 0) === 0) {
    const { error: deleteRoleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin_category");
    if (deleteRoleError) {
      redirect(appendQuery(url, { error: "delete_role_failed" }));
    }
  }

  revalidatePath("/admin/admins");
  redirect(appendQuery(url, { deleted: "1" }));
}
