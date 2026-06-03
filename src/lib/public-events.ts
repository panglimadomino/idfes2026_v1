import { createSupabaseClient } from "@/lib/supabase/client";

export type PublicEvent = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  venue: string | null;
  description: string | null;
  start_at: string;
  end_at: string;
  is_featured: boolean;
  banner_url: string | null;
};

export type PublicEventCardCategory = {
  id: string;
  name: string;
  participant_count: number | null;
  participant_unit: string | null;
  sort_order: number | null;
};

export type PublicEventWithCategories = PublicEvent & {
  categories: PublicEventCardCategory[];
};

export type EventMenuItem = {
  href: string;
  label: string;
};

export type PublicEventCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number | null;
  description: string | null;
  age_group: string | null;
  gender_category: string | null;
  participant_count: number | null;
  participant_unit: string | null;
  registration_fee: number | null;
  registration_bank_name_1: string | null;
  registration_bank_account_number_1: string | null;
  registration_bank_account_holder_1: string | null;
  registration_bank_name_2: string | null;
  registration_bank_account_number_2: string | null;
  registration_bank_account_holder_2: string | null;
  registration_open_at: string | null;
  registration_close_at: string | null;
  competition_start_at: string | null;
  competition_end_at: string | null;
  pairing_zone_count: number | null;
  pairing_cluster_count: number | null;
  pairing_group_count: number | null;
  pairing_table_count: number | null;
  prize_breakdown: Array<{ label: string; amount: number }>;
};

export type PublicEventNews = {
  id: string;
  title: string;
  summary: string | null;
  body: string | null;
  cover_image_url: string | null;
  published_at: string | null;
};

export function extractProvinceLabel(city: string | null, fallback: string) {
  if (!city) return fallback;
  const parts = city
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || fallback;
}

export async function getPublishedEvents(limit = 50): Promise<PublicEvent[]> {
  try {
    const supabase = createSupabaseClient();
    const { data: events, error } = await supabase
      .from("events")
      .select("id, name, slug, city, venue, description, start_at, end_at, is_featured")
      .eq("status", "published")
      .order("start_at", { ascending: false })
      .limit(limit);

    if (error || !events) return [];

    const eventRows = events as Array<{
      id: string;
      name: string;
      slug: string;
      city: string | null;
      venue: string | null;
      description: string | null;
      start_at: string;
      end_at: string;
      is_featured: boolean;
    }>;
    const eventIds = eventRows.map((event) => event.id);

    const bannerByEventId: Record<string, string> = {};
    if (eventIds.length > 0) {
      const { data: banners, error: bannerError } = await supabase
        .from("event_banners")
        .select("event_id, public_url, sort_order, created_at")
        .eq("is_active", true)
        .in("event_id", eventIds)
        .order("event_id", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!bannerError && banners) {
        for (const banner of banners) {
          const eventId = String(banner.event_id ?? "");
          const publicUrl = String(banner.public_url ?? "");
          if (!eventId || !publicUrl || bannerByEventId[eventId]) continue;
          bannerByEventId[eventId] = publicUrl;
        }
      }
    }

    return eventRows.map((event) => ({
      ...event,
      banner_url: bannerByEventId[event.id] ?? null,
    }));
  } catch {
    return [];
  }
}

export async function getPublishedEventsWithCategories(limit = 50): Promise<PublicEventWithCategories[]> {
  try {
    const events = await getPublishedEvents(limit);
    if (events.length === 0) return [];

    const supabase = createSupabaseClient();
    const eventIds = events.map((event) => event.id);
    const { data, error } = await supabase
      .from("event_categories")
      .select("id, event_id, name, participant_count, participant_unit, sort_order")
      .in("event_id", eventIds)
      .eq("is_published", true)
      .order("event_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .limit(500);

    if (error || !data) {
      return events.map((event) => ({ ...event, categories: [] }));
    }

    const categoriesByEventId: Record<string, PublicEventCardCategory[]> = {};
    for (const row of data as Array<Record<string, unknown>>) {
      const eventId = typeof row.event_id === "string" ? row.event_id : "";
      if (!eventId) continue;
      if (!categoriesByEventId[eventId]) categoriesByEventId[eventId] = [];
      categoriesByEventId[eventId].push({
        id: String(row.id ?? ""),
        name: String(row.name ?? ""),
        participant_count: typeof row.participant_count === "number" ? row.participant_count : null,
        participant_unit: typeof row.participant_unit === "string" ? row.participant_unit : null,
        sort_order: typeof row.sort_order === "number" ? row.sort_order : null,
      });
    }

    return events.map((event) => ({
      ...event,
      categories: categoriesByEventId[event.id] ?? [],
    }));
  } catch {
    return [];
  }
}

export async function getPublishedEventMenuItems(limit = 50): Promise<EventMenuItem[]> {
  const events = await getPublishedEvents(limit);
  return events.map((event) => ({
    href: `/events/${event.slug}`,
    label: extractProvinceLabel(event.city, event.name),
  }));
}

export async function getPublishedEventBySlug(slug: string): Promise<PublicEvent | null> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, name, slug, city, venue, description, start_at, end_at, is_featured")
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return data as PublicEvent;
  } catch {
    return null;
  }
}

export async function getPublishedCategoriesByEventId(eventId: string): Promise<PublicEventCategory[]> {
  try {
    const supabase = createSupabaseClient();
    const selectWithFee =
      "id, name, slug, sort_order, description, age_group, gender_category, participant_count, participant_unit, registration_fee, registration_bank_name_1, registration_bank_account_number_1, registration_bank_account_holder_1, registration_bank_name_2, registration_bank_account_number_2, registration_bank_account_holder_2, registration_open_at, registration_close_at, competition_start_at, competition_end_at, pairing_zone_count, pairing_cluster_count, pairing_group_count, pairing_table_count, prize_breakdown";
    const selectWithoutFee =
      "id, name, slug, sort_order, description, age_group, gender_category, participant_count, participant_unit, registration_bank_name_1, registration_bank_account_number_1, registration_bank_account_holder_1, registration_bank_name_2, registration_bank_account_number_2, registration_bank_account_holder_2, registration_open_at, registration_close_at, competition_start_at, competition_end_at, pairing_zone_count, pairing_cluster_count, pairing_group_count, pairing_table_count, prize_breakdown";

    const query = supabase
      .from("event_categories")
      .select(selectWithFee)
      .eq("event_id", eventId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(30);
    const primaryResult = await query;
    let rawData = (primaryResult.data ?? null) as Array<Record<string, unknown>> | null;
    let errorMessage = primaryResult.error?.message ?? null;

    if (errorMessage && errorMessage.toLowerCase().includes("registration_fee")) {
      const fallbackResult = await supabase
        .from("event_categories")
        .select(selectWithoutFee)
        .eq("event_id", eventId)
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .limit(30);

      rawData = (fallbackResult.data ?? null) as Array<Record<string, unknown>> | null;
      errorMessage = fallbackResult.error?.message ?? null;
    }

    if (errorMessage || !rawData) return [];
    return rawData.map((item) => ({
      id: String(item.id ?? ""),
      name: String(item.name ?? ""),
      slug: String(item.slug ?? ""),
      sort_order: typeof item.sort_order === "number" ? item.sort_order : null,
      description: typeof item.description === "string" ? item.description : null,
      age_group: typeof item.age_group === "string" ? item.age_group : null,
      gender_category: typeof item.gender_category === "string" ? item.gender_category : null,
      participant_count: typeof item.participant_count === "number" ? item.participant_count : null,
      participant_unit: typeof item.participant_unit === "string" ? item.participant_unit : null,
      registration_fee: typeof item.registration_fee === "number" ? item.registration_fee : null,
      registration_bank_name_1: typeof item.registration_bank_name_1 === "string" ? item.registration_bank_name_1 : null,
      registration_bank_account_number_1:
        typeof item.registration_bank_account_number_1 === "string" ? item.registration_bank_account_number_1 : null,
      registration_bank_account_holder_1:
        typeof item.registration_bank_account_holder_1 === "string" ? item.registration_bank_account_holder_1 : null,
      registration_bank_name_2: typeof item.registration_bank_name_2 === "string" ? item.registration_bank_name_2 : null,
      registration_bank_account_number_2:
        typeof item.registration_bank_account_number_2 === "string" ? item.registration_bank_account_number_2 : null,
      registration_bank_account_holder_2:
        typeof item.registration_bank_account_holder_2 === "string" ? item.registration_bank_account_holder_2 : null,
      registration_open_at: typeof item.registration_open_at === "string" ? item.registration_open_at : null,
      registration_close_at: typeof item.registration_close_at === "string" ? item.registration_close_at : null,
      competition_start_at: typeof item.competition_start_at === "string" ? item.competition_start_at : null,
      competition_end_at: typeof item.competition_end_at === "string" ? item.competition_end_at : null,
      pairing_zone_count: typeof item.pairing_zone_count === "number" ? item.pairing_zone_count : null,
      pairing_cluster_count: typeof item.pairing_cluster_count === "number" ? item.pairing_cluster_count : null,
      pairing_group_count: typeof item.pairing_group_count === "number" ? item.pairing_group_count : null,
      pairing_table_count: typeof item.pairing_table_count === "number" ? item.pairing_table_count : null,
      prize_breakdown: Array.isArray(item.prize_breakdown)
        ? (item.prize_breakdown as Array<{ label?: unknown; amount?: unknown }>)
            .map((prize) => {
              const label = typeof prize.label === "string" ? prize.label : "";
              const amount = Number(prize.amount);
              if (!label || !Number.isFinite(amount) || amount <= 0) return null;
              return { label, amount: Math.trunc(amount) };
            })
            .filter((prize): prize is { label: string; amount: number } => prize !== null)
        : [],
    }));
  } catch {
    return [];
  }
}

export async function getActivePublishedEventWithCategories() {
  const events = await getPublishedEvents(50);
  if (events.length === 0) return null;

  const now = Date.now();
  const sortedByDate = [...events].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const ongoing = sortedByDate.find((event) => {
    const start = new Date(event.start_at).getTime();
    const end = new Date(event.end_at).getTime();
    return start <= now && now <= end;
  });

  const upcoming = sortedByDate.find((event) => new Date(event.start_at).getTime() > now);
  const featured = events.find((event) => event.is_featured);
  const selected = ongoing ?? upcoming ?? featured ?? sortedByDate[0];
  const categories = await getPublishedCategoriesByEventId(selected.id);
  return { event: selected, categories };
}

export async function getPublishedNewsByEventId(eventId: string): Promise<PublicEventNews[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("news_updates")
      .select("id, title, summary, body, cover_image_url, published_at")
      .eq("event_id", eventId)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(12);

    if (error || !data) return [];
    return data as PublicEventNews[];
  } catch {
    return [];
  }
}

export async function getPublishedNews(limit = 24): Promise<PublicEventNews[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("news_updates")
      .select("id, title, summary, body, cover_image_url, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as PublicEventNews[];
  } catch {
    return [];
  }
}

export async function getPublishedNewsById(newsId: string): Promise<PublicEventNews | null> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("news_updates")
      .select("id, title, summary, body, cover_image_url, published_at")
      .eq("is_published", true)
      .eq("id", newsId)
      .maybeSingle();

    if (error || !data) return null;
    return data as PublicEventNews;
  } catch {
    return null;
  }
}
