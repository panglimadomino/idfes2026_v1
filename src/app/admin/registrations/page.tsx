import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RegistrationRow = {
  id: string;
  registration_code: string;
  registration_no: string | null;
  event_id: string;
  category_id: string;
  full_name: string;
  team_name: string | null;
  club_name: string | null;
  kabupaten_kota: string | null;
  whatsapp: string;
  payment_proof_url: string | null;
  payment_status: string;
  verification_status: string;
  submitted_at: string;
};

type RegistrationRowWithPreview = RegistrationRow & {
  payment_proof_signed_url: string | null;
  payment_proof_kind: "image" | "pdf" | "other" | null;
};

type AdminRegistrationsPageProps = {
  searchParams: Promise<{ event_id?: string; category_id?: string }>;
};

const PAYMENT_BUCKET = "registration-payment-proofs";
const SIGNED_URL_TTL_SECONDS = 60 * 30;

function detectPaymentProofKind(path: string | null) {
  if (!path) return null;
  const normalized = path.toLowerCase();
  if (normalized.endsWith(".png") || normalized.endsWith(".jpg") || normalized.endsWith(".jpeg") || normalized.endsWith(".webp")) {
    return "image" as const;
  }
  if (normalized.endsWith(".pdf")) {
    return "pdf" as const;
  }
  return "other" as const;
}

export default async function AdminRegistrationsPage({ searchParams }: AdminRegistrationsPageProps) {
  await requireAdminAccess();
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const eventId = String(params.event_id ?? "").trim();
  const categoryId = String(params.category_id ?? "").trim();

  let query = supabase
    .from("registrations")
    .select("id, registration_code, registration_no, event_id, category_id, full_name, team_name, club_name, kabupaten_kota, whatsapp, payment_proof_url, payment_status, verification_status, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(100);

  if (eventId) query = query.eq("event_id", eventId);
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;

  const rows = (data ?? []) as RegistrationRow[];
  const adminSupabase = createSupabaseAdminClient();
  const signedUrlEntries = await Promise.all(
    rows.map(async (registration) => {
      const objectPath = registration.payment_proof_url;
      if (!objectPath) {
        return [registration.id, null] as const;
      }

      const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
        .from(PAYMENT_BUCKET)
        .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        return [registration.id, null] as const;
      }

      return [registration.id, signedUrlData.signedUrl] as const;
    }),
  );

  const signedUrlMap = new Map<string, string | null>(signedUrlEntries);
  const rowsWithPreview: RegistrationRowWithPreview[] = rows.map((registration) => ({
    ...registration,
    payment_proof_signed_url: signedUrlMap.get(registration.id) ?? null,
    payment_proof_kind: detectPaymentProofKind(registration.payment_proof_url),
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h1 className="font-title text-5xl uppercase leading-none">Registrasi Peserta</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Pantau status pembayaran dan verifikasi pendaftaran.</p>
        {eventId || categoryId ? (
          <p className="mt-2 text-xs text-[#6b7280]">
            Filter aktif:
            {eventId ? ` event_id=${eventId}` : ""}
            {categoryId ? ` | category_id=${categoryId}` : ""}
          </p>
        ) : null}
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Gagal memuat data registrasi: {error.message}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f9fafb] text-xs uppercase tracking-wide text-[#6b7280]">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">No Reg</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Gardu/Club</th>
                <th className="px-4 py-3">Kab/Kota</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Pertandingan</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Bukti Bayar</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Verifikasi</th>
                <th className="px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {rowsWithPreview.map((registration) => (
                <tr key={registration.id} className="border-t border-[#f1f5f9]">
                  <td className="px-4 py-3 font-semibold">{registration.registration_code}</td>
                  <td className="px-4 py-3">{registration.registration_no ?? "-"}</td>
                  <td className="px-4 py-3">{registration.full_name}</td>
                  <td className="px-4 py-3">{registration.team_name ?? registration.club_name ?? "-"}</td>
                  <td className="px-4 py-3">{registration.kabupaten_kota ?? "-"}</td>
                  <td className="px-4 py-3">{registration.event_id}</td>
                  <td className="px-4 py-3">{registration.category_id}</td>
                  <td className="px-4 py-3">{registration.whatsapp}</td>
                  <td className="px-4 py-3">
                    {registration.payment_proof_signed_url ? (
                      <div className="space-y-2">
                        {registration.payment_proof_kind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={registration.payment_proof_signed_url}
                            alt={`Bukti bayar ${registration.registration_code}`}
                            className="h-20 w-20 rounded border border-[#e5e7eb] object-cover"
                          />
                        ) : registration.payment_proof_kind === "pdf" ? (
                          <div className="inline-flex h-20 w-20 items-center justify-center rounded border border-[#e5e7eb] bg-[#f9fafb] text-xs font-semibold text-[#374151]">
                            PDF
                          </div>
                        ) : null}
                        <a
                          href={registration.payment_proof_signed_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-lg border border-[#d1d5db] px-3 py-1 text-xs font-semibold text-[#111827] hover:bg-[#f9fafb]"
                        >
                          Buka File
                        </a>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">{registration.payment_status}</td>
                  <td className="px-4 py-3">{registration.verification_status}</td>
                  <td className="px-4 py-3">{new Date(registration.submitted_at).toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {rowsWithPreview.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[#6b7280]" colSpan={12}>
                    Belum ada data registrasi.
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
