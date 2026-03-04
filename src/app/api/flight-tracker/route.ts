import { NextRequest, NextResponse } from "next/server";
import { getServerConfig } from "@/lib/env";
import type { FlightTrackerApiResponse, FlightTrackerLivePoint } from "@/lib/types";

export const dynamic = "force-dynamic";

const REQUEST_TIMEOUT_MS = 10000;

interface FlightCandidate {
  airlineName: string | null;
  flightNumber: string | null;
  flightIcao: string | null;
  status: string;
  departureAirport: string | null;
  departureIata: string | null;
  arrivalAirport: string | null;
  arrivalIata: string | null;
  scheduledDeparture: string | null;
  estimatedDeparture: string | null;
  scheduledArrival: string | null;
  estimatedArrival: string | null;
  gate: string | null;
  delayMinutes: number | null;
  aircraftIcao: string | null;
  aircraftRegistration: string | null;
  live: FlightTrackerLivePoint | null;
  lastUpdated: string | null;
  lastUpdatedEpoch: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toNullableBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  return null;
}

function toNullableIsoString(value: unknown): string | null {
  const text = toNullableString(value);
  if (!text) {
    return null;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function parseLivePoint(live: unknown): FlightTrackerLivePoint | null {
  if (!isRecord(live)) {
    return null;
  }

  return {
    latitude: toNullableNumber(live.latitude),
    longitude: toNullableNumber(live.longitude),
    altitude: toNullableNumber(live.altitude),
    direction: toNullableNumber(live.direction),
    speedHorizontal: toNullableNumber(live.speed_horizontal),
    isGround: toNullableBoolean(live.is_ground),
    updatedAt: toNullableIsoString(live.updated),
  };
}

function parseFlightCandidate(entry: unknown): FlightCandidate | null {
  if (!isRecord(entry)) {
    return null;
  }

  const departure = isRecord(entry.departure) ? entry.departure : null;
  const arrival = isRecord(entry.arrival) ? entry.arrival : null;
  const airline = isRecord(entry.airline) ? entry.airline : null;
  const flight = isRecord(entry.flight) ? entry.flight : null;
  const aircraft = isRecord(entry.aircraft) ? entry.aircraft : null;

  const live = parseLivePoint(entry.live);
  const status = toNullableString(entry.flight_status)?.toLowerCase() ?? "unknown";

  const scheduledDeparture = departure ? toNullableIsoString(departure.scheduled) : null;
  const estimatedDeparture = departure ? toNullableIsoString(departure.estimated) : null;
  const scheduledArrival = arrival ? toNullableIsoString(arrival.scheduled) : null;
  const estimatedArrival = arrival ? toNullableIsoString(arrival.estimated) : null;
  const lastUpdated =
    live?.updatedAt ??
    estimatedDeparture ??
    scheduledDeparture ??
    estimatedArrival ??
    scheduledArrival;

  const lastUpdatedEpoch = lastUpdated ? new Date(lastUpdated).getTime() : 0;

  return {
    airlineName: airline ? toNullableString(airline.name) : null,
    flightNumber: flight ? toNullableString(flight.iata) : null,
    flightIcao: flight ? toNullableString(flight.icao) : null,
    status,
    departureAirport: departure ? toNullableString(departure.airport) : null,
    departureIata: departure ? toNullableString(departure.iata) : null,
    arrivalAirport: arrival ? toNullableString(arrival.airport) : null,
    arrivalIata: arrival ? toNullableString(arrival.iata) : null,
    scheduledDeparture,
    estimatedDeparture,
    scheduledArrival,
    estimatedArrival,
    gate: departure ? toNullableString(departure.gate) : null,
    delayMinutes: departure ? toNullableNumber(departure.delay) : null,
    aircraftIcao: aircraft ? toNullableString(aircraft.icao24) : null,
    aircraftRegistration: aircraft ? toNullableString(aircraft.registration) : null,
    live,
    lastUpdated,
    lastUpdatedEpoch,
  };
}

function parseAviationPayload(payload: unknown): FlightCandidate[] {
  if (!isRecord(payload)) {
    throw new Error("Invalid aviation payload shape.");
  }

  if (isRecord(payload.error)) {
    const providerMessage = toNullableString(payload.error.message);
    throw new Error(providerMessage ?? "Aviation provider error.");
  }

  if (!Array.isArray(payload.data)) {
    throw new Error("Missing aviation data array.");
  }

  const flights: FlightCandidate[] = [];
  for (const entry of payload.data) {
    const parsed = parseFlightCandidate(entry);
    if (parsed) {
      flights.push(parsed);
    }
  }

  return flights;
}

function statusPriority(status: string): number {
  switch (status) {
    case "active":
      return 0;
    case "delayed":
      return 1;
    case "scheduled":
      return 2;
    case "landed":
      return 3;
    case "cancelled":
      return 4;
    default:
      return 5;
  }
}

function selectBestCandidate(candidates: FlightCandidate[]): FlightCandidate | null {
  if (candidates.length === 0) {
    return null;
  }

  const sorted = [...candidates].sort((left, right) => {
    const leftLiveScore = left.live ? 1 : 0;
    const rightLiveScore = right.live ? 1 : 0;
    if (leftLiveScore !== rightLiveScore) {
      return rightLiveScore - leftLiveScore;
    }

    const statusDiff = statusPriority(left.status) - statusPriority(right.status);
    if (statusDiff !== 0) {
      return statusDiff;
    }

    return right.lastUpdatedEpoch - left.lastUpdatedEpoch;
  });

  return sorted[0];
}

function normalizeFlightQuery(rawValue: string | null): string | null {
  if (!rawValue) {
    return null;
  }

  const normalized = rawValue.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z0-9]{3,8}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

export async function GET(request: NextRequest) {
  const query = normalizeFlightQuery(request.nextUrl.searchParams.get("flight"));
  if (!query) {
    return NextResponse.json(
      {
        error: "Invalid flight number. Use 3 to 8 letters/numbers (example: EK202).",
      },
      { status: 400 }
    );
  }

  const fetchedAt = new Date().toISOString();

  try {
    const settings = getServerConfig();
    if (!settings.aviationstackApiKey) {
      throw new Error("Missing AVIATIONSTACK_API_KEY");
    }

    const url = new URL(`${settings.aviationstackBaseUrl}/flights`);
    url.searchParams.set("access_key", settings.aviationstackApiKey);
    url.searchParams.set("flight_iata", query);
    url.searchParams.set("limit", "20");

    const providerResponse = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!providerResponse.ok) {
      throw new Error(`Aviation provider returned HTTP ${providerResponse.status}`);
    }

    const providerPayload = (await providerResponse.json()) as unknown;
    const candidates = parseAviationPayload(providerPayload);
    const selected = selectBestCandidate(candidates);

    if (!selected) {
      return NextResponse.json(
        {
          error: "No live flight record found for this flight number.",
        },
        { status: 404 }
      );
    }

    const responsePayload: FlightTrackerApiResponse = {
      flight: {
        query,
        airlineName: selected.airlineName,
        flightNumber: selected.flightNumber,
        flightIcao: selected.flightIcao,
        status: selected.status,
        departureAirport: selected.departureAirport,
        departureIata: selected.departureIata,
        arrivalAirport: selected.arrivalAirport,
        arrivalIata: selected.arrivalIata,
        scheduledDeparture: selected.scheduledDeparture,
        estimatedDeparture: selected.estimatedDeparture,
        scheduledArrival: selected.scheduledArrival,
        estimatedArrival: selected.estimatedArrival,
        gate: selected.gate,
        delayMinutes: selected.delayMinutes,
        aircraftIcao: selected.aircraftIcao,
        aircraftRegistration: selected.aircraftRegistration,
        live: selected.live,
        sourceName: "AviationStack",
        sourceUrl: "https://aviationstack.com/documentation",
        lastUpdated: selected.lastUpdated ?? fetchedAt,
        verification: selected.live ? "live" : "provider_snapshot",
      },
      fetchedAt,
      provider: "aviationstack",
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30",
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
