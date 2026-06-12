import Link from "next/link";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 stadium-bg">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#141928] border border-[#1e2640] flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-8 h-8 text-[#f5c518]" strokeWidth={2} />
        </div>
        <p className="text-7xl font-black gradient-text mb-4">404</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#e8eaf0] mb-3">
          Page not found
        </h1>
        <p className="text-[#8899bb] mb-10">
          This page went out in the group stage. Let&apos;s get you back to the
          tournament.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3 font-bold bg-gradient-to-r from-[#f5c518] to-[#c9a000] text-[#080b14] rounded-2xl hover:from-[#ffd54f] hover:to-[#f5c518] transition-all duration-300 active:scale-95 shadow-2xl shadow-[#f5c51840]"
        >
          <Home className="w-5 h-5" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
