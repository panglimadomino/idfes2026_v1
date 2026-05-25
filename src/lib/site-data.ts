export type EventCategory = {
  slug: string;
  name: string;
  venue: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  matchStartAt: string;
  quota: number;
  registered: number;
  updates: string[];
};

export type EventDocument = {
  title: string;
  fileUrl: string;
};

export type FestivalEvent = {
  slug: string;
  name: string;
  city: string;
  startDate: string;
  endDate: string;
  venue: string;
  heroTitle: string;
  heroSubtitle: string;
  activeOverride?: boolean;
  categories: EventCategory[];
  technicalHandbook: EventDocument;
  regulations: EventDocument[];
  partners: string[];
  news: {
    title: string;
    publishedAt: string;
    summary: string;
  }[];
};

export const festivalEvents: FestivalEvent[] = [
  {
    slug: "idfes-surabaya-2026",
    name: "IDFES Surabaya 2026",
    city: "Surabaya",
    startDate: "2026-07-20",
    endDate: "2026-07-27",
    venue: "Grand City Convention Hall",
    heroTitle: "Indonesia Domino Festival 2026",
    heroSubtitle:
      "Roadshow mind sport domino dengan sistem pertandingan terstruktur, live report, dan klasemen real-time.",
    activeOverride: true,
    categories: [
      {
        slug: "open-team",
        name: "Open Team",
        venue: "Hall A - Grand City",
        registrationOpenAt: "2026-05-01T08:00:00+07:00",
        registrationCloseAt: "2026-07-12T23:59:00+07:00",
        matchStartAt: "2026-07-20T09:00:00+07:00",
        quota: 512,
        registered: 438,
        updates: [
          "Verifikasi pembayaran batch 5 dibuka",
          "Pairing RR dirilis H-2 pertandingan",
        ],
      },
      {
        slug: "women-team",
        name: "Women Team",
        venue: "Hall B - Grand City",
        registrationOpenAt: "2026-05-03T08:00:00+07:00",
        registrationCloseAt: "2026-07-12T23:59:00+07:00",
        matchStartAt: "2026-07-21T09:00:00+07:00",
        quota: 256,
        registered: 199,
        updates: ["Technical meeting online: 18 Juli 2026 pukul 19:00 WIB"],
      },
      {
        slug: "junior-u21",
        name: "Junior U-21",
        venue: "Hall C - Grand City",
        registrationOpenAt: "2026-05-05T08:00:00+07:00",
        registrationCloseAt: "2026-07-10T23:59:00+07:00",
        matchStartAt: "2026-07-22T09:00:00+07:00",
        quota: 128,
        registered: 101,
        updates: ["Batas usia diverifikasi saat check-in race pack"],
      },
    ],
    technicalHandbook: {
      title: "Technical Handbook IDFES Surabaya 2026",
      fileUrl: "#",
    },
    regulations: [
      { title: "Peraturan Open Team", fileUrl: "#" },
      { title: "Peraturan Women Team", fileUrl: "#" },
      { title: "Peraturan Junior U-21", fileUrl: "#" },
    ],
    partners: ["PB ORADO", "PORDI Kota Surabaya", "HGI Mind Sport", "Grand City"],
    news: [
      {
        title: "Public Registration Dibuka Gelombang Kedua",
        publishedAt: "2026-05-10",
        summary:
          "Pendaftaran publik kategori Open Team dan Women Team diperpanjang hingga kuota terpenuhi.",
      },
      {
        title: "Update Venue dan Alur Check-In Peserta",
        publishedAt: "2026-05-18",
        summary:
          "Panitia merilis peta area pertandingan, meja registrasi, dan jam kedatangan per kategori.",
      },
      {
        title: "Rilis Jadwal Verifikasi Harian Admin Kategori",
        publishedAt: "2026-05-23",
        summary:
          "Setiap kategori kini memiliki tim admin tersendiri untuk verifikasi registrasi dan update status.",
      },
    ],
  },
  {
    slug: "idfes-makassar-2026",
    name: "IDFES Makassar 2026",
    city: "Makassar",
    startDate: "2026-09-15",
    endDate: "2026-09-21",
    venue: "Celebes Convention Center",
    heroTitle: "IDFES Makassar 2026",
    heroSubtitle: "Seri lanjutan roadshow Indonesia Domino Festival 2026.",
    categories: [
      {
        slug: "open-team",
        name: "Open Team",
        venue: "Main Hall",
        registrationOpenAt: "2026-07-25T08:00:00+07:00",
        registrationCloseAt: "2026-09-05T23:59:00+07:00",
        matchStartAt: "2026-09-15T09:00:00+07:00",
        quota: 512,
        registered: 0,
        updates: ["Menunggu pembukaan pendaftaran"],
      },
    ],
    technicalHandbook: {
      title: "Technical Handbook IDFES Makassar 2026",
      fileUrl: "#",
    },
    regulations: [{ title: "Peraturan Open Team", fileUrl: "#" }],
    partners: ["PB ORADO", "PORDI Makassar"],
    news: [
      {
        title: "Roadshow Berikutnya: Makassar",
        publishedAt: "2026-05-24",
        summary: "Panitia menyiapkan venue, format pertandingan, dan tim admin kategori untuk seri Makassar.",
      },
    ],
  },
];

export function getEventBySlug(slug: string): FestivalEvent | undefined {
  return festivalEvents.find((event) => event.slug === slug);
}

export function getEventStatus(event: FestivalEvent, now = new Date()): "ACTIVE" | "UPCOMING" | "FINISHED" {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  if (now < start) return "UPCOMING";
  if (now > end) return "FINISHED";
  return "ACTIVE";
}

export function getActiveEvent(now = new Date()): FestivalEvent {
  const manual = festivalEvents.find((event) => event.activeOverride);
  if (manual) return manual;

  const byDate = festivalEvents.find((event) => getEventStatus(event, now) === "ACTIVE");
  if (byDate) return byDate;

  const upcoming = festivalEvents
    .filter((event) => getEventStatus(event, now) === "UPCOMING")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return upcoming[0] ?? festivalEvents[0];
}
