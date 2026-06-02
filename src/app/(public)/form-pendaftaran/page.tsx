import { RegistrationForm } from "./_components/registration-form";
import { getActivePublishedEventWithCategories, getPublishedCategoriesByEventId, getPublishedEventBySlug } from "@/lib/public-events";
import type { PublicEventCategory } from "@/lib/public-events";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateId } from "@/lib/date-id";

type RegistrationFormPageProps = {
  searchParams: Promise<{ event?: string; category?: string; status?: string; message?: string }>;
};

function formatWindow(start: string | null, end: string | null) {
  if (!start && !end) return "Belum ditentukan";
  if (start && end) return `${formatDateId(start)} - ${formatDateId(end)}`;
  return start ? formatDateId(start) : formatDateId(end as string);
}

function formatParticipant(category: PublicEventCategory) {
  if (!category.participant_count || category.participant_count <= 0) return "-";
  const unit = category.participant_unit === "pasang" ? "pasang" : category.participant_unit === "athlet" ? "atlet" : "peserta";
  return `${category.participant_count} ${unit}`;
}

async function getGarduOptions(eventId: string | null) {
  if (!eventId) return [];

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("registrations")
      .select("club_name, team_name, gardu_input, gardu_final")
      .eq("event_id", eventId)
      .order("submitted_at", { ascending: false })
      .limit(500);

    if (error || !data) return [];

    const uniqueNames = new Set<string>();
    for (const item of data as Array<Record<string, unknown>>) {
      for (const key of ["gardu_final", "gardu_input", "club_name", "team_name"] as const) {
        const value = item[key];
        if (typeof value !== "string") continue;
        const normalized = value.trim();
        if (normalized) uniqueNames.add(normalized);
      }
    }

    return [...uniqueNames].sort((left, right) => left.localeCompare(right, "id")).slice(0, 200);
  } catch {
    return [];
  }
}

export default async function RegistrationFormPage({ searchParams }: RegistrationFormPageProps) {
  const params = await searchParams;

  let eventData = await getActivePublishedEventWithCategories();
  if (params.event) {
    const selectedEvent = await getPublishedEventBySlug(params.event);
    if (selectedEvent) {
      const selectedEventCategories = await getPublishedCategoriesByEventId(selectedEvent.id);
      eventData = { event: selectedEvent, categories: selectedEventCategories };
    }
  }

  const event = eventData?.event ?? null;
  const categories = eventData?.categories ?? [];
  const selectedCategory =
    categories.find((item) => item.slug === params.category) ??
    categories[0] ??
    null;
  const statusMessage = params.message ? decodeURIComponent(params.message) : "";
  const statusType = params.status === "ok" ? "ok" : params.status === "error" ? "error" : null;
  const garduOptions = await getGarduOptions(event?.id ?? null);

  return (
    <div className="site-frame space-y-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-8">
        <h1 className="font-title text-6xl uppercase leading-none text-[var(--ink-strong)]">Form Pendaftaran</h1>
        <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">
          Form pendaftaran mengikuti kategori pertandingan yang dipilih. Setelah submit, peserta akan masuk antrean verifikasi admin.
        </p>
      </section>

      {event ? (
        <section className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6">
          <h2 className="text-lg font-bold text-[var(--ink-strong)]">Event Aktif: {event.name}</h2>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {categories.map((category) => (
              <div key={category.id} className="rounded-xl border border-[var(--line-soft)] p-4">
                <p className="text-sm font-bold text-[var(--ink-strong)]">{category.name}</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">Kuota {formatParticipant(category)}</p>
                <p className="text-xs text-[var(--ink-soft)]">{formatWindow(category.registration_open_at, category.registration_close_at)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Belum ada event published yang aktif untuk pendaftaran.
        </section>
      )}

      {statusType && statusMessage ? (
        <section
          className={`rounded-2xl border p-4 text-sm ${
            statusType === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {statusMessage}
        </section>
      ) : null}

      <RegistrationForm
        event={event}
        categories={categories}
        defaultCategorySlug={selectedCategory?.slug ?? ""}
        garduOptions={garduOptions}
      />
    </div>
  );
}
