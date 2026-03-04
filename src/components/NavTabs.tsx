"use client";

import { useTranslation } from "react-i18next";
import { Plane, ShieldAlert, BookOpen, LinkIcon } from "lucide-react";

interface NavTabsProps {
  active: string;
  onChange: (tab: string) => void;
}

const tabs = [
  { id: "emergency", icon: ShieldAlert, translationKey: "nav_emergency" },
  { id: "airlines", icon: Plane, translationKey: "nav_airlines" },
  { id: "guide", icon: BookOpen, translationKey: "nav_guide" },
  { id: "sources", icon: LinkIcon, translationKey: "nav_sources" },
];

export default function NavTabs({ active, onChange }: NavTabsProps) {
  const { t } = useTranslation();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-[60px] z-40 overflow-x-auto">
      <div className="max-w-5xl mx-auto flex min-w-max">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-3 px-2 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <span>{t(tab.translationKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
