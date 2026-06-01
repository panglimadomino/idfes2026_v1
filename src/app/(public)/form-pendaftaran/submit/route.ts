import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PHOTO_BUCKET = "registration-athlete-photos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type EventRow = {
  id: string;
  slug: string;
  city: string | null;
};

type CategoryRow = {
  id: string;
  slug: string;
  event_id: string;
  participant_unit: string | null;
  registration_open_at: string | null;
  registration_close_at: string | null;
};

function slugToken(input: string, length = 6) {
  const normalized = input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!normalized) return "X";
  return normalized.slice(0, length);
}

function randomToken(length = 6) {
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
}

function nowDateToken() {
  const now = new Date();
  const yyyy = now.getUTCFullYear().toString();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function buildRegistrationNo(eventSlug: string, categorySlug: string) {
  return `REG-${slugToken(eventSlug)}-${slugToken(categorySlug)}-${nowDateToken()}-${randomToken(6)}`;
}

function buildOrderId(eventSlug: string, categorySlug: string) {
  return `ORD-${slugToken(eventSlug)}-${slugToken(categorySlug)}-${Date.now()}`;
}

function parseEventCity(city: string | null) {
  const cleaned = String(city ?? "").trim();
  if (!cleaned) return { cityValue: null as string | null, provinceValue: null as string | null };
  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return { cityValue: null, provinceValue: null };
  if (parts.length === 1) return { cityValue: parts[0], provinceValue: null };
  return { cityValue: parts[0], provinceValue: parts[parts.length - 1] };
}

function baseRedirectUrl(req: Request, eventSlug: string, categorySlug: string) {
  const url = new URL("/form-pendaftaran", req.url);
  if (eventSlug) url.searchParams.set("event", eventSlug);
  if (categorySlug) url.searchParams.set("category", categorySlug);
  return url;
}

function buildErrorRedirect(req: Request, eventSlug: string, categorySlug: string, message: string) {
  const url = baseRedirectUrl(req, eventSlug, categorySlug);
  url.searchParams.set("status", "error");
  url.searchParams.set("message", message);
  return NextResponse.redirect(url, { status: 303 });
}

function buildSuccessRedirect(req: Request, eventSlug: string, categorySlug: string, message: string) {
  const url = baseRedirectUrl(req, eventSlug, categorySlug);
  url.searchParams.set("status", "ok");
  url.searchParams.set("message", message);
  return NextResponse.redirect(url, { status: 303 });
}

function getText(formData: FormData, name: string) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim() : "";
}

function isValidPhotoFile(file: File | null) {
  if (!file) return false;
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) return false;
  if (file.size <= 0 || file.size > MAX_PHOTO_BYTES) return false;
  return true;
}

async function uploadAthletePhoto(params: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  file: File;
  eventId: string;
  categoryId: string;
  registrationNo: string;
  athleteOrder: 1 | 2;
}) {
  const { supabase, file, eventId, categoryId, registrationNo, athleteOrder } = params;
  const fileExt = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const safeNo = registrationNo.replace(/[^a-zA-Z0-9_-]/g, "");
  const objectPath = `events/${eventId}/categories/${categoryId}/athletes/${safeNo}-athlete-${athleteOrder}.${fileExt}`;
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(objectPath, bytes, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);
  const { data: publicData } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(objectPath);
  return publicData.publicUrl;
}

export async function POST(req: Request) {
  let eventSlug = "";
  let categorySlug = "";

  try {
    const formData = await req.formData();
    eventSlug = getText(formData, "event_slug");
    categorySlug = getText(formData, "category_slug");

    const email = getText(formData, "email").toLowerCase();
    const athlete1Name = getText(formData, "athlete_1_name");
    const athlete1Whatsapp = getText(formData, "athlete_1_whatsapp");
    const athlete2Name = getText(formData, "athlete_2_name");
    const athlete2Whatsapp = getText(formData, "athlete_2_whatsapp");

    const athlete1Photo = formData.get("athlete_1_photo");
    const athlete2Photo = formData.get("athlete_2_photo");

    if (!eventSlug || !categorySlug || !email || !athlete1Name || !athlete1Whatsapp) {
      return buildErrorRedirect(req, eventSlug, categorySlug, "Data wajib belum lengkap.");
    }

    const athlete1File = athlete1Photo instanceof File ? athlete1Photo : null;
    if (!isValidPhotoFile(athlete1File)) {
      return buildErrorRedirect(req, eventSlug, categorySlug, "Foto atlet 1 wajib JPG/PNG/WEBP dan maksimal 5MB.");
    }

    const supabase = createSupabaseAdminClient();

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("id, slug, city")
      .eq("slug", eventSlug)
      .eq("status", "published")
      .maybeSingle();

    if (eventError || !eventData) {
      return buildErrorRedirect(req, eventSlug, categorySlug, "Event tidak ditemukan atau belum publish.");
    }
    const eventRow = eventData as EventRow;

    const { data: categoryData, error: categoryError } = await supabase
      .from("event_categories")
      .select("id, slug, event_id, participant_unit, registration_open_at, registration_close_at")
      .eq("event_id", eventRow.id)
      .eq("slug", categorySlug)
      .eq("is_published", true)
      .maybeSingle();

    if (categoryError || !categoryData) {
      return buildErrorRedirect(req, eventSlug, categorySlug, "Kategori pertandingan tidak ditemukan.");
    }
    const categoryRow = categoryData as CategoryRow;

    const now = Date.now();
    if (categoryRow.registration_open_at && new Date(categoryRow.registration_open_at).getTime() > now) {
      return buildErrorRedirect(req, eventSlug, categorySlug, "Pendaftaran kategori ini belum dibuka.");
    }
    if (categoryRow.registration_close_at && new Date(categoryRow.registration_close_at).getTime() < now) {
      return buildErrorRedirect(req, eventSlug, categorySlug, "Pendaftaran kategori ini sudah ditutup.");
    }

    const isPairCategory = categoryRow.participant_unit === "pasang";
    let athlete2File: File | null = null;
    if (isPairCategory) {
      athlete2File = athlete2Photo instanceof File ? athlete2Photo : null;
      if (!athlete2Name || !athlete2Whatsapp || !isValidPhotoFile(athlete2File)) {
        return buildErrorRedirect(
          req,
          eventSlug,
          categorySlug,
          "Kategori pasang wajib isi data atlet 2 dan upload foto atlet 2 (JPG/PNG/WEBP max 5MB).",
        );
      }
    }

    const registrationNo = buildRegistrationNo(eventRow.slug, categoryRow.slug);
    const orderId = buildOrderId(eventRow.slug, categoryRow.slug);

    let athlete1PhotoUrl: string;
    let athlete2PhotoUrl: string | null = null;
    try {
      athlete1PhotoUrl = await uploadAthletePhoto({
        supabase,
        file: athlete1File as File,
        eventId: eventRow.id,
        categoryId: categoryRow.id,
        registrationNo,
        athleteOrder: 1,
      });

      if (isPairCategory && athlete2File) {
        athlete2PhotoUrl = await uploadAthletePhoto({
          supabase,
          file: athlete2File,
          eventId: eventRow.id,
          categoryId: categoryRow.id,
          registrationNo,
          athleteOrder: 2,
        });
      }
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Gagal upload foto atlet.";
      return buildErrorRedirect(req, eventSlug, categorySlug, `Upload foto gagal: ${message}`);
    }

    const { cityValue, provinceValue } = parseEventCity(eventRow.city);
    const teamName = isPairCategory ? `${athlete1Name} / ${athlete2Name}` : athlete1Name;

    const insertPayload = {
      registration_code: registrationNo,
      registration_no: registrationNo,
      order_id: orderId,
      event_id: eventRow.id,
      category_id: categoryRow.id,
      full_name: athlete1Name,
      whatsapp: athlete1Whatsapp,
      email,
      team_name: teamName,
      club_name: teamName,
      city: cityValue,
      kabupaten_kota: cityValue,
      province: provinceValue,
      athlete_1_name: athlete1Name,
      athlete_1_whatsapp: athlete1Whatsapp,
      athlete_1_photo_url: athlete1PhotoUrl,
      athlete_2_name: isPairCategory ? athlete2Name : null,
      athlete_2_whatsapp: isPairCategory ? athlete2Whatsapp : null,
      athlete_2_photo_url: isPairCategory ? athlete2PhotoUrl : null,
      payment_status: "pending",
      verification_status: "pending",
    };

    const { error: insertError } = await supabase.from("registrations").insert(insertPayload);
    if (insertError) {
      return buildErrorRedirect(req, eventSlug, categorySlug, `Gagal menyimpan pendaftaran: ${insertError.message}`);
    }

    return buildSuccessRedirect(req, eventSlug, categorySlug, `Pendaftaran berhasil. No registrasi: ${registrationNo}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat submit pendaftaran.";
    return buildErrorRedirect(req, eventSlug, categorySlug, message);
  }
}
