import { NextResponse } from "next/server";
import type { RegionOption } from "@/lib/regions";

type RegionApiPayload = {
  data?: RegionOption[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provinceCode = String(searchParams.get("province") ?? "").trim();

  if (!provinceCode) {
    return NextResponse.json({ data: [] });
  }

  try {
    const response = await fetch(`https://wilayah.id/api/regencies/${provinceCode}.json`, {
      next: { revalidate: 86400 },
      cache: "force-cache",
    });

    if (response.ok) {
      const payload = (await response.json()) as RegionApiPayload;
      if (Array.isArray(payload.data)) {
        return NextResponse.json({ data: payload.data });
      }
    }
  } catch {
    // Fallback below
  }

  return NextResponse.json({ data: [], fallback: true });
}
