const JAKARTA_TIMEZONE = "Asia/Jakarta";

function asDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateId(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  const date = asDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { timeZone: JAKARTA_TIMEZONE, ...(options ?? {}) }).format(date);
}

export function toDateInputValueId(value: string | Date) {
  const date = asDate(value);
  if (!date) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: JAKARTA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}
