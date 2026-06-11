import Link from "next/link";
import { Trophy, Code2 } from "lucide-react";

export default function Footer() {
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
            FIFA World Cup 2026 · USA, Canada &amp; Mexico · June 11 – July 19
          </p>

          <a
            href="https://github.com/ivancidev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#4a5570] hover:text-[#8899bb] transition-colors cursor-pointer"
          >
            by ivancidev
          </a>
        </div>
      </div>
    </footer>
  );
}
