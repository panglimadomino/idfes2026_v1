"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicEvent, PublicEventCategory } from "@/lib/public-events";
import { formatDateId } from "@/lib/date-id";

type RegionOption = {
  code: string;
  name: string;
};

type RegistrationFormProps = {
  event: PublicEvent | null;
  categories: PublicEventCategory[];
  defaultCategorySlug: string;
  garduOptions: string[];
};

const GENDER_OPTIONS = ["Putra", "Putri", "Campuran"] as const;

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

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function RegistrationForm({ event, categories, defaultCategorySlug, garduOptions }: RegistrationFormProps) {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(defaultCategorySlug || categories[0]?.slug || "");
  const [provinceCode, setProvinceCode] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [regencyCode, setRegencyCode] = useState("");
  const [regencyName, setRegencyName] = useState("");
  const [provinces, setProvinces] = useState<RegionOption[]>([]);
  const [regencies, setRegencies] = useState<RegionOption[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.slug === selectedCategorySlug) ?? categories[0] ?? null,
    [categories, selectedCategorySlug],
  );
  const isPairCategory = selectedCategory?.participant_unit === "pasang";

  useEffect(() => {
    let isActive = true;

    async function loadProvinces() {
      setLoadingProvinces(true);
      try {
        const response = await fetch("/api/regions/provinces", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Gagal memuat provinsi");
        }
        const payload = (await response.json()) as { data?: RegionOption[] };
        if (!isActive) return;
        setRegionError(null);
        setProvinces(payload.data ?? []);
      } catch {
        if (!isActive) return;
        setRegionError("Gagal memuat daftar provinsi.");
      } finally {
        if (isActive) setLoadingProvinces(false);
      }
    }

    void loadProvinces();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!provinceCode) return;

    let isActive = true;

    async function loadRegencies() {
      setLoadingRegencies(true);
      try {
        const response = await fetch(`/api/regions/regencies?province=${provinceCode}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Gagal memuat kabupaten/kota");
        }
        const payload = (await response.json()) as { data?: RegionOption[] };
        if (!isActive) return;
        setRegionError(null);
        setRegencies(payload.data ?? []);
      } catch {
        if (!isActive) return;
        setRegionError("Gagal memuat daftar kabupaten/kota.");
      } finally {
        if (isActive) setLoadingRegencies(false);
      }
    }

    void loadRegencies();

    return () => {
      isActive = false;
    };
  }, [provinceCode]);

  return (
    <form
      className="space-y-6 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-6"
      encType="multipart/form-data"
      method="post"
      action="/form-pendaftaran/submit"
    >
      <input type="hidden" name="event_slug" value={event?.slug ?? ""} />
      <input type="hidden" name="province_name" value={provinceName} />
      <input type="hidden" name="regency_name" value={regencyName} />

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--ink-strong)]">Kategori Pertandingan</h2>
        <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
          Pilih Kategori
          <select
            name="category_slug"
            value={selectedCategorySlug}
            onChange={(event) => setSelectedCategorySlug(event.target.value)}
            className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--ink-strong)]">A. Identitas Atlet 1</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Nama Atlet
            <input
              name="athlete_1_name"
              required
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Tanggal Lahir
            <input
              name="athlete_1_date_of_birth"
              type="date"
              required
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Jenis Kelamin
            <select
              name="athlete_1_gender"
              defaultValue=""
              required
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            >
              <option value="" disabled>
                Pilih jenis kelamin
              </option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            No Whatsapp
            <input
              name="athlete_1_whatsapp"
              required
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Instagram
            <input
              name="athlete_1_instagram"
              placeholder="@username"
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Upload Photo
            <input
              name="athlete_1_photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--ink-strong)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--surface-card)]"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--ink-strong)]">B. Identitas Atlet 2</h2>
          {!isPairCategory ? <p className="text-xs text-[var(--ink-soft)]">Tidak wajib untuk kategori tunggal.</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Nama Atlet
            <input
              name="athlete_2_name"
              required={isPairCategory}
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Tanggal Lahir
            <input
              name="athlete_2_date_of_birth"
              type="date"
              required={isPairCategory}
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Jenis Kelamin
            <select
              name="athlete_2_gender"
              defaultValue=""
              required={isPairCategory}
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            >
              <option value="" disabled>
                Pilih jenis kelamin
              </option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            No Whatsapp
            <input
              name="athlete_2_whatsapp"
              required={isPairCategory}
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Instagram
            <input
              name="athlete_2_instagram"
              placeholder="@username"
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Upload Photo
            <input
              name="athlete_2_photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required={isPairCategory}
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--ink-strong)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--surface-card)]"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--ink-strong)]">C. Identitas Gardu/Club</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Provinsi
            <select
              name="province_code"
              required
              value={provinceCode}
              onChange={(event) => {
                const nextCode = event.target.value;
                const selectedProvince = provinces.find((province) => province.code === nextCode) ?? null;
                setProvinceCode(nextCode);
                setProvinceName(selectedProvince?.name ?? "");
                setRegencyCode("");
                setRegencyName("");
                setRegencies([]);
              }}
              disabled={loadingProvinces}
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            >
              <option value="">{loadingProvinces ? "Memuat provinsi..." : "Pilih provinsi"}</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Kabupaten/Kota
            <select
              name="kabupaten_kota"
              required
              value={regencyCode}
              onChange={(event) => {
                const nextCode = event.target.value;
                const selectedRegency = regencies.find((regency) => regency.code === nextCode) ?? null;
                setRegencyCode(nextCode);
                setRegencyName(selectedRegency?.name ?? "");
              }}
              disabled={!provinceCode || loadingRegencies}
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            >
              <option value="">
                {!provinceCode ? "Pilih provinsi dulu" : loadingRegencies ? "Memuat kabupaten/kota..." : "Pilih kabupaten/kota"}
              </option>
              {regencies.map((regency) => (
                <option key={regency.code} value={regency.code}>
                  {regency.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)] md:col-span-2">
            Nama Gardu/Club
            <input
              name="gardu_input"
              list="gardu-club-options"
              required
              placeholder="Pilih dari daftar atau isi manual"
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            />
            <datalist id="gardu-club-options">
              {garduOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)] md:col-span-2">
            Email
            <input
              name="email"
              type="email"
              placeholder="nama@email.com"
              required
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)]"
            />
          </label>
        </div>
        {regionError ? <p className="text-sm text-red-700">{regionError}</p> : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--ink-strong)]">D. Pembayaran</h2>
        {selectedCategory ? (
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-[var(--line-soft)] p-4 text-sm text-[var(--ink-soft)]">
              <p className="font-semibold text-[var(--ink-strong)]">{selectedCategory.registration_bank_name_1 ?? "Bank 1"}</p>
              <p>No Rek: {selectedCategory.registration_bank_account_number_1 ?? "-"}</p>
              <p>Atas Nama: {selectedCategory.registration_bank_account_holder_1 ?? "-"}</p>
            </article>
            <article className="rounded-xl border border-[var(--line-soft)] p-4 text-sm text-[var(--ink-soft)]">
              <p className="font-semibold text-[var(--ink-strong)]">{selectedCategory.registration_bank_name_2 ?? "Bank 2"}</p>
              <p>No Rek: {selectedCategory.registration_bank_account_number_2 ?? "-"}</p>
              <p>Atas Nama: {selectedCategory.registration_bank_account_holder_2 ?? "-"}</p>
            </article>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Biaya Pendaftaran
            <input
              value={selectedCategory && typeof selectedCategory.registration_fee === "number" ? formatRupiah(selectedCategory.registration_fee) : "-"}
              readOnly
              className="w-full rounded-lg border border-[var(--line-soft)] bg-[var(--surface-muted)] px-3 py-2 text-[var(--ink-strong)]"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-[var(--ink-soft)]">
            Upload Bukti Bayar
            <input
              name="payment_proof"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              required
              className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-[var(--ink-strong)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--ink-strong)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--surface-card)]"
            />
          </label>
        </div>
      </section>

      {selectedCategory ? (
        <section className="grid gap-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-muted)] p-4 md:grid-cols-2">
          <div className="text-sm text-[var(--ink-soft)]">
            <p className="font-semibold text-[var(--ink-strong)]">{selectedCategory.name}</p>
            <p>Kuota: {formatParticipant(selectedCategory)}</p>
            <p>Pendaftaran: {formatWindow(selectedCategory.registration_open_at, selectedCategory.registration_close_at)}</p>
          </div>
          <div className="text-sm text-[var(--ink-soft)]">
            <p>Pertandingan: {formatWindow(selectedCategory.competition_start_at, selectedCategory.competition_end_at)}</p>
            <p>
              Biaya:{" "}
              {typeof selectedCategory.registration_fee === "number" ? formatRupiah(selectedCategory.registration_fee) : "-"}
            </p>
          </div>
        </section>
      ) : null}

      <div>
        <button type="submit" className="rounded-full bg-[var(--ink-strong)] px-6 py-3 text-sm font-bold text-[var(--surface-card)]">
          Kirim Pendaftaran
        </button>
      </div>
    </form>
  );
}
