"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Trophy, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

gsap.registerPlugin(ScrollTrigger);

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".cta-content", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="cta-content relative p-12 rounded-3xl overflow-hidden gradient-border">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f5c51808] to-transparent" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03]" />

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5c518] to-[#c9a000] flex items-center justify-center mx-auto mb-6 animate-float">
              <Trophy className="w-8 h-8 text-[#080b14]" strokeWidth={2} />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-[#e8eaf0] mb-4">
              {t("cta.readyToPredict")}
            </h2>
            <p className="text-[#8899bb] text-lg mb-10 max-w-lg mx-auto">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth"
                className="flex items-center gap-2 px-10 py-4 text-lg font-bold bg-gradient-to-r from-[#f5c518] to-[#c9a000] text-[#080b14] rounded-2xl hover:from-[#ffd54f] hover:to-[#f5c518] transition-all duration-300 active:scale-95 shadow-2xl shadow-[#f5c51840] cursor-pointer"
              >
                <Trophy className="w-5 h-5" />
                {t("cta.createAccount")}
              </Link>
              <Link
                href="/groups"
                className="flex items-center gap-2 px-10 py-4 text-lg font-semibold text-[#8899bb] rounded-2xl border border-[#1e2640] hover:border-[#2d3a5a] hover:text-[#e8eaf0] hover:bg-[#1e2640] transition-all duration-200 cursor-pointer"
              >
                <Users className="w-5 h-5" />
                {t("cta.viewGroups")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
