"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-gray-900 dark:bg-gray-800 border border-red-600 rounded-xl p-4 shadow-2xl z-50 flex items-center gap-3">
      <Download className="w-8 h-8 text-red-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-white text-sm font-medium">{t("install_prompt")}</p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex-shrink-0"
      >
        {t("install_button")}
      </button>
      <button
        onClick={() => setShowPrompt(false)}
        className="text-gray-400 hover:text-white p-1 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
