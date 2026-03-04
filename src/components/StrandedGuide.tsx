"use client";

import { useTranslation } from "react-i18next";
import { MapPin, CreditCard, Wifi, ShieldCheck, Hotel, FileText, HeartPulse, Phone } from "lucide-react";

const guideItems = [
  {
    icon: ShieldCheck,
    title: "Visa Extensions - Automatic",
    content:
      "The UAE government has confirmed automatic visa extensions for all stranded travelers. No action is required. This covers tourist, visit, and transit visas.",
    color: "text-green-600 dark:text-green-400",
    borderColor: "border-green-300 dark:border-green-700",
  },
  {
    icon: Hotel,
    title: "Hotel Accommodation",
    content:
      "If you are stranded at the airport, airlines may provide hotel accommodation. Ask at your airline service desk. You can also call the UAE helpline at 800-4357.",
    color: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
  {
    icon: MapPin,
    title: "Do Not Go to Airport Unless Contacted",
    content:
      "Travel to airport only when your airline confirms departure time and seat. Airport operations can change quickly and crowding can delay assistance.",
    color: "text-red-600 dark:text-red-400",
    borderColor: "border-red-300 dark:border-red-700",
  },
  {
    icon: CreditCard,
    title: "Cash and Banking",
    content:
      "ATMs are generally available. Keep a backup payment option. If you face urgent financial hardship, contact your embassy or consulate.",
    color: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-300 dark:border-purple-700",
  },
  {
    icon: Wifi,
    title: "Stay Connected",
    content:
      "Use stable internet access to monitor airline, airport, and embassy channels. Keep your phone charged and carry a power bank when possible.",
    color: "text-cyan-600 dark:text-cyan-400",
    borderColor: "border-cyan-300 dark:border-cyan-700",
  },
  {
    icon: HeartPulse,
    title: "Medical Assistance",
    content:
      "For emergencies call local emergency services immediately. For non-emergency care, use licensed clinics or pharmacies and keep prescriptions available.",
    color: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-300 dark:border-rose-700",
  },
  {
    icon: FileText,
    title: "Insurance Documentation",
    content:
      "Keep boarding passes, receipts, and airline notices. These are typically required when filing delay or cancellation claims with insurers.",
    color: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-300 dark:border-amber-700",
  },
  {
    icon: Phone,
    title: "Key Helplines",
    content:
      "Use official emergency and embassy contact numbers listed in the Emergency tab. Save key contacts locally in case connectivity is unstable.",
    color: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-300 dark:border-indigo-700",
  },
];

export default function StrandedGuide() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{t("guide_title")}</h2>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <p className="text-sm text-gray-600 dark:text-gray-300">Practical information for travelers currently stranded in the UAE.</p>
      </section>

      <section className="bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-4 items-stretch">
          {guideItems.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className={`bg-white dark:bg-gray-900 border ${item.borderColor} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow h-full`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">{item.title}</h3>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item.content}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
