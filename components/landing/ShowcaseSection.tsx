"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bot, Check } from "lucide-react";
import { FlagImage } from "@/components/ui/FlagImage";
import { useTranslation, getTranslatedTeamName } from "@/lib/i18n/context";

gsap.registerPlugin(ScrollTrigger);

const PREVIEW_MATCHES = [
  {
    home: { name: "Brazil", flag: "br" },
    away: { name: "Argentina", flag: "ar" },
    prediction: { scoreA: 2, scoreB: 1, confidence: 72, winner: "Brazil" },
  },
  {
    home: { name: "France", flag: "fr" },
    away: { name: "Spain", flag: "es" },
    prediction: { scoreA: 1, scoreB: 1, confidence: 55, winner: "Draw" },
  },
  {
    home: { name: "Germany", flag: "de" },
    away: { name: "England", flag: "gb-eng" },
    prediction: { scoreA: 3, scoreB: 2, confidence: 61, winner: "Germany" },
  },
];

const AI_FEATURES = [
  "showcase.feature1",
  "showcase.feature2",
  "showcase.feature3",
  "showcase.feature4",
] as const;

export default function ShowcaseSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { t, locale } = useTranslation();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".showcase-text", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-4 bg-[#0e1220]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text side */}
          <div className="showcase-text flex-1 w-full text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5c51815] border border-[#f5c51830] text-[#f5c518] text-sm mb-6">
              <Bot className="w-3.5 h-3.5" />
              {t("showcase.titleBadge")}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-[#e8eaf0] mb-6 leading-tight">
              {t("showcase.mainTitle")}
              <br />
              <span className="gradient-text">{t("showcase.gradientTitle")}</span>
            </h2>
            <p className="text-[#8899bb] text-lg leading-relaxed mb-8">
              {t("showcase.subtitle")}
            </p>
            <ul className="space-y-3 text-left">
              {AI_FEATURES.map((item) => (
                <li key={item} className="flex items-center gap-3 text-[#8899bb]">
                  <span className="w-5 h-5 rounded-full bg-[#f5c51820] border border-[#f5c51840] flex items-center justify-center text-[#f5c518] flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                  {t(item)}
                </li>
              ))}
            </ul>
          </div>

          {/* Cards side — CSS animation (no ScrollTrigger dependency) */}
          <div className="flex-1 w-full max-w-md mx-auto lg:mx-0 space-y-4">
            {PREVIEW_MATCHES.map((match, idx) => (
              <div
                key={`${match.home.name}-${match.away.name}`}
                className="animate-fade-in-up p-5 rounded-2xl bg-[#080b14] border border-[#1e2640] hover:border-[#2d3a5a] transition-colors duration-300"
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <TeamDisplay name={getTranslatedTeamName(match.home.name, locale)} flag={match.home.flag} />
                  <div className="text-center flex-shrink-0 px-3">
                    <div className="text-2xl font-black text-[#e8eaf0] whitespace-nowrap">
                      {match.prediction.scoreA} — {match.prediction.scoreB}
                    </div>
                    <div
                      className="text-xs mt-0.5 font-medium whitespace-nowrap"
                      style={{
                        color:
                          match.prediction.confidence >= 70
                            ? "#22c55e"
                            : match.prediction.confidence >= 55
                            ? "#f5c518"
                            : "#ef4444",
                      }}
                    >
                      {match.prediction.confidence}% {t("showcase.confidence")}
                    </div>
                  </div>
                  <TeamDisplay name={getTranslatedTeamName(match.away.name, locale)} flag={match.away.flag} align="right" />
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-[#1e2640]">
                  <span className="text-xs text-[#4a5570]">{t("showcase.aiPrediction")}</span>
                  <span className="text-xs font-semibold text-[#f5c518]">
                    {match.prediction.winner === "Draw"
                      ? t("showcase.draw")
                      : locale === "es"
                      ? `Gana ${getTranslatedTeamName(match.prediction.winner, locale)}`
                      : `${getTranslatedTeamName(match.prediction.winner, locale)} wins`}
                  </span>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-[#4a5570]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                    {locale === "es" ? "IA" : "AI"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamDisplay({
  name,
  flag,
  align = "left",
}: {
  name: string;
  flag: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 min-w-0 flex-1 ${
        align === "right" ? "items-end" : "items-start"
      }`}
    >
      <FlagImage
        src={`https://flagcdn.com/w40/${flag}.png`}
        alt={name}
        cdnSize={40}
        className="w-10 h-7 object-cover rounded"
      />
      <span className="text-sm font-semibold text-[#e8eaf0] truncate max-w-full">{name}</span>
    </div>
  );
}
