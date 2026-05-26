import { requireAdminAccess } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RegistrationRow = {
  id: string;
  registration_code: string;
  full_name: string;
  whatsapp: string;
  payment_status: string;
  verification_status: string;
  submitted_at: string;
};

export default async function AdminRegistrationsPage() {
  await requireAdminAccess();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("registrations")
    .select("id, registration_code, full_name, whatsapp, payment_status, verification_status, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as RegistrationRow[];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h1 className="font-title text-5xl uppercase leading-none">Registrasi Peserta</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Pantau status pembayaran dan verifikasi pendaftaran.</p>
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
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Verifikasi</th>
                <th className="px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((registration) => (
                <tr key={registration.id} className="border-t border-[#f1f5f9]">
                  <td className="px-4 py-3 font-semibold">{registration.registration_code}</td>
                  <td className="px-4 py-3">{registration.full_name}</td>
                  <td className="px-4 py-3">{registration.whatsapp}</td>
                  <td className="px-4 py-3">{registration.payment_status}</td>
                  <td className="px-4 py-3">{registration.verification_status}</td>
                  <td className="px-4 py-3">{new Date(registration.submitted_at).toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[#6b7280]" colSpan={6}>
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
