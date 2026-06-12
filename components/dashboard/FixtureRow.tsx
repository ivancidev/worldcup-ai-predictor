"use client";

import { useState } from "react";
import { Fixture } from "@/lib/types";
import { getCountryFlagCode } from "@/lib/world-cup-data";
import { isLive, isFinished } from "@/lib/fixture-status";
import { formatLocalTime } from "@/lib/timezone";
import { StatusBadge } from "./StatusBadge";

function resolveCode(name: string, flagCode: string): string {
  return flagCode || getCountryFlagCode(name) || "";
}

function TeamFlag({ name, flagCode }: { name: string; flagCode: string }) {
  const [errored, setErrored] = useState(false);
  const code = resolveCode(name, flagCode);
  const src  = code ? `https://flagcdn.com/w40/${code}.png` : "";

  if (!src || errored) {
    return (
      <div
        aria-label={name}
        className="w-7 h-5 rounded shrink-0 bg-[#1e2640] border border-[#2d3a5a] flex items-center justify-center overflow-hidden"
      >
        <span className="text-[8px] font-bold text-[#4a5570] leading-none">
          {name.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="w-7 h-5 object-cover rounded shrink-0"
      onError={() => setErrored(true)}
    />
  );
}

interface FixtureRowProps {
  fixture: Fixture;
  userTz: string;
}

export function FixtureRow({ fixture, userTz }: FixtureRowProps) {
  const live      = isLive(fixture.status);
  const finished  = isFinished(fixture.status);
  const hasScore  = fixture.goals.home !== null && fixture.goals.away !== null;
  const localTime = formatLocalTime(fixture.timestamp, userTz);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
        live
          ? "bg-[#22c55e06] border-[#22c55e25] hover:border-[#22c55e40]"
          : "bg-[#0e1220] border-[#1e2640] hover:border-[#2d3a5a]"
      }`}
    >
      {/* ── Home ── */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <TeamFlag name={fixture.homeTeam.name} flagCode={fixture.homeTeam.flagCode} />
        <span className={`font-semibold text-sm truncate ${finished ? "text-[#4a5570]" : "text-[#e8eaf0]"}`}>
          {fixture.homeTeam.name}
        </span>
      </div>

      {/* ── Score / time ── */}
      <div className="shrink-0 flex flex-col items-center gap-0.5 px-2 min-w-[68px]">
        {hasScore ? (
          <>
            <span className={`text-base font-black ${live ? "text-[#22c55e]" : finished ? "text-[#e8eaf0]" : "text-[#f5c518]"}`}>
              {fixture.goals.home} — {fixture.goals.away}
            </span>
            <StatusBadge status={fixture.status} />
          </>
        ) : (
          <>
            <span className="text-sm font-bold text-[#f5c518]">{localTime}</span>
            <StatusBadge status={fixture.status} />
          </>
        )}
      </div>

      {/* ── Away ── */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className={`font-semibold text-sm truncate text-right ${finished ? "text-[#4a5570]" : "text-[#e8eaf0]"}`}>
          {fixture.awayTeam.name}
        </span>
        <TeamFlag name={fixture.awayTeam.name} flagCode={fixture.awayTeam.flagCode} />
      </div>
    </div>
  );
}
