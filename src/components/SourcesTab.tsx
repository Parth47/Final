"use client";

import { useTranslation } from "react-i18next";
import {
  ExternalLink,
  ShieldCheck,
  Globe,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Send,
} from "lucide-react";
import type { SourceChannel, SourcePlatform, VerifiedSource } from "@/lib/types";

interface SourcesTabProps {
  sources: VerifiedSource[];
}

function getTypeColor(type: string) {
  switch (type) {
    case "Government Authority":
      return "bg-red-600 text-white";
    case "Government Media":
      return "bg-purple-600 text-white";
    case "Airport Operator":
      return "bg-blue-600 text-white";
    case "Verified News":
      return "bg-emerald-600 text-white";
    case "Flight Tracking":
      return "bg-amber-600 text-white";
    default:
      return "bg-gray-600 text-white";
  }
}

function channelForPlatform(platform: SourcePlatform): {
  icon: typeof Globe;
  chipClass: string;
} {
  switch (platform) {
    case "x":
      return { icon: Twitter, chipClass: "bg-black text-white dark:bg-white dark:text-black" };
    case "instagram":
      return { icon: Instagram, chipClass: "bg-pink-600 text-white" };
    case "facebook":
      return { icon: Facebook, chipClass: "bg-blue-700 text-white" };
    case "youtube":
      return { icon: Youtube, chipClass: "bg-red-600 text-white" };
    case "linkedin":
      return { icon: Linkedin, chipClass: "bg-sky-700 text-white" };
    case "telegram":
      return { icon: Send, chipClass: "bg-cyan-600 text-white" };
    case "website":
    default:
      return { icon: Globe, chipClass: "bg-gray-700 text-white" };
  }
}

function normalizeChannels(source: VerifiedSource): SourceChannel[] {
  if (Array.isArray(source.channels) && source.channels.length > 0) {
    return source.channels;
  }

  return [{ platform: "website", label: "Official Website", url: source.url }];
}

export default function SourcesTab({ sources }: SourcesTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{t("sources_title")}</h2>

      <section className="bg-white dark:bg-gray-900 border border-green-300 dark:border-green-700 rounded-2xl p-5 shadow-sm flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
            Official channels listed below are verified from each source&apos;s own website.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use these links for direct updates from reliable organizations.</p>
        </div>
      </section>

      <section className="bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-4 items-stretch">
          {sources.map((source) => {
            const channels = normalizeChannels(source);

            return (
              <article
                key={source.name}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md transition-shadow h-full flex flex-col"
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{source.name}</h3>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${getTypeColor(source.type)}`}>{source.type}</span>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex-shrink-0"
                    aria-label={`${source.name} source link`}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </header>

                <p className="text-sm text-gray-600 dark:text-gray-300">{source.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {channels.map((channel) => {
                    const meta = channelForPlatform(channel.platform);
                    const Icon = meta.icon;

                    return (
                      <a
                        key={`${source.name}-${channel.platform}-${channel.url}`}
                        href={channel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${meta.chipClass}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {channel.label}
                      </a>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
