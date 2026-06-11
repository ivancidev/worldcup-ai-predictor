"use client";

import { useState, useEffect } from "react";
import { Fixture } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { getCountryFlagCode } from "@/lib/world-cup-data";
import { Calendar, Wifi, WifiOff } from "lucide-react";

export default function DashboardClient() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStatic, setIsStatic] = useState(false);

  useEffect(() => {
    fetch("/api/fixtures")
      .then((r) => r.json())
      .then((d) => {
        const all = (d.data || []) as Fixture[];
        setIsStatic(!!d.static);
        const upcoming = all
          .filter((f) => f.status.short === "NS")
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, 6);
        setFixtures(upcoming);
      })
      .catch(() => setFixtures([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#e8eaf0]">Upcoming Matches</h2>
        {!loading && (
          <div className="flex items-center gap-1.5 text-xs">
            {isStatic ? (
              <>
                <WifiOff className="w-3 h-3 text-[#4a5570]" />
                <span className="text-[#4a5570]">Schedule preview</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-[#22c55e]" />
                <span className="text-[#22c55e]">Live</span>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : fixtures.length === 0 ? (
        <EmptyFixtures />
      ) : (
        <div className="space-y-2">
          {fixtures.map((fixture) => (
            <FixtureRow key={fixture.id} fixture={fixture} />
          ))}
        </div>
      )}
    </div>
  );
}

function FixtureRow({ fixture }: { fixture: Fixture }) {
  const homeFlag = getCountryFlagCode(fixture.homeTeam.name) || fixture.homeTeam.flagCode || "xx";
  const awayFlag = getCountryFlagCode(fixture.awayTeam.name) || fixture.awayTeam.flagCode || "xx";

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0e1220] border border-[#1e2640] hover:border-[#2d3a5a] transition-all duration-200">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <img
          src={`https://flagcdn.com/w32/${homeFlag}.png`}
          alt={fixture.homeTeam.name}
          className="w-7 h-5 object-cover rounded shrink-0"
        />
        <span className="font-semibold text-[#e8eaf0] text-sm truncate">
          {fixture.homeTeam.name}
        </span>
      </div>

      <div className="shrink-0 flex flex-col items-center gap-0.5 px-3">
        <span className="text-[#f5c518] text-xs font-black">VS</span>
        <div className="flex items-center gap-1 text-[#4a5570]">
          <Calendar className="w-2.5 h-2.5" />
          <span className="text-[10px]">{formatShortDate(fixture.date)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
        <span className="font-semibold text-[#e8eaf0] text-sm truncate text-right">
          {fixture.awayTeam.name}
        </span>
        <img
          src={`https://flagcdn.com/w32/${awayFlag}.png`}
          alt={fixture.awayTeam.name}
          className="w-7 h-5 object-cover rounded shrink-0"
        />
      </div>
    </div>
  );
}

function EmptyFixtures() {
  return (
    <div className="text-center py-10 rounded-xl border border-dashed border-[#1e2640]">
      <Calendar className="w-8 h-8 text-[#2d3a5a] mx-auto mb-3" />
      <p className="text-sm font-medium text-[#4a5570]">No upcoming fixtures found</p>
      <p className="text-xs text-[#2d3a5a] mt-1">Group stage begins June 11, 2026</p>
    </div>
  );
}
