"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Phone, ExternalLink, Globe, Radar, Clock3, Plane, Search } from "lucide-react";
import type { AirlineInfo } from "@/lib/types";

interface AirlinesTabProps {
  airlines: AirlineInfo[];
  fetchedAt: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function formatHubLabel(hub: string): string {
  const codeMatch = hub.match(/\b[A-Z]{3}\b/);
  if (codeMatch) {
    return codeMatch[0];
  }

  const withoutTerminal = hub.split(/terminal/i)[0] ?? hub;
  return withoutTerminal.replace(/[^\w\s]/g, " ").replace(/\s{2,}/g, " ").trim();
}

function formatTimestamp(iso: string | undefined | null): string {
  if (!iso) {
    return "Pending";
  }

  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return "Pending";
  }

  return (
    value.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Dubai",
    }) + " UAE"
  );
}

function extractDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function toTelHref(value: string): string {
  return `tel:${value.replace(/[^+\d]/g, "")}`;
}

function AirlineLogo({ airline }: { airline: AirlineInfo }) {
  const [failed, setFailed] = useState(false);
  const domain = extractDomain(airline.websiteUrl);

  if (!domain || failed) {
    return (
      <span className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
        <Plane className="w-5 h-5" />
      </span>
    );
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt={`${airline.name} logo`}
      width={40}
      height={40}
      className="w-10 h-10 rounded-lg flex-shrink-0 object-contain bg-white p-0.5 border border-gray-200 dark:border-gray-700"
      onError={() => setFailed(true)}
    />
  );
}

function AirlinesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" aria-hidden>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 animate-pulse shadow-sm h-52"
        >
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
          <div className="h-9 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
          <div className="h-9 w-44 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

function AirlineCard({ airline }: { airline: AirlineInfo }) {
  return (
    <article className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AirlineLogo airline={airline} />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">{airline.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Hub: {formatHubLabel(airline.hub)}</p>
          </div>
        </div>
      </header>

      <div className="space-y-3 mt-auto">
        <a
          href={toTelHref(airline.phone)}
          className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors break-all"
        >
          <Phone className="w-4 h-4" />
          {airline.phone}
        </a>

        {airline.whatsapp && (
          <a
            href={toTelHref(airline.whatsapp)}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors break-all"
          >
            <Phone className="w-4 h-4" />
            {airline.whatsapp}
          </a>
        )}

        {airline.websiteUrl ? (
          <a
            href={airline.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Globe className="w-4 h-4 text-green-500" />
            Official Website
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </a>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Official website link unavailable.</p>
        )}
      </div>
    </article>
  );
}

export default function AirlinesTab({ airlines, fetchedAt, isLoading, error, onRetry }: AirlinesTabProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filteredAirlines = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return airlines;
    }

    return airlines.filter((airline) =>
      [airline.name, airline.hub, airline.phone, airline.whatsapp ?? "", airline.websiteUrl ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [airlines, search]);

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{t("airlines_title")}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Official airline website and customer support contact details.</p>
          </div>

          <a
            href="https://www.flightaware.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            <Radar className="w-4 h-4" />
            Track your flight status
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock3 className="w-3.5 h-3.5" />
          Dataset updated: {formatTimestamp(fetchedAt)}
        </div>

        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by airline name, hub, or contact"
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </section>

      {error && airlines.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-900 border border-red-300 dark:border-red-700 rounded-2xl p-6 text-center shadow-sm">
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">Data currently unavailable.</p>
          <button onClick={onRetry} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      )}

      {error && airlines.length > 0 && (
        <div className="bg-amber-50 dark:bg-gray-900 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <p className="text-sm text-amber-900 dark:text-amber-200">Data currently unavailable. Showing last successful airline snapshot.</p>
          <button onClick={onRetry} className="px-3 py-2 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700">
            Retry
          </button>
        </div>
      )}

      <section className="bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        {isLoading && airlines.length === 0 ? (
          <AirlinesSkeleton />
        ) : filteredAirlines.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {search.trim() ? "No airlines found for this search." : "No airline data available."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
            {filteredAirlines.map((airline) => (
              <AirlineCard key={airline.id} airline={airline} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
