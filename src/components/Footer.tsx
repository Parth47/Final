"use client";

import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-100 dark:bg-black border-t border-gray-200 dark:border-gray-800 mt-12">
      <div className="max-w-4xl mx-auto px-4 py-6 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span>All information sourced from verified official channels only</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
          {t("footer_copyright")}
        </p>
      </div>
    </footer>
  );
}
