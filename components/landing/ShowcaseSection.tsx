"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bot, Check } from "lucide-react";

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
  "Real team statistics — live World Cup 2026 data",
  "Last 5 matches + head-to-head records",
  "Confidence score for every prediction",
  "Detailed reasoning you can share",
];

export default function ShowcaseSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".showcase-card", {
        x: 60,
        stagger: 0.15,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      gsap.from(".showcase-text", {
        x: -50,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-4 bg-[#0e1220]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Text side */}
          <div className="showcase-text flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5c51815] border border-[#f5c51830] text-[#f5c518] text-sm mb-6">
              <Bot className="w-3.5 h-3.5" />
              AI Analysis
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-[#e8eaf0] mb-6 leading-tight">
              Expert predictions,
              <br />
              <span className="gradient-text">instantly generated</span>
            </h2>
            <p className="text-[#8899bb] text-lg leading-relaxed mb-8">
              Pick any match, hit &quot;AI Predict&quot;, and get a detailed analysis backed by real
              match data — goals per game, form, head-to-head history — all analyzed instantly by AI.
            </p>
            <ul className="space-y-3 text-left">
              {AI_FEATURES.map((item) => (
                <li key={item} className="flex items-center gap-3 text-[#8899bb]">
                  <span className="w-5 h-5 rounded-full bg-[#f5c51820] border border-[#f5c51840] flex items-center justify-center text-[#f5c518] flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Cards side */}
          <div className="flex-1 w-full max-w-md space-y-4">
            {PREVIEW_MATCHES.map((match) => (
              <div
                key={`${match.home.name}-${match.away.name}`}
                className="showcase-card p-5 rounded-2xl bg-[#080b14] border border-[#1e2640] hover:border-[#2d3a5a] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <TeamDisplay name={match.home.name} flag={match.home.flag} />
                  <div className="text-center">
                    <div className="text-2xl font-black text-[#e8eaf0]">
                      {match.prediction.scoreA} — {match.prediction.scoreB}
                    </div>
                    <div
                      className="text-xs mt-0.5 font-medium"
                      style={{
                        color:
                          match.prediction.confidence >= 70
                            ? "#22c55e"
                            : match.prediction.confidence >= 55
                            ? "#f5c518"
                            : "#ef4444",
                      }}
                    >
                      {match.prediction.confidence}% confidence
                    </div>
                  </div>
                  <TeamDisplay name={match.away.name} flag={match.away.flag} align="right" />
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-[#1e2640]">
                  <span className="text-xs text-[#4a5570]">AI Prediction:</span>
                  <span className="text-xs font-semibold text-[#f5c518]">
                    {match.prediction.winner} wins
                  </span>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-[#4a5570]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                    AI
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
      className={`flex flex-col gap-1.5 w-24 ${
        align === "right" ? "items-end" : "items-start"
      }`}
    >
      <img
        src={`https://flagcdn.com/w40/${flag}.png`}
        alt={name}
        className="w-10 h-7 object-cover rounded"
      />
      <span className="text-sm font-semibold text-[#e8eaf0] truncate">{name}</span>
    </div>
  );
}
