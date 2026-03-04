"use client";

import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import type { AirspaceStatus } from "@/lib/types";

interface StatusBannerProps {
  status: AirspaceStatus;
}

const statusConfig = {
  closed: {
    icon: AlertTriangle,
    bgClass: "bg-red-600 dark:bg-red-700",
    textClass: "text-white",
    pulseClass: "crisis-pulse",
    translationKey: "status_closed",
  },
  partial: {
    icon: AlertCircle,
    bgClass: "bg-amber-500 dark:bg-amber-600",
    textClass: "text-black dark:text-white",
    pulseClass: "",
    translationKey: "status_partial",
  },
  open: {
    icon: CheckCircle,
    bgClass: "bg-green-600 dark:bg-green-700",
    textClass: "text-white",
    pulseClass: "",
    translationKey: "status_open",
  },
};

export default function StatusBanner({ status }: StatusBannerProps) {
  const { t } = useTranslation();
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bgClass} ${config.textClass} ${config.pulseClass} py-3 px-4 flex items-center justify-center gap-3 font-bold text-sm tracking-wide`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span>
        {t("status_banner")}: {t(config.translationKey)}
      </span>
      <Icon className="w-5 h-5 flex-shrink-0" />
    </div>
  );
}
