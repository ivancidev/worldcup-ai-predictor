"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#080b14]";

    const variants = {
      primary: "bg-[#f5c518] text-[#080b14] hover:bg-[#ffd54f] focus:ring-[#f5c518] active:scale-95",
      gold: "bg-gradient-to-r from-[#f5c518] to-[#c9a000] text-[#080b14] hover:from-[#ffd54f] hover:to-[#f5c518] focus:ring-[#f5c518] active:scale-95 shadow-lg shadow-[#f5c51833]",
      secondary: "bg-[#1e2640] text-[#e8eaf0] border border-[#2d3a5a] hover:bg-[#2d3a5a] hover:border-[#3d4a6a] focus:ring-[#2d3a5a] active:scale-95",
      ghost: "bg-transparent text-[#8899bb] hover:bg-[#1e2640] hover:text-[#e8eaf0] focus:ring-[#2d3a5a] active:scale-95",
      danger: "bg-[#ef4444] text-white hover:bg-[#dc2626] focus:ring-[#ef4444] active:scale-95",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5",
      md: "text-sm px-4 py-2",
      lg: "text-base px-6 py-3",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
