import { NextResponse } from "next/server";
import { PROVINCE_FALLBACKS, type RegionOption } from "@/lib/regions";

type RegionApiPayload = {
  data?: RegionOption[];
};

export async function GET() {
  try {
    const response = await fetch("https://wilayah.id/api/provinces.json", {
      next: { revalidate: 86400 },
      cache: "force-cache",
    });

    if (response.ok) {
      const payload = (await response.json()) as RegionApiPayload;
      if (Array.isArray(payload.data) && payload.data.length > 0) {
        return NextResponse.json({ data: payload.data });
      }
    }
  } catch {
    // Fallback below
  }

  return NextResponse.json({ data: PROVINCE_FALLBACKS, fallback: true });
}
