import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "green" | "red" | "blue" | "gray" | "outline";
  className?: string;
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  const variants = {
    gold: "bg-[#f5c51820] text-[#f5c518] border border-[#f5c51840]",
    green: "bg-[#22c55e20] text-[#22c55e] border border-[#22c55e40]",
    red: "bg-[#ef444420] text-[#ef4444] border border-[#ef444440]",
    blue: "bg-[#3b82f620] text-[#3b82f6] border border-[#3b82f640]",
    gray: "bg-[#1e2640] text-[#8899bb] border border-[#2d3a5a]",
    outline: "bg-transparent text-[#8899bb] border border-[#1e2640]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
