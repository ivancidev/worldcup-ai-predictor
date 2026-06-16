"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-[#1e2640] bg-[#080b14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f5c518] to-[#c9a000] flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-[#080b14]" strokeWidth={2.5} />
            </div>
            <span className="font-black text-[#e8eaf0]">WC<span className="text-[#f5c518]">2026</span></span>
            <span className="text-[#4a5570] text-sm font-medium">Predictor</span>
          </Link>

          <p className="text-xs text-[#2d3a5a] text-center">
            {t("footer.scheduleDescription")}
          </p>

          <a
            href="https://github.com/ivancidev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#4a5570] hover:text-[#8899bb] transition-colors cursor-pointer"
          >
            {t("footer.by")} ivancidev
          </a>
        </div>
      </div>
    </footer>
  );
}
