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
    const { data, error } = await supabase
      .from("event_categories")
      .select(
        "id, name, slug, sort_order, description, age_group, gender_category, participant_count, participant_unit, registration_open_at, registration_close_at, competition_start_at, competition_end_at, pairing_zone_count, pairing_cluster_count, pairing_group_count, pairing_table_count, prize_breakdown",
      )
      .eq("event_id", eventId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(30);

    if (error || !data) return [];
    return (data as Array<Record<string, unknown>>).map((item) => ({
      id: String(item.id ?? ""),
      name: String(item.name ?? ""),
      slug: String(item.slug ?? ""),
      sort_order: typeof item.sort_order === "number" ? item.sort_order : null,
      description: typeof item.description === "string" ? item.description : null,
      age_group: typeof item.age_group === "string" ? item.age_group : null,
      gender_category: typeof item.gender_category === "string" ? item.gender_category : null,
      participant_count: typeof item.participant_count === "number" ? item.participant_count : null,
      participant_unit: typeof item.participant_unit === "string" ? item.participant_unit : null,
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
