"use client";

import { useMemo, useState } from "react";

type PrizeItem = {
  label: string;
  amount: number;
};

type EventCategoryFormDefaults = {
  categoryId?: string;
  noPertandingan: string;
  ageGroup: string;
  genderCategory: string;
  slug: string;
  description: string;
  participantCount: number | null;
  participantUnit: string;
  competitionStartDate: string;
  competitionEndDate: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
  pairingZoneCount: number;
  pairingClusterCount: number;
  pairingGroupCount: number;
  pairingTableCount: number;
  sortOrder: number;
  isPublished: boolean;
  prizes: PrizeItem[];
};

type EventCategoryFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  eventId: string;
  submitLabel: string;
  defaults: EventCategoryFormDefaults;
  isEdit?: boolean;
};

const MATCH_OPTIONS = [
  "Open Tournament",
  "Tingkat Nasional",
  "Tingkat Provinsi",
  "Tingkat Kabupaten/Kota",
  "Amatir",
  "Beregu",
] as const;
const AGE_OPTIONS = ["Bebas", "U-25", "O+25"] as const;
const GENDER_OPTIONS = ["Putra", "Putri", "Campuran"] as const;

const REQUIRED_PRIZE_LABELS = ["Juara 1", "Juara 2", "Juara 3", "Juara 4"] as const;
const OPTIONAL_PRIZE_LABELS = ["Juara 5 - 8", "Juara 9 - 16", "Juara 17 - 32", "Juara 33 - 64"] as const;

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

export function EventCategoryForm({ action, eventId, submitLabel, defaults, isEdit = false }: EventCategoryFormProps) {
  const initialMatchName = defaults.noPertandingan || MATCH_OPTIONS[0];
  const initialAgeGroup = defaults.ageGroup || AGE_OPTIONS[0];
  const initialGenderCategory = defaults.genderCategory || GENDER_OPTIONS[0];
  const matchOptions = useMemo(() => {
    if (MATCH_OPTIONS.includes(initialMatchName as (typeof MATCH_OPTIONS)[number])) {
      return MATCH_OPTIONS;
    }
    return [initialMatchName, ...MATCH_OPTIONS] as const;
  }, [initialMatchName]);
  const [noPertandingan, setNoPertandingan] = useState(initialMatchName);
  const [ageGroup, setAgeGroup] = useState(initialAgeGroup);
  const [genderCategory, setGenderCategory] = useState(initialGenderCategory);
  const [slug, setSlug] = useState(defaults.slug || toSlug(initialMatchName));
  const [visibleOptionalPrizeCount, setVisibleOptionalPrizeCount] = useState(() => {
    let count = 0;
    for (const label of OPTIONAL_PRIZE_LABELS) {
      const matched = defaults.prizes.find((item) => item.label === label && Number.isFinite(item.amount));
      if (matched) count += 1;
    }
    return count;
  });

  const initialPrizeMap = useMemo(() => {
    const values = new Map<string, string>();
    for (const prize of defaults.prizes) {
      values.set(prize.label, Number.isFinite(prize.amount) ? String(Math.trunc(prize.amount)) : "");
    }
    return values;
  }, [defaults.prizes]);
  const [prizeMap, setPrizeMap] = useState<Record<string, string>>(() => {
    const object: Record<string, string> = {};
    for (const label of [...REQUIRED_PRIZE_LABELS, ...OPTIONAL_PRIZE_LABELS]) {
      object[label] = initialPrizeMap.get(label) ?? "";
    }
    return object;
  });

  const categoryName = `${noPertandingan} - ${ageGroup} - ${genderCategory}`;

  const visibleOptionalLabels = OPTIONAL_PRIZE_LABELS.slice(0, visibleOptionalPrizeCount);
  const canAddMoreOptionalPrize = visibleOptionalPrizeCount < OPTIONAL_PRIZE_LABELS.length;

  const serializedPrizeBreakdown = JSON.stringify(
    [...REQUIRED_PRIZE_LABELS, ...visibleOptionalLabels]
      .map((label) => {
        const digits = (prizeMap[label] ?? "").replace(/\D/g, "");
        if (!digits) return null;
        const parsed = Number.parseInt(digits, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) return null;
        return { label, amount: parsed };
      })
      .filter(Boolean),
  );

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <input type="hidden" name="event_id" value={eventId} />
      {defaults.categoryId ? <input type="hidden" name="category_id" value={defaults.categoryId} /> : null}
      <input type="hidden" name="name" value={categoryName} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="age_group" value={ageGroup} />
      <input type="hidden" name="gender_category" value={genderCategory} />
      <input type="hidden" name="participant_count" value={String(defaults.participantCount ?? 1)} />
      <input type="hidden" name="participant_unit" value={defaults.participantUnit || "peserta"} />
      <input type="hidden" name="prize_breakdown_json" value={serializedPrizeBreakdown} />

      <h3 className="text-base font-bold text-[#111827]">A. Identitas Pertandingan</h3>

      <label className="text-sm font-semibold text-[#374151]">
        No Pertandingan
        <select
          required
          value={noPertandingan}
          onChange={(event) => {
            const value = event.target.value;
            setNoPertandingan(value);
            setSlug(toSlug(value));
          }}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        >
          {matchOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        Batas Usia
        <select
          required
          value={ageGroup}
          onChange={(event) => setAgeGroup(event.target.value)}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        >
          {AGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        Jenis Kelamin
        <select
          required
          value={genderCategory}
          onChange={(event) => setGenderCategory(event.target.value)}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        >
          {GENDER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        Slug (otomatis)
        <input
          readOnly
          value={slug}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] bg-[#f9fafb] px-3 py-2 text-[#6b7280]"
        />
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        Label Kategori (otomatis)
        <input
          readOnly
          value={categoryName}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] bg-[#f9fafb] px-3 py-2 text-[#6b7280]"
        />
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        Keterangan (opsional)
        <textarea
          name="description"
          rows={2}
          defaultValue={defaults.description}
          placeholder="Catatan singkat kategori pertandingan"
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        />
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        Tanggal Mulai Pertandingan
        <input
          required
          name="competition_start_date"
          type="date"
          defaultValue={defaults.competitionStartDate}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        />
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        Tanggal Selesai Pertandingan
        <input
          required
          name="competition_end_date"
          type="date"
          defaultValue={defaults.competitionEndDate}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        />
      </label>

      <h3 className="text-base font-bold text-[#111827]">B. Pendaftaran</h3>

      <label className="text-sm font-semibold text-[#374151]">
        Tanggal Mulai Pendaftaran
        <input
          name="registration_open_date"
          type="date"
          defaultValue={defaults.registrationOpenDate}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        />
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        Tanggal Selesai Pendaftaran
        <input
          name="registration_close_date"
          type="date"
          defaultValue={defaults.registrationCloseDate}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        />
      </label>

      <h3 className="text-base font-bold text-[#111827]">C. Pairing</h3>

      <label className="text-sm font-semibold text-[#374151]">
        Jumlah Zona
        <input
          required
          name="pairing_zone_count"
          type="number"
          min={0}
          defaultValue={defaults.pairingZoneCount}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        />
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        Jumlah Cluster
        <input
          required
          name="pairing_cluster_count"
          type="number"
          min={0}
          defaultValue={defaults.pairingClusterCount}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        />
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        Jumlah Group
        <input
          required
          name="pairing_group_count"
          type="number"
          min={0}
          defaultValue={defaults.pairingGroupCount}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        />
      </label>

      <label className="text-sm font-semibold text-[#374151]">
        Jumlah Meja
        <input
          required
          name="pairing_table_count"
          type="number"
          min={0}
          defaultValue={defaults.pairingTableCount}
          className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2"
        />
      </label>

      <h3 className="text-base font-bold text-[#111827]">D. Hadiah</h3>

      {[...REQUIRED_PRIZE_LABELS, ...visibleOptionalLabels].map((label) => (
        <label key={label} className="text-sm font-semibold text-[#374151]">
          {label}
          <div className="mt-1 flex items-center rounded-lg border border-[#d1d5db] bg-white">
            <span className="border-r border-[#e5e7eb] px-3 py-2 text-sm text-[#6b7280]">Rp.</span>
            <input
              inputMode="numeric"
              placeholder="0"
              value={prizeMap[label] ?? ""}
              onChange={(event) =>
                setPrizeMap((prev) => ({
                  ...prev,
                  [label]: event.target.value.replace(/\D/g, ""),
                }))
              }
              className="w-full px-3 py-2 outline-none"
            />
            <span className="border-l border-[#e5e7eb] px-3 py-2 text-sm text-[#6b7280]">,-</span>
          </div>
        </label>
      ))}

      <div>
        <button
          type="button"
          onClick={() => setVisibleOptionalPrizeCount((prev) => Math.min(prev + 1, OPTIONAL_PRIZE_LABELS.length))}
          disabled={!canAddMoreOptionalPrize}
          className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Tambah Juara
        </button>
      </div>

      <label className="text-sm font-semibold text-[#374151]">
        Sort Order
        <input name="sort_order" type="number" min={0} defaultValue={defaults.sortOrder} className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
      </label>

      <label className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm">
        <input type="checkbox" name="is_published" defaultChecked={defaults.isPublished} />
        Publish kategori ini
      </label>

      <div>
        <button type="submit" className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
          {submitLabel}
        </button>
      </div>

      {isEdit ? null : (
        <p className="text-xs text-[#6b7280]">
          Catatan: nilai hadiah diisi angka saja, sistem otomatis menampilkan format Rp. ... ,-
        </p>
      )}
    </form>
  );
}
