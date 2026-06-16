"use client";

import { useState } from "react";
import Link from "next/link";
import { Fixture } from "@/lib/types";
import { getCountryFlagCode, fixtureToGroupMatchId } from "@/lib/world-cup-data";
import { getTranslatedTeamName, Locale } from "@/lib/i18n/context";
import { isLive, isFinished } from "@/lib/fixture-status";
import { formatLocalTime } from "@/lib/timezone";
import { StatusBadge } from "./StatusBadge";
import { ChevronRight } from "lucide-react";

function formatDayLabel(timestamp: number, tz: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp * 1000));
}

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
        className="w-5 h-3.5 sm:w-7 sm:h-5 rounded shrink-0 bg-[#1e2640] border border-[#2d3a5a] flex items-center justify-center overflow-hidden"
      >
        <span className="text-[6px] sm:text-[8px] font-bold text-[#4a5570] leading-none">
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
      className="w-5 h-3.5 sm:w-7 sm:h-5 object-cover rounded shrink-0"
      onError={() => setErrored(true)}
    />
  );
}

interface FixtureRowProps {
  fixture: Fixture;
  userTz: string;
  /** Show the match day above the kickoff time (used in the Upcoming list). */
  showDate?: boolean;
  locale?: Locale;
}

export function FixtureRow({ fixture, userTz, showDate = false, locale = "en" }: FixtureRowProps) {
  const live      = isLive(fixture.status);
  const finished  = isFinished(fixture.status);
  const localTime = formatLocalTime(fixture.timestamp, userTz, locale);
  const groupLabel = fixture.league.round.match(/Group [A-L]/)?.[0] ?? null;
  const groupLetter = groupLabel?.slice(-1) ?? null;
  const matchId = fixtureToGroupMatchId(fixture.homeTeam.name, fixture.awayTeam.name);

  const translatedHomeName = getTranslatedTeamName(fixture.homeTeam.name, locale);
  const translatedAwayName = getTranslatedTeamName(fixture.awayTeam.name, locale);

  const rowContent = (
    <>
      {/* ── Home ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
        <TeamFlag name={fixture.homeTeam.name} flagCode={fixture.homeTeam.flagCode} />
        <span className={`font-semibold text-xs sm:text-sm truncate ${finished ? "text-[#4a5570]" : "text-[#e8eaf0]"}`}>
          <span className="hidden xs:inline">{translatedHomeName}</span>
          <span className="inline xs:hidden">{fixture.homeTeam.code || translatedHomeName}</span>
        </span>
      </div>

      {/* ── Kickoff time + status ── */}
      <div className="shrink-0 flex flex-col items-center gap-0.5 px-1 sm:px-2 min-w-[76px] sm:min-w-[88px]">
        {showDate && (
          <span className="text-[8px] sm:text-[10px] font-semibold text-[#8899bb] uppercase tracking-wider">
            {formatDayLabel(fixture.timestamp, userTz, locale)}
          </span>
        )}
        <span className={`text-xs sm:text-sm font-bold ${finished ? "text-[#4a5570]" : "text-[#f5c518]"}`}>
          {localTime}
        </span>
        <span className="flex items-center gap-0.5 sm:gap-1">
          {groupLabel && (
            <span className="text-[8px] sm:text-[10px] font-semibold text-[#4a5570] uppercase tracking-wider">
              {groupLabel.replace("Group ", "G")} ·
            </span>
          )}
          <StatusBadge status={fixture.status} />
        </span>
      </div>

      {/* ── Away ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-end">
        <span className={`font-semibold text-xs sm:text-sm truncate text-right ${finished ? "text-[#4a5570]" : "text-[#e8eaf0]"}`}>
          <span className="hidden xs:inline">{translatedAwayName}</span>
          <span className="inline xs:hidden">{fixture.awayTeam.code || translatedAwayName}</span>
        </span>
        <TeamFlag name={fixture.awayTeam.name} flagCode={fixture.awayTeam.flagCode} />
      </div>
    </>
  );

  // Finished matches: nothing left to predict, so no link and no CTA
  if (finished) {
    return (
      <div className="flex items-center gap-2 sm:gap-3 px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border bg-[#0e1220] border-[#1e2640]">
        {rowContent}
      </div>
    );
  }

  const href = matchId
    ? `/predict/${matchId}`
    : groupLetter
      ? `/groups?group=${groupLetter}`
      : "/groups";

  return (
    <Link
      href={href}
      className={`group flex items-center gap-2 sm:gap-3 px-2.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
        live
          ? "bg-[#22c55e06] border-[#22c55e25] hover:border-[#22c55e40]"
          : "bg-[#0e1220] border-[#1e2640] hover:border-[#2d3a5a]"
      }`}
    >
      {rowContent}

      {/* ── Predict CTA ── */}
      <ChevronRight className="w-4 h-4 text-[#4a5570] group-hover:text-[#f5c518] group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}
