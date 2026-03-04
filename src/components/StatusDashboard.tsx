"use client";

import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import type { AirportInfo } from "@/lib/types";

interface StatusDashboardProps {
  airports: AirportInfo[];
  airspace: AirportInfo | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function getStatusColor(status: string) {
  switch (status) {
    case "open":
      return {
        dot: "bg-green-500",
        badge: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
        border: "border-green-300 dark:border-green-700",
        bg: "bg-white dark:bg-gray-900",
      };
    case "limited":
      return {
        dot: "bg-amber-500",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200",
        border: "border-amber-300 dark:border-amber-700",
        bg: "bg-white dark:bg-gray-900",
      };
    case "partial":
      return {
        dot: "bg-yellow-500",
        badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-200",
        border: "border-yellow-300 dark:border-yellow-700",
        bg: "bg-white dark:bg-gray-900",
      };
    case "closed":
      return {
        dot: "bg-red-500",
        badge: "bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-200",
        border: "border-red-300 dark:border-red-700",
        bg: "bg-white dark:bg-gray-900",
      };
    default:
      return {
        dot: "bg-gray-400",
        badge: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
        border: "border-gray-300 dark:border-gray-700",
        bg: "bg-white dark:bg-gray-900",
      };
  }
}

function formatTimestamp(iso: string | undefined): string {
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

function AirportCard({ airport }: { airport: AirportInfo }) {
  const colors = getStatusColor(airport.status);

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${colors.dot} flex-shrink-0`} />
          <h3 className="font-bold text-gray-900 dark:text-white text-base">{airport.name}</h3>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${colors.badge} flex-shrink-0 tracking-wide`}>
          {airport.statusLabel}
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 pl-6">{airport.subtitle}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-6">{airport.description}</p>

      {airport.metrics && (
        <div className="mt-4 pl-6 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>
            Flights sampled: {airport.metrics.totalFlights} | Cancelled: {airport.metrics.cancelledFlights} | Active/Landed: {airport.metrics.activeFlights}
          </p>
          <p>Delayed over 30 min: {airport.metrics.delayedFlights}</p>
        </div>
      )}

      <div className="mt-4 pl-6 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs text-gray-500 dark:text-gray-400">Last Updated: {formatTimestamp(airport.lastUpdated)}</span>

        {airport.sourceUrl && (
          <a
            href={airport.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Source
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function StatusSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 animate-pulse"
        >
          <div className="h-4 w-44 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function StatusDashboard({ airports, airspace, isLoading, error, onRetry }: StatusDashboardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{t("status_title")}</h2>

      {error && airports.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-900 border border-red-300 dark:border-red-700 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">Data currently unavailable.</p>
          <button onClick={onRetry} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      )}

      {error && airports.length > 0 && (
        <div className="bg-amber-50 dark:bg-gray-900 border border-amber-300 dark:border-amber-700 rounded-xl p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-900 dark:text-amber-200">Data currently unavailable. Showing last successful aviation snapshot.</p>
          <button onClick={onRetry} className="px-3 py-2 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700">
            Retry
          </button>
        </div>
      )}

      {isLoading && airports.length === 0 ? (
        <StatusSkeleton />
      ) : (
        <>
          <div className="space-y-5">
            {airports.map((airport) => (
              <AirportCard key={airport.id} airport={airport} />
            ))}
          </div>

          {airspace && <AirportCard airport={airspace} />}
        </>
      )}
    </div>
  );
}