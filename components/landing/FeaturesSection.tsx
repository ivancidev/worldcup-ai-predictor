"use client";

import { Bot, BarChart2, Trophy, Share2, Zap, Smartphone } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export default function FeaturesSection() {
  const { t } = useTranslation();

  const FEATURES = [
    {
      icon: Bot,
      title: t("features.aiTitle"),
      description: t("features.aiDesc"),
      accent: "#f5c518",
    },
    {
      icon: BarChart2,
      title: t("features.dataTitle"),
      description: t("features.dataDesc"),
      accent: "#3b82f6",
    },
    {
      icon: Trophy,
      title: t("features.bracketTitle"),
      description: t("features.bracketDesc"),
      accent: "#22c55e",
    },
    {
      icon: Share2,
      title: t("features.shareTitle"),
      description: t("features.shareDesc"),
      accent: "#a855f7",
    },
    {
      icon: Zap,
      title: t("features.fastTitle"),
      description: t("features.fastDesc"),
      accent: "#f59e0b",
    },
    {
      icon: Smartphone,
      title: t("features.mobileTitle"),
      description: t("features.mobileDesc"),
      accent: "#ec4899",
    },
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e2640] text-[#8899bb] text-sm mb-4">
            {t("features.titleBadge")}
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-[#e8eaf0] mb-4">
            {t("features.mainTitle")}
          </h2>
          <p className="text-[#8899bb] text-lg max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="animate-fade-in-up group relative p-6 rounded-2xl bg-[#0e1220] border border-[#1e2640] hover:border-[#2d3a5a] transition-all duration-300 overflow-hidden"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 0% 0%, ${feature.accent}10, transparent 60%)` }}
                />
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative"
                  style={{ background: `${feature.accent}15`, border: `1px solid ${feature.accent}30` }}
                >
                  <Icon className="w-5 h-5 relative" style={{ color: feature.accent }} />
                </div>
                <h3 className="text-lg font-bold text-[#e8eaf0] mb-2 relative">{feature.title}</h3>
                <p className="text-[#8899bb] text-sm leading-relaxed relative">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
