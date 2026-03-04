// Airport and airspace
export type AirportStatus = "open" | "limited" | "partial" | "closed";

export interface AirportMetrics {
  totalFlights: number;
  cancelledFlights: number;
  activeFlights: number;
  delayedFlights: number;
}

export interface AirportInfo {
  id: string;
  name: string;
  code: string;
  subtitle: string;
  status: AirportStatus;
  statusLabel: string;
  description: string;
  lastUpdated?: string;
  sourceName?: string;
  sourceUrl?: string;
  metrics?: AirportMetrics;
}

export type AirspaceStatus = "closed" | "partial" | "open";

// News feed
export type NewsTag = "latest" | "airlines" | "government" | "airports" | "advisory";

export interface NewsItem {
  id: string;
  tag: NewsTag;
  source: string;
  title: string;
  body: string;
  sourceUrl: string;
  timestamp: string;
  verified: boolean;
  lastUpdated?: string;
}

// Airlines
export type AirlineStatus = "operating" | "limited" | "suspended";
export type VerificationStatus = "verified" | "partial" | "manual_review";

export interface AirlineInfo {
  id: string;
  name: string;
  hub: string;
  status: AirlineStatus;
  statusLabel: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  rebookUrl?: string;
  flightTrackerUrl?: string;
  secondaryFlightTrackerUrl?: string;
  websiteUrl?: string;
  notes: string;
  linksVerifiedAt?: string;
  verificationStatus?: VerificationStatus;
  verificationIssues?: string[];
}

// Emergency
export interface EmergencyNumber {
  name: string;
  number: string;
  description: string;
  isEmergencyHotline?: boolean;
  verifiedAt?: string;
  verificationSources?: string[];
}

export interface EmbassyContact {
  country: string;
  countryCode: string;
  name: string;
  phone?: string;
  emergencyPhone?: string;
  generalPhone?: string;
  phoneType?: "emergency" | "general";
  description: string;
  website?: string;
  verifiedAt?: string;
  verificationSources?: string[];
  verificationStatus?: VerificationStatus;
}

// Sources
export type SourcePlatform =
  | "website"
  | "x"
  | "instagram"
  | "facebook"
  | "youtube"
  | "linkedin"
  | "telegram";

export interface SourceChannel {
  platform: SourcePlatform;
  label: string;
  url: string;
}

export interface VerifiedSource {
  name: string;
  type: string;
  url: string;
  description: string;
  channels?: SourceChannel[];
}

// Server API payloads
export interface NewsApiResponse {
  items: NewsItem[];
  fetchedAt: string;
  provider: "gnews" | "serpapi";
}

export interface AviationApiResponse {
  airports: AirportInfo[];
  airspaceStatus: AirspaceStatus;
  airspace: AirportInfo;
  fetchedAt: string;
  provider: "aviationstack";
}

export interface AirlinesApiResponse {
  airlines: AirlineInfo[];
  fetchedAt: string;
}

export interface FlightTrackerLivePoint {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  direction: number | null;
  speedHorizontal: number | null;
  isGround: boolean | null;
  updatedAt: string | null;
}

export interface FlightTrackerRecord {
  query: string;
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
  sourceName: string;
  sourceUrl: string;
  lastUpdated: string;
  verification: "live" | "provider_snapshot";
}

export interface FlightTrackerApiResponse {
  flight: FlightTrackerRecord;
  fetchedAt: string;
  provider: "aviationstack";
}

export interface EmergencyApiResponse {
  emergencyNumbers: EmergencyNumber[];
  embassyContacts: EmbassyContact[];
  manualReviewCount: number;
  fetchedAt: string;
}
