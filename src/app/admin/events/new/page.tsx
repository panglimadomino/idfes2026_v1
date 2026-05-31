import Link from "next/link";
import { createEventAction } from "@/app/admin/actions";
import { EventCreateForm } from "@/app/admin/events/_components/event-create-form";
import { requireAdminAccess } from "@/lib/auth/server";

type AdminEventCreatePageProps = {
  searchParams: Promise<{ error?: string }>;
};

function getCreateErrorMessage(errorCode?: string) {
  if (!errorCode) return null;
  if (errorCode === "unauthorized") return "Akses ditolak. Hanya super_admin yang dapat membuat event.";
  if (errorCode === "required_fields") return "Form belum lengkap. Mohon isi semua field wajib.";
  if (errorCode === "invalid_status") return "Status event tidak valid.";
  if (errorCode === "max_banners") return "Maksimal 5 banner per event.";
  if (errorCode === "invalid_slug") return "Slug event tidak valid.";
  if (errorCode === "duplicate_slug") return "Slug event sudah dipakai. Coba ubah nama event.";
  if (errorCode === "banner_upload_failed") return "Upload banner gagal. Cek ukuran/format file lalu coba lagi.";
  if (errorCode === "banner_metadata_failed") return "Banner terupload, tetapi metadata gagal disimpan.";
  if (errorCode === "create_failed") return "Gagal menyimpan event. Mohon coba lagi.";
  return "Terjadi kesalahan saat menyimpan event.";
}

export default async function AdminEventCreatePage({ searchParams }: AdminEventCreatePageProps) {
  const access = await requireAdminAccess();
  const params = await searchParams;
  const createErrorMessage = getCreateErrorMessage(params.error);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-title text-5xl uppercase leading-none">Buat Event</h1>
            <p className="mt-2 text-sm text-[#6b7280]">Isi formulir untuk membuat event baru.</p>
          </div>
          <Link href="/admin/events" className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-semibold text-[#111827]">
            Kembali ke List Event
          </Link>
        </div>
      </section>

      {createErrorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{createErrorMessage}</section>
      ) : null}

      {access.isSuperAdmin ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-lg font-bold">Form Event Baru</h2>
          <EventCreateForm action={createEventAction} />
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Hanya super_admin yang dapat membuat event.
        </section>
      )}
    </div>
  );
}

