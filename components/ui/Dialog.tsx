"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Blur only from md up — backdrop-filter glitches Chrome on Android */}
      <div className="absolute inset-0 bg-black/80 md:bg-black/70 md:backdrop-blur-sm" />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg bg-[#0e1220] border border-[#1e2640] rounded-2xl shadow-2xl",
          // Cap the height so long content scrolls inside the dialog instead
          // of pushing the header (and close button) off-screen on mobile.
          // dvh accounts for the collapsing mobile browser URL bar.
          "flex flex-col max-h-[calc(100dvh-2rem)]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-[#1e2640] shrink-0">
            <h2 className="text-lg font-bold text-[#e8eaf0]">{title}</h2>
            <button
              onClick={onClose}
              className="text-[#8899bb] hover:text-[#e8eaf0] transition-colors p-1 rounded-lg hover:bg-[#1e2640] cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
