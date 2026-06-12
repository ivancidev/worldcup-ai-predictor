"use client";

import Link from "next/link";
import { Home, RotateCcw, TriangleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 stadium-bg">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#141928] border border-[#1e2640] flex items-center justify-center mx-auto mb-6">
          <TriangleAlert className="w-8 h-8 text-[#f5c518]" strokeWidth={2} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#e8eaf0] mb-3">
          Something went wrong
        </h1>
        <p className="text-[#8899bb] mb-10">
          An unexpected error interrupted the match. Try again or head back to
          the home page.
          {error.digest && (
            <span className="block mt-2 text-xs text-[#4a5570] font-mono">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-8 py-3 font-bold bg-gradient-to-r from-[#f5c518] to-[#c9a000] text-[#080b14] rounded-2xl hover:from-[#ffd54f] hover:to-[#f5c518] transition-all duration-300 active:scale-95 shadow-2xl shadow-[#f5c51840] cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 font-semibold text-[#8899bb] rounded-2xl border border-[#1e2640] hover:border-[#2d3a5a] hover:text-[#e8eaf0] hover:bg-[#1e2640] transition-all duration-200"
          >
            <Home className="w-5 h-5" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
