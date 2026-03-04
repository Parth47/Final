import { NextResponse } from "next/server";
import { embassyContacts as seedEmbassyContacts, emergencyNumbers as seedEmergencyNumbers } from "@/lib/mock-data";
import type { EmergencyApiResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fetchedAt = new Date().toISOString();

    const payload: EmergencyApiResponse = {
      emergencyNumbers: seedEmergencyNumbers,
      embassyContacts: seedEmbassyContacts,
      manualReviewCount: 0,
      fetchedAt,
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
