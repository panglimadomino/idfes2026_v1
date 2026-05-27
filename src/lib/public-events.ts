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
  description: string | null;
  competition_start_at: string | null;
  competition_end_at: string | null;
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
      .select("id, name, slug, description, competition_start_at, competition_end_at")
      .eq("event_id", eventId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(30);

    if (error || !data) return [];
    return data as PublicEventCategory[];
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
