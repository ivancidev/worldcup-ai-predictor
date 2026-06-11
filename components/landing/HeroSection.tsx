"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ChevronRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const TEAMS = [
  { name: "Brazil",    flag: "br" },
  { name: "France",    flag: "fr" },
  { name: "Argentina", flag: "ar" },
  { name: "Germany",   flag: "de" },
  { name: "Spain",     flag: "es" },
  { name: "England",   flag: "gb-eng" },
];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef  = useRef<HTMLDivElement>(null);
  const subRef       = useRef<HTMLParagraphElement>(null);
  const ctaRef       = useRef<HTMLDivElement>(null);
  const statsRef     = useRef<HTMLDivElement>(null);
  const bgRef        = useRef<HTMLDivElement>(null);
  const teamsRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(bgRef.current, { opacity: 0, duration: 1.5 })
        .from(
          headlineRef.current?.querySelectorAll(".word") ?? [],
          { y: 80, opacity: 0, stagger: 0.08, duration: 0.8 },
          "-=0.8"
        )
        .from(subRef.current,  { y: 30, opacity: 0, duration: 0.6 }, "-=0.4")
        .from(ctaRef.current,  { y: 30, opacity: 0, duration: 0.6 }, "-=0.3")
        .from(
          statsRef.current?.querySelectorAll(".stat-item") ?? [],
          { y: 20, opacity: 0, stagger: 0.1, duration: 0.5 },
          "-=0.2"
        )
        .from(
          teamsRef.current?.querySelectorAll(".team-pill") ?? [],
          { scale: 0, opacity: 0, stagger: 0.06, duration: 0.4 },
          "-=0.4"
        );

      gsap.to(bgRef.current, {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 py-24 overflow-hidden stadium-bg"
    >
      {/* Background */}
      <div ref={bgRef} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[#f5c518] opacity-[0.04] blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#3b82f6] opacity-[0.03] blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03]" />
      </div>

      {/* Badge */}
      <div className="relative mb-8">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5c51815] border border-[#f5c51830] text-[#f5c518] text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-[#f5c518] animate-pulse-gold" />
          FIFA World Cup 2026 — June 11 to July 19
        </span>
      </div>

      {/* Headline */}
      <div ref={headlineRef} className="relative max-w-4xl mx-auto mb-6">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight text-[#e8eaf0]">
          {"Predict the".split(" ").map((w, i) => (
            <span key={i} className="word inline-block mr-4">{w}</span>
          ))}
          <br />
          <span className="word inline-block gradient-text">World Cup</span>
          <span className="word inline-block ml-4 text-[#e8eaf0]">with AI</span>
        </h1>
      </div>

      {/* Subtitle */}
      <p ref={subRef} className="relative max-w-2xl text-lg sm:text-xl text-[#8899bb] leading-relaxed mb-10">
        Real team stats, instant AI-powered match analysis, and a full bracket builder.
        Build your predictions and share them with friends.
      </p>

      {/* CTA */}
      <div ref={ctaRef} className="relative flex flex-col sm:flex-row items-center gap-4 mb-16">
        <Link
          href="/auth"
          className="group flex items-center gap-2 px-8 py-4 text-base font-bold bg-gradient-to-r from-[#f5c518] to-[#c9a000] text-[#080b14] rounded-2xl hover:from-[#ffd54f] hover:to-[#f5c518] transition-all duration-300 active:scale-95 shadow-xl shadow-[#f5c51830] cursor-pointer"
        >
          Start predicting free
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/bracket"
          className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-[#e8eaf0] rounded-2xl border border-[#1e2640] hover:border-[#2d3a5a] hover:bg-[#1e2640] transition-all duration-200 cursor-pointer"
        >
          View bracket
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div ref={statsRef} className="relative flex flex-wrap items-center justify-center gap-8 mb-12">
        {[
          { value: "48",  label: "Teams" },
          { value: "104", label: "Matches" },
          { value: "12",  label: "Groups" },
          { value: "AI",  label: "Predictions" },
        ].map((stat) => (
          <div key={stat.label} className="stat-item text-center">
            <div className="text-3xl font-black text-[#f5c518]">{stat.value}</div>
            <div className="text-sm text-[#8899bb]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Team pills */}
      <div ref={teamsRef} className="relative flex flex-wrap justify-center gap-2">
        {TEAMS.map((team) => (
          <div
            key={team.name}
            className="team-pill flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0e1220] border border-[#1e2640] text-sm text-[#8899bb]"
          >
            <img
              src={`https://flagcdn.com/w20/${team.flag}.png`}
              alt={team.name}
              className="w-5 h-3.5 object-cover rounded-sm"
            />
            {team.name}
          </div>
        ))}
        <div className="team-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0e1220] border border-[#1e2640] text-sm text-[#4a5570]">
          +42 more
        </div>
      </div>
    </section>
  );
}
