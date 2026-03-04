import { NextResponse } from "next/server";
import { airlines as seedAirlines } from "@/lib/mock-data";
import type { AirlinesApiResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 10 * 60 * 1000;

let cache: {
  expiresAt: number;
  payload: AirlinesApiResponse;
} | null = null;

export async function GET() {
  const now = Date.now();
  if (cache && now < cache.expiresAt) {
    return NextResponse.json(cache.payload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
      },
    });
  }

  try {
    const airlines = seedAirlines.map((airline) => ({
      ...airline,
      statusLabel: "",
      notes: "",
      flightTrackerUrl: undefined,
      secondaryFlightTrackerUrl: undefined,
      rebookUrl: undefined,
      verificationStatus: undefined,
      verificationIssues: undefined,
      linksVerifiedAt: undefined,
    }));

    const payload: AirlinesApiResponse = {
      airlines,
      fetchedAt: new Date().toISOString(),
    };

    cache = {
      payload,
      expiresAt: now + CACHE_TTL_MS,
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Data currently unavailable.",
        detail: message,
      },
      { status: 503 }
    );
  }
}
