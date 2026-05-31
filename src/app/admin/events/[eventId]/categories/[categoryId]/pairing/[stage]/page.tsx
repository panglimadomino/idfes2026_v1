import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminAccess } from "@/lib/auth/server";
import { formatDateId } from "@/lib/date-id";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PairingStage = "rr" | "se";

type EventRow = {
  id: string;
  name: string;
};

type CategoryRow = {
  id: string;
  event_id: string;
  name: string;
};

type PairingRow = {
  id: string;
  category_id: string;
  stage: "RR" | "SE";
  cluster_code: string;
  round_no: number;
  pair_label: string | null;
  participant_a_registration_id: string | null;
  participant_b_registration_id: string | null;
  table_no: string | null;
  scheduled_at: string | null;
  status: string;
};

type ResultRow = {
  pairing_id: string;
  score_a: number;
  score_b: number;
  winner_registration_id: string | null;
};

type RegistrationRow = {
  id: string;
  registration_code: string;
  full_name: string;
};

type AdminCategoryPairingPageProps = {
  params: Promise<{ eventId: string; categoryId: string; stage: string }>;
};

function toStageLabel(stage: PairingStage) {
  return stage === "rr" ? "RR Pairing" : "SE Pairing";
}

export default async function AdminCategoryPairingPage({ params }: AdminCategoryPairingPageProps) {
  await requireAdminAccess();
  const { eventId, categoryId, stage } = await params;
  const stageKey = stage.toLowerCase() as PairingStage;
  if (stageKey !== "rr" && stageKey !== "se") notFound();

  const dbStage = stageKey === "rr" ? "RR" : "SE";
  const supabase = await createSupabaseServerClient();

  const [{ data: event }, { data: category }] = await Promise.all([
    supabase.from("events").select("id, name").eq("id", eventId).maybeSingle(),
    supabase.from("event_categories").select("id, event_id, name").eq("id", categoryId).maybeSingle(),
  ]);

  if (!event || !category) notFound();

  const eventRow = event as EventRow;
  const categoryRow = category as CategoryRow;
  if (categoryRow.event_id !== eventRow.id) notFound();

  const { data: pairings } = await supabase
    .from("category_pairings")
    .select(
      "id, category_id, stage, cluster_code, round_no, pair_label, participant_a_registration_id, participant_b_registration_id, table_no, scheduled_at, status",
    )
    .eq("category_id", categoryRow.id)
    .eq("stage", dbStage)
    .order("round_no", { ascending: true })
    .order("cluster_code", { ascending: true })
    .order("created_at", { ascending: true });

  const pairingRows = (pairings ?? []) as PairingRow[];
  const pairingIds = pairingRows.map((row) => row.id);
  const registrationIds = pairingRows
    .flatMap((row) => [row.participant_a_registration_id, row.participant_b_registration_id])
    .filter((id): id is string => Boolean(id));

  const [{ data: results }, { data: registrations }] = await Promise.all([
    pairingIds.length > 0
      ? supabase.from("category_match_results").select("pairing_id, score_a, score_b, winner_registration_id").in("pairing_id", pairingIds)
      : Promise.resolve({ data: [] as ResultRow[] }),
    registrationIds.length > 0
      ? supabase.from("registrations").select("id, registration_code, full_name").in("id", registrationIds)
      : Promise.resolve({ data: [] as RegistrationRow[] }),
  ]);

  const resultMap = new Map<string, ResultRow>();
  for (const row of ((results ?? []) as ResultRow[])) {
    resultMap.set(row.pairing_id, row);
  }

  const registrationMap = new Map<string, RegistrationRow>();
  for (const row of ((registrations ?? []) as RegistrationRow[])) {
    registrationMap.set(row.id, row);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-title text-5xl uppercase leading-none">{toStageLabel(stageKey)}</h1>
            <p className="mt-2 text-sm text-[#6b7280]">
              {eventRow.name} - {categoryRow.name}
            </p>
          </div>
          <Link
            href={`/admin/events/${eventRow.id}/categories/${categoryRow.id}`}
            className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-semibold text-[#111827]"
          >
            Kembali ke Detail Pertandingan
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/events/${eventRow.id}/categories/${categoryRow.id}`}
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#111827]"
          >
            Data Pertandingan
          </Link>
          <Link
            href={`/admin/admins?event_id=${eventRow.id}&category_id=${categoryRow.id}`}
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#111827]"
          >
            Admin Pertandingan
          </Link>
          <Link
            href={`/admin/registrations?event_id=${eventRow.id}&category_id=${categoryRow.id}`}
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#111827]"
          >
            Daftar Peserta (Terdaftar)
          </Link>
          <Link
            href={`/admin/events/${eventRow.id}/categories/${categoryRow.id}/pairing/rr`}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              stageKey === "rr" ? "bg-[#111827] text-white" : "border border-[#d1d5db] text-[#111827]"
            }`}
          >
            RR Pairing
          </Link>
          <Link
            href={`/admin/events/${eventRow.id}/categories/${categoryRow.id}/pairing/se`}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              stageKey === "se" ? "bg-[#111827] text-white" : "border border-[#d1d5db] text-[#111827]"
            }`}
          >
            SE Pairing
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
        <div className="border-b border-[#e5e7eb] px-6 py-4">
          <h2 className="text-lg font-bold text-[#111827]">Hasil Pairing {dbStage}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
              <tr>
                <th className="px-4 py-3">Cluster</th>
                <th className="px-4 py-3">Round</th>
                <th className="px-4 py-3">Pair</th>
                <th className="px-4 py-3">Peserta A</th>
                <th className="px-4 py-3">Peserta B</th>
                <th className="px-4 py-3">Skor</th>
                <th className="px-4 py-3">Pemenang</th>
                <th className="px-4 py-3">Meja</th>
                <th className="px-4 py-3">Jadwal</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pairingRows.map((row) => {
                const participantA = row.participant_a_registration_id ? registrationMap.get(row.participant_a_registration_id) : null;
                const participantB = row.participant_b_registration_id ? registrationMap.get(row.participant_b_registration_id) : null;
                const result = resultMap.get(row.id);
                const winner = result?.winner_registration_id ? registrationMap.get(result.winner_registration_id) : null;

                return (
                  <tr key={row.id} className="border-t border-[#f1f5f9]">
                    <td className="px-4 py-3">{row.cluster_code}</td>
                    <td className="px-4 py-3">{row.round_no}</td>
                    <td className="px-4 py-3">{row.pair_label ?? "-"}</td>
                    <td className="px-4 py-3">{participantA ? `${participantA.full_name} (${participantA.registration_code})` : "-"}</td>
                    <td className="px-4 py-3">{participantB ? `${participantB.full_name} (${participantB.registration_code})` : "-"}</td>
                    <td className="px-4 py-3">{result ? `${result.score_a} - ${result.score_b}` : "-"}</td>
                    <td className="px-4 py-3">{winner ? winner.full_name : "-"}</td>
                    <td className="px-4 py-3">{row.table_no ?? "-"}</td>
                    <td className="px-4 py-3">{row.scheduled_at ? formatDateId(row.scheduled_at) : "-"}</td>
                    <td className="px-4 py-3">{row.status}</td>
                  </tr>
                );
              })}
              {pairingRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-4 text-[#6b7280]">
                    Belum ada data pairing {dbStage} untuk pertandingan ini.
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
