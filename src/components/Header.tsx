"use client";

import { useTranslation } from "react-i18next";
import { Moon, Sun, Globe, Shield, RefreshCw, Clock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface HeaderProps {
  lastUpdated?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function Header({
  lastUpdated = null,
  refreshing = false,
  onRefresh,
}: HeaderProps) {
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : prefersDark;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    const rtl = lang === "ar" || lang === "ur";
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    setLangOpen(false);
  };

  const languages = [
    { code: "en", label: "English" },
    { code: "ar", label: "Arabic" },
    { code: "hi", label: "Hindi" },
    { code: "ur", label: "Urdu" },
  ];

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) {
      return "Sync pending";
    }

    const value = new Date(lastUpdated);
    if (Number.isNaN(value.getTime())) {
      return "Sync pending";
    }

    return value.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dubai",
    });
  }, [lastUpdated]);

  return (
    <header className="bg-gray-900 dark:bg-black border-b border-gray-700 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-red-600 p-2 rounded-lg flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-extrabold text-base sm:text-lg leading-tight break-words">{t("app_title")}</h1>
            <p className="text-gray-400 text-xs hidden sm:block">{t("app_subtitle")}</p>
            <div className="flex items-center gap-2 mt-0.5 min-w-0">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-gray-400 text-[10px] sm:text-[11px] truncate">Last Updated: {formattedLastUpdated} UAE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 w-full sm:w-auto">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Refresh"
            disabled={!onRefresh}
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              aria-label={t("language")}
            >
              <Globe className="w-5 h-5" />
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 min-w-[120px]">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
                      i18n.language === lang.code ? "text-blue-400 font-semibold" : "text-gray-300"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleDark}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            aria-label={t("theme_toggle")}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
