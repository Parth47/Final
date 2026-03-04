"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Phone, Search, ExternalLink, Siren, Building2, AlertTriangle, Globe } from "lucide-react";
import type { EmbassyContact, EmergencyNumber } from "@/lib/types";

interface EmergencyTabProps {
  emergencyNumbers: EmergencyNumber[];
  embassyContacts: EmbassyContact[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface CountryGroup {
  country: string;
  countryCode: string;
  contacts: EmbassyContact[];
}

interface ContactNumber {
  key: string;
  label: string;
  value: string;
}

function CountryFlag({ code, country }: { code: string; country: string }) {
  return (
    <img
      src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w160/${code.toLowerCase()}.png 2x`}
      alt={`${country} flag`}
      width={48}
      height={36}
      className="w-12 h-9 rounded object-cover flex-shrink-0 shadow-sm border border-gray-200 dark:border-gray-700"
    />
  );
}

function toTelHref(value: string): string {
  return `tel:${value.replace(/[^+\d]/g, "")}`;
}

function getContactNumbers(contact: EmbassyContact): ContactNumber[] {
  const lines: ContactNumber[] = [];
  const seen = new Set<string>();

  const push = (key: string, label: string, value: string | undefined) => {
    if (!value) {
      return;
    }

    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    lines.push({ key, label, value: normalized });
  };

  push("primary", "Direct", contact.phone);
  push("general", "General", contact.generalPhone);
  push("emergency", "Emergency", contact.emergencyPhone);

  return lines;
}

function EmergencySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4" aria-hidden>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 animate-pulse shadow-sm h-44">
          <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
          <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

function HotlineCard({ entry }: { entry: EmergencyNumber }) {
  return (
    <article className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow h-full flex items-start justify-between gap-3">
      <div>
        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{entry.name}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{entry.description}</p>
      </div>
      <a
        href={toTelHref(entry.number)}
        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors flex-shrink-0"
      >
        <Phone className="w-3.5 h-3.5" />
        {entry.number}
      </a>
    </article>
  );
}

function CountryCard({ group }: { group: CountryGroup }) {
  return (
    <article className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col gap-3">
      <header className="flex items-center gap-2.5">
        <CountryFlag code={group.countryCode} country={group.country} />
        <h3 className="font-bold text-gray-900 dark:text-white text-base">{group.country}</h3>
      </header>

      <div className="flex flex-col gap-3 mt-auto">
        {group.contacts.map((contact, idx) => {
          const numberLines = getContactNumbers(contact);

          return (
            <div key={`${contact.name}-${idx}`} className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{contact.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{contact.description}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {numberLines.length === 0 && <p className="text-xs text-gray-500 dark:text-gray-400">No number listed.</p>}
                {numberLines.map((line) => (
                  <a
                    key={`${contact.name}-${line.key}-${line.value}`}
                    href={toTelHref(line.value)}
                    className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    {line.value}
                  </a>
                ))}
                {contact.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    Official Site
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function groupByCountry(contacts: EmbassyContact[]): CountryGroup[] {
  const map = new Map<string, CountryGroup>();

  for (const contact of contacts) {
    const key = contact.country;
    const existing = map.get(key);

    if (existing) {
      existing.contacts.push(contact);
    } else {
      map.set(key, {
        country: contact.country,
        countryCode: contact.countryCode,
        contacts: [contact],
      });
    }
  }

  return Array.from(map.values());
}

export default function EmergencyTab({
  emergencyNumbers,
  embassyContacts,
  isLoading,
  error,
  onRetry,
}: EmergencyTabProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const countryGroups = useMemo(() => groupByCountry(embassyContacts), [embassyContacts]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) {
      return countryGroups;
    }

    const q = search.toLowerCase();
    return countryGroups.filter(
      (group) =>
        group.country.toLowerCase().includes(q) ||
        group.countryCode.toLowerCase().includes(q) ||
        group.contacts.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [search, countryGroups]);

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{t("emergency_title")}</h2>

      {/* Emergency banner */}
      <section className="bg-red-50 dark:bg-gray-900 border border-red-300 dark:border-red-700 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Siren className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Life-threatening emergency: call local emergency services immediately.</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Emergency hotlines are listed below.</p>
          </div>
        </div>
      </section>

      {/* Error state */}
      {error && emergencyNumbers.length === 0 && embassyContacts.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-900 border border-red-300 dark:border-red-700 rounded-2xl p-6 text-center shadow-sm">
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">Data currently unavailable.</p>
          <button onClick={onRetry} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      )}

      {isLoading && emergencyNumbers.length === 0 && embassyContacts.length === 0 ? (
        <EmergencySkeleton />
      ) : (
        <>
          {/* Section 1 — Embassies grouped by Country */}
          <section className="bg-white/60 dark:bg-gray-900/40 border border-blue-300 dark:border-blue-700 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start gap-2">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <h3 className="font-bold text-gray-900 dark:text-white">Embassy &amp; Consulate Contacts by Country</h3>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by country name"
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {filteredGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No embassy contacts found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 items-stretch">
                {filteredGroups.map((group) => (
                  <CountryCard key={group.countryCode} group={group} />
                ))}
              </div>
            )}
          </section>

          {/* Section 2 — UAE Emergency Hotlines */}
          <section className="bg-white/60 dark:bg-gray-900/40 border border-red-300 dark:border-red-700 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <h3 className="font-bold text-gray-900 dark:text-white">UAE Emergency Hotlines</h3>
            </div>

            {emergencyNumbers.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 dark:text-gray-400">No emergency line available.</div>
            ) : (
              <div className="grid grid-cols-3 gap-4 items-stretch">
                {emergencyNumbers.map((entry) => (
                  <HotlineCard key={`${entry.name}-${entry.number}`} entry={entry} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
