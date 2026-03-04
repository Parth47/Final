"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "@/lib/i18n";
import Header from "@/components/Header";
import NavTabs from "@/components/NavTabs";
import AirlinesTab from "@/components/AirlinesTab";
import EmergencyTab from "@/components/EmergencyTab";
import StrandedGuide from "@/components/StrandedGuide";
import SourcesTab from "@/components/SourcesTab";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { verifiedSources } from "@/lib/mock-data";
import type { AirlinesApiResponse, EmergencyApiResponse } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  const raw = await response.text();
  const payload = raw ? (JSON.parse(raw) as unknown) : null;

  if (!response.ok) {
    if (isRecord(payload) && typeof payload.error === "string") {
      throw new Error(payload.error);
    }

    throw new Error("Data currently unavailable.");
  }

  return payload as T;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("emergency");

  const [airlinesData, setAirlinesData] = useState<AirlinesApiResponse | null>(null);
  const [airlinesLoading, setAirlinesLoading] = useState(true);
  const [airlinesRefreshing, setAirlinesRefreshing] = useState(false);
  const [airlinesError, setAirlinesError] = useState<string | null>(null);

  const [emergencyData, setEmergencyData] = useState<EmergencyApiResponse | null>(null);
  const [emergencyLoading, setEmergencyLoading] = useState(true);
  const [emergencyRefreshing, setEmergencyRefreshing] = useState(false);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);

  const loadAirlines = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) {
      setAirlinesRefreshing(true);
    } else {
      setAirlinesLoading(true);
    }

    setAirlinesError(null);

    try {
      const payload = await fetchJson<AirlinesApiResponse>("/api/airlines");
      setAirlinesData(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Data currently unavailable.";
      setAirlinesError(message);
    } finally {
      if (isRefresh) {
        setAirlinesRefreshing(false);
      } else {
        setAirlinesLoading(false);
      }
    }
  }, []);

  const loadEmergency = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) {
      setEmergencyRefreshing(true);
    } else {
      setEmergencyLoading(true);
    }

    setEmergencyError(null);

    try {
      const payload = await fetchJson<EmergencyApiResponse>("/api/emergency");
      setEmergencyData(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Data currently unavailable.";
      setEmergencyError(message);
    } finally {
      if (isRefresh) {
        setEmergencyRefreshing(false);
      } else {
        setEmergencyLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadAirlines(false), loadEmergency(false)]);
  }, [loadAirlines, loadEmergency]);

  const handleAppRefresh = useCallback(() => {
    void Promise.all([loadAirlines(true), loadEmergency(true)]);
  }, [loadAirlines, loadEmergency]);

  const latestUpdate = useMemo(() => {
    const candidates = [airlinesData?.fetchedAt, emergencyData?.fetchedAt]
      .filter((value): value is string => typeof value === "string")
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value));

    if (candidates.length === 0) {
      return null;
    }

    return new Date(Math.max(...candidates)).toISOString();
  }, [airlinesData?.fetchedAt, emergencyData?.fetchedAt]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header
        lastUpdated={latestUpdate}
        refreshing={airlinesRefreshing || emergencyRefreshing}
        onRefresh={handleAppRefresh}
      />
      <NavTabs active={activeTab} onChange={setActiveTab} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {activeTab === "emergency" && (
          <EmergencyTab
            emergencyNumbers={emergencyData?.emergencyNumbers ?? []}
            embassyContacts={emergencyData?.embassyContacts ?? []}
            isLoading={emergencyLoading}
            error={emergencyError}
            onRetry={() => void loadEmergency(false)}
          />
        )}
        {activeTab === "airlines" && (
          <AirlinesTab
            airlines={airlinesData?.airlines ?? []}
            fetchedAt={airlinesData?.fetchedAt ?? null}
            isLoading={airlinesLoading}
            error={airlinesError}
            onRetry={() => void loadAirlines(false)}
          />
        )}
        {activeTab === "guide" && <StrandedGuide />}
        {activeTab === "sources" && <SourcesTab sources={verifiedSources} />}
      </main>

      <Footer />
      <InstallPrompt />
      <ServiceWorkerRegistrar />
    </div>
  );
}
