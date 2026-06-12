import { Fixture } from "@/lib/types";
import { isLive } from "@/lib/fixture-status";

interface StatusBadgeProps {
  status: Fixture["status"];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { short, elapsed } = status;

  if (short === "NS") {
    return (
      <span className="text-[10px] font-semibold text-[#4a5570] uppercase tracking-wider">
        Soon
      </span>
    );
  }

  if (isLive({ short, elapsed, long: "" })) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-[#22c55e] uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse shrink-0" />
        {short === "HT" ? "HT" : elapsed ? `${elapsed}'` : "Live"}
      </span>
    );
  }

  if (["FT", "AET", "PEN_FT"].includes(short)) {
    return (
      <span className="text-[10px] font-semibold text-[#4a5570] uppercase tracking-wider">
        FT
      </span>
    );
  }

  if (["SUSP", "PST", "CANC"].includes(short)) {
    return (
      <span className="text-[10px] font-semibold text-[#ef4444] uppercase tracking-wider">
        {short}
      </span>
    );
  }

  return null;
}
