"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PromptMode = "native" | "manual-ios" | "manual-generic";

const DISMISS_STORAGE_KEY = "install_prompt_dismissed_at";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const inDisplayMode = window.matchMedia("(display-mode: standalone)").matches;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return inDisplayMode || navigatorWithStandalone.standalone === true;
}

function isLikelyMobile(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function wasDismissedRecently(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const rawValue = window.localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!rawValue) {
      return false;
    }

    const dismissedAt = Number.parseInt(rawValue, 10);
    if (Number.isNaN(dismissedAt)) {
      return false;
    }

    return Date.now() - dismissedAt < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function markDismissedNow(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
  } catch {
    // Ignore storage errors (private mode or blocked storage).
  }
}

export default function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [promptMode, setPromptMode] = useState<PromptMode>("native");
  const [showPrompt, setShowPrompt] = useState(false);
  const hasNativePromptRef = useRef(false);

  useEffect(() => {
    if (isStandaloneMode() || wasDismissedRecently() || !isLikelyMobile()) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      hasNativePromptRef.current = true;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPromptMode("native");
      setShowPrompt(true);
    };

    const appInstalledHandler = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      markDismissedNow();
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", appInstalledHandler);

    const fallbackTimer = window.setTimeout(() => {
      if (isStandaloneMode() || hasNativePromptRef.current) {
        return;
      }

      setPromptMode(isIosDevice() ? "manual-ios" : "manual-generic");
      setShowPrompt(true);
    }, 4500);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "dismissed") {
      markDismissedNow();
    }

    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowPrompt(false);
    markDismissedNow();
  };

  const message =
    promptMode === "native"
      ? t("install_prompt")
      : promptMode === "manual-ios"
        ? "To install on iPhone/iPad, tap Share and choose Add to Home Screen."
        : "To install, open your browser menu and choose Install App or Add to Home Screen.";

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-gray-900 dark:bg-gray-800 border border-red-600 rounded-xl p-4 shadow-2xl z-50">
      <div className="flex items-start gap-3">
        <Download className="w-7 h-7 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-white p-1 flex-shrink-0"
          aria-label={t("dismiss")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {promptMode === "native" && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {t("install_button")}
          </button>
        )}
      </div>
    </div>
  );
}
