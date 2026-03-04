import { NextResponse } from "next/server";
import { getServerConfig } from "@/lib/env";
import type { AirspaceStatus, AirportInfo, AirportStatus, AviationApiResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

interface AirportConfig {
  id: "dxb" | "auh";
  code: "DXB" | "AUH";
  name: string;
  subtitle: string;
  sourceUrl: string;
}

interface ParsedFlight {
  key: string;
  status: string;
  departureDelay: number;
  arrivalDelay: number;
}

interface AirportComputation {
  status: AirportStatus;
  statusLabel: string;
  description: string;
  metrics: {
    totalFlights: number;
    cancelledFlights: number;
    activeFlights: number;
    delayedFlights: number;
  };
}

const AIRPORTS: AirportConfig[] = [
  {
    id: "dxb",
    code: "DXB",
    name: "Dubai International Airport",
    subtitle: "Terminals 1, 2 and 3",
    sourceUrl: "https://www.dubaiairports.ae/flight-status",
  },
  {
    id: "auh",
    code: "AUH",
    name: "Zayed International Airport",
    subtitle: "Abu Dhabi",
    sourceUrl: "https://www.zayedinternationalairport.ae/en/flight-information",
  },
];

const STATUS_BUCKETS = ["active", "landed", "scheduled", "cancelled"] as const;
type StatusBucket = (typeof STATUS_BUCKETS)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function parseAviationPayload(payload: unknown): ParsedFlight[] {
  if (!isRecord(payload)) {
    throw new Error("Invalid aviation payload shape");
  }

  if (isRecord(payload.error)) {
    const message = typeof payload.error.message === "string" ? payload.error.message : "Aviation provider error";
    throw new Error(message);
  }

  if (!Array.isArray(payload.data)) {
    throw new Error("Missing aviation data array");
  }

  const flights: ParsedFlight[] = [];

  for (const item of payload.data) {
    if (!isRecord(item)) {
      continue;
    }

    const flight = isRecord(item.flight) ? item.flight : null;
    const departure = isRecord(item.departure) ? item.departure : null;
    const arrival = isRecord(item.arrival) ? item.arrival : null;

    const status = typeof item.flight_status === "string" ? item.flight_status.toLowerCase() : "scheduled";
    const departureDelay = departure ? toNumber(departure.delay) : 0;
    const arrivalDelay = arrival ? toNumber(arrival.delay) : 0;
    const flightIata = flight && typeof flight.iata === "string" ? flight.iata : "unknown";
    const departureScheduled = departure && typeof departure.scheduled === "string" ? departure.scheduled : "";
    const arrivalScheduled = arrival && typeof arrival.scheduled === "string" ? arrival.scheduled : "";
    const key = `${flightIata}|${departureScheduled}|${arrivalScheduled}|${status}`;

    flights.push({
      key,
      status,
      departureDelay,
      arrivalDelay,
    });
  }

  return flights;
}

function statusLabel(status: AirportStatus): string {
  switch (status) {
    case "open":
      return "OPEN";
    case "limited":
      return "LIMITED OPS";
    case "partial":
      return "PARTIAL";
    case "closed":
      return "CLOSED";
    default:
      return "UNKNOWN";
  }
}

function computeAirportStatus(flights: ParsedFlight[]): AirportComputation {
  const totalFlights = flights.length;
  const cancelledFlights = flights.filter((flight) => flight.status === "cancelled").length;
  const activeFlights = flights.filter((flight) => flight.status === "active" || flight.status === "landed").length;
  const delayedFlights = flights.filter((flight) => flight.departureDelay > 30 || flight.arrivalDelay > 30).length;

  if (totalFlights === 0) {
    return {
      status: "partial",
      statusLabel: statusLabel("partial"),
      description: "Live flight feed returned no records. Verify directly with airport and airline channels.",
      metrics: {
        totalFlights,
        cancelledFlights,
        activeFlights,
        delayedFlights,
      },
    };
  }

  const cancelledRate = cancelledFlights / totalFlights;
  const delayedRate = delayedFlights / totalFlights;

  let status: AirportStatus = "open";
  if (cancelledRate >= 0.55) {
    status = "closed";
  } else if (cancelledRate >= 0.25 || delayedRate >= 0.4) {
    status = "limited";
  } else if (cancelledRate >= 0.1 || delayedRate >= 0.2) {
    status = "partial";
  }

  const description =
    `${totalFlights} flights sampled. ` +
    `${cancelledFlights} cancelled, ${activeFlights} active or landed, ${delayedFlights} delayed > 30 min.`;

  return {
    status,
    statusLabel: statusLabel(status),
    description,
    metrics: {
      totalFlights,
      cancelledFlights,
      activeFlights,
      delayedFlights,
    },
  };
}

function isAirportStatus(value: unknown): value is AirportStatus {
  return value === "open" || value === "limited" || value === "partial" || value === "closed";
}

function isAirspaceStatus(value: unknown): value is AirspaceStatus {
  return value === "open" || value === "partial" || value === "closed";
}

interface AdminOverridePayload {
  dxb?: AirportStatus;
  auh?: AirportStatus;
  airspace?: AirspaceStatus;
  sourceUrl?: string;
}

function parseAdminOverride(rawValue: string | undefined): AdminOverridePayload | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }

    const dxb = isAirportStatus(parsed.dxb) ? parsed.dxb : undefined;
    const auh = isAirportStatus(parsed.auh) ? parsed.auh : undefined;
    const airspace = isAirspaceStatus(parsed.airspace) ? parsed.airspace : undefined;
    const sourceUrl = typeof parsed.sourceUrl === "string" ? parsed.sourceUrl : undefined;

    if (!dxb && !auh && !airspace) {
      return null;
    }

    return {
      dxb,
      auh,
      airspace,
      sourceUrl,
    };
  } catch {
    return null;
  }
}

function fallbackAirport(config: AirportConfig, fetchedAt: string): AirportInfo {
  return {
    id: config.id,
    name: config.name,
    code: config.code,
    subtitle: config.subtitle,
    status: "partial",
    statusLabel: "CHECK SOURCE",
    description: "Live flight status feed is currently unavailable. Verify with official airport source links before airport travel.",
    lastUpdated: fetchedAt,
    sourceName: "Airport operator",
    sourceUrl: config.sourceUrl,
  };
}

function deriveAirspaceStatus(airports: AirportInfo[]): AirspaceStatus {
  const statuses = airports.map((airport) => airport.status);

  if (statuses.every((status) => status === "closed")) {
    return "closed";
  }

  if (statuses.some((status) => status === "limited" || status === "partial" || status === "closed")) {
    return "partial";
  }

  return "open";
}

function buildAirspaceCard(airspaceStatus: AirspaceStatus, fetchedAt: string): AirportInfo {
  const statusLabelMap: Record<AirspaceStatus, string> = {
    open: "OPEN",
    partial: "RESTRICTED",
    closed: "CLOSED",
  };

  const descriptionMap: Record<AirspaceStatus, string> = {
    open: "DXB and AUH are reporting normal operational signals from sampled departures.",
    partial: "Operational constraints are detected. Check airline confirmation before airport travel.",
    closed: "Severe disruption detected across sampled operations. Verify through official authorities before travel.",
  };

  return {
    id: "airspace",
    name: "UAE Airspace",
    code: "UAE",
    subtitle: "General Civil Aviation Authority",
    status: airspaceStatus === "open" ? "open" : airspaceStatus === "closed" ? "closed" : "partial",
    statusLabel: statusLabelMap[airspaceStatus],
    description: descriptionMap[airspaceStatus],
    lastUpdated: fetchedAt,
    sourceName: "GCAA",
    sourceUrl: "https://www.gcaa.gov.ae",
  };
}

async function fetchAirportFlightsByStatus(config: AirportConfig, statusBucket: StatusBucket): Promise<ParsedFlight[]> {
  const settings = getServerConfig();
  if (!settings.aviationstackApiKey) {
    throw new Error("Missing AVIATIONSTACK_API_KEY");
  }

  const url = new URL(`${settings.aviationstackBaseUrl}/flights`);
  url.searchParams.set("access_key", settings.aviationstackApiKey);
  url.searchParams.set("dep_iata", config.code);
  url.searchParams.set("flight_status", statusBucket);
  url.searchParams.set("limit", "100");

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Aviation provider returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return parseAviationPayload(payload);
}

async function fetchAirportFlights(config: AirportConfig): Promise<ParsedFlight[]> {
  const resultSet = await Promise.allSettled(
    STATUS_BUCKETS.map((statusBucket) => fetchAirportFlightsByStatus(config, statusBucket))
  );

  const fulfilled = resultSet
    .filter((result): result is PromiseFulfilledResult<ParsedFlight[]> => result.status === "fulfilled")
    .flatMap((result) => result.value);

  if (fulfilled.length === 0) {
    const firstError = resultSet.find((result): result is PromiseRejectedResult => result.status === "rejected");
    if (firstError) {
      throw firstError.reason;
    }
    throw new Error("No aviation status buckets are available");
  }

  // Flight status requests run independently and can overlap near status transitions.
  // Keep one record per key to avoid inflating sampled totals.
  const deduped = new Map<string, ParsedFlight>();
  for (const flight of fulfilled) {
    if (!deduped.has(flight.key)) {
      deduped.set(flight.key, flight);
    }
  }

  return Array.from(deduped.values());
}

export async function GET() {
  const fetchedAt = new Date().toISOString();

  try {
    const settings = getServerConfig();
    const resultSet = await Promise.allSettled(AIRPORTS.map((airport) => fetchAirportFlights(airport)));

    const airports: AirportInfo[] = resultSet.map((result, index) => {
      const airportConfig = AIRPORTS[index];

      if (result.status === "fulfilled") {
        const computed = computeAirportStatus(result.value);
        return {
          id: airportConfig.id,
          name: airportConfig.name,
          code: airportConfig.code,
          subtitle: airportConfig.subtitle,
          status: computed.status,
          statusLabel: computed.statusLabel,
          description: computed.description,
          metrics: computed.metrics,
          lastUpdated: fetchedAt,
          sourceName: "AviationStack and airport operator",
          sourceUrl: airportConfig.sourceUrl,
        };
      }

      return fallbackAirport(airportConfig, fetchedAt);
    });

    const hasLiveData = resultSet.some((result) => result.status === "fulfilled");
    if (!hasLiveData) {
      throw new Error("No live airport feeds are available");
    }

    const adminOverride = parseAdminOverride(settings.adminAviationOverrideJson);

    let finalAirports = airports;
    let airspaceStatus = deriveAirspaceStatus(airports);

    if (adminOverride) {
      finalAirports = airports.map((airport) => {
        const forcedStatus = airport.id === "dxb" ? adminOverride.dxb : airport.id === "auh" ? adminOverride.auh : undefined;
        if (!forcedStatus) {
          return airport;
        }

        return {
          ...airport,
          status: forcedStatus,
          statusLabel: statusLabel(forcedStatus),
          description:
            "Operational status is set from an administrator-issued server directive. Verify through airport and airline channels before travel.",
          sourceName: "Administrator directive",
          sourceUrl: adminOverride.sourceUrl ?? airport.sourceUrl,
        };
      });

      airspaceStatus = adminOverride.airspace ?? deriveAirspaceStatus(finalAirports);
    }

    const responsePayload: AviationApiResponse = {
      airports: finalAirports,
      airspaceStatus,
      airspace: buildAirspaceCard(airspaceStatus, fetchedAt),
      fetchedAt,
      provider: "aviationstack",
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
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
