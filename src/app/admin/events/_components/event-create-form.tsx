"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type RegionOption = {
  code: string;
  name: string;
};

type EventCreateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

export function EventCreateForm({ action }: EventCreateFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [provinces, setProvinces] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<RegionOption[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
        setProvinces(payload.data ?? []);
      } catch {
        if (!isActive) return;
        setFormError("Gagal memuat daftar provinsi. Coba refresh halaman.");
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

    async function loadCities() {
      setLoadingCities(true);
      try {
        const response = await fetch(`/api/regions/regencies?province=${provinceCode}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Gagal memuat kabupaten/kota");
        }
        const payload = (await response.json()) as { data?: RegionOption[] };
        if (!isActive) return;
        setCities(payload.data ?? []);
      } catch {
        if (!isActive) return;
        setFormError("Gagal memuat daftar kabupaten/kota untuk provinsi terpilih.");
      } finally {
        if (isActive) setLoadingCities(false);
      }
    }

    void loadCities();

    return () => {
      isActive = false;
    };
  }, [provinceCode]);

  const provinceName = useMemo(
    () => provinces.find((province) => province.code === provinceCode)?.name ?? "",
    [provinceCode, provinces],
  );
  const cityName = useMemo(() => cities.find((city) => city.code === cityCode)?.name ?? "", [cities, cityCode]);
  const organizer = provinceName ? `PENGPROV PORDI ${provinceName.toUpperCase()}` : "";

  function handleNameChange(value: string) {
    setName(value);
    setSlug(toSlug(value));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const selectedBanners = formData
      .getAll("banners")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (selectedBanners.length > 5) {
      event.preventDefault();
      setFormError("Maksimal 5 banner untuk setiap event.");
      return;
    }

    setFormError(null);
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
      <label className="text-sm font-semibold text-[#374151]">
        1. Provinsi
        <select
          required
          value={provinceCode}
          onChange={(event) => {
            const nextCode = event.target.value;
            setProvinceCode(nextCode);
            setCityCode("");
            setCities([]);
            setFormError(null);
          }}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
          disabled={loadingProvinces}
        >
          <option value="">{loadingProvinces ? "Memuat provinsi..." : "Pilih Provinsi"}</option>
          {provinces.map((province) => (
            <option key={province.code} value={province.code}>
              {province.name}
            </option>
          ))}
        </select>
        <input type="hidden" name="province" value={provinceName} />
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        2. Kabupaten/Kota
        <select
          required
          value={cityCode}
          onChange={(event) => {
            const nextCode = event.target.value;
            setCityCode(nextCode);
            setFormError(null);
          }}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
          disabled={!provinceCode || loadingCities}
        >
          <option value="">
            {!provinceCode ? "Pilih provinsi dulu" : loadingCities ? "Memuat kabupaten/kota..." : "Pilih Kabupaten/Kota"}
          </option>
          {cities.map((city) => (
            <option key={city.code} value={city.code}>
              {city.name}
            </option>
          ))}
        </select>
        <input type="hidden" name="city" value={cityName} />
      </label>

      <label className="text-sm font-semibold text-[#374151] md:col-span-2">
        3. Nama Event
        <input
          name="name"
          required
          placeholder="Nama Event"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        />
      </label>

      <label className="text-sm font-semibold text-[#374151] md:col-span-2">
        4. Penyelenggara (otomatis)
        <input
          name="organizer"
          required
          readOnly
          value={organizer}
          placeholder="Pilih provinsi dulu"
          className="mt-1 w-full rounded-lg border border-[#d1d5db] bg-[#f9fafb] px-3 py-2"
        />
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        5. Tanggal Mulai
        <input name="start_date" required type="date" className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        5. Tanggal Selesai
        <input name="end_date" required type="date" className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
      </label>

      <label className="text-sm font-semibold text-[#374151] md:col-span-2">
        Slug Otomatis (URL Event)
        <input
          readOnly
          value={slug}
          placeholder="akan otomatis dari nama event"
          className="mt-1 w-full rounded-lg border border-[#d1d5db] bg-[#f9fafb] px-3 py-2"
        />
      </label>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="status" value="draft" />

      <label className="text-sm font-semibold text-[#374151] md:col-span-2">
        6. Upload Banner (PNG/JPG, maksimal 5 gambar)
        <input
          name="banners"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          multiple
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        />
      </label>

      <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm md:col-span-2">
        <input type="checkbox" name="is_featured" />
        Jadikan event aktif/featured
      </label>

      {formError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">{formError}</p>
      ) : null}

      <button type="submit" className="w-fit rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white md:col-span-2">
        Simpan Event
      </button>
    </form>
  );
}
