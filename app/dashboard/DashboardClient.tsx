"use client";

import { useState, useEffect } from "react";
import { Fixture } from "@/lib/types";
import {
  getBrowserTimezone,
  getTodayLocalDate,
  getLocalDayUtcDates,
  isMatchOnLocalToday,
  formatDayLabel,
} from "@/lib/timezone";
import { sortTodayFixtures } from "@/lib/fixture-status";
import { Skeleton } from "@/components/ui/Skeleton";
import { FixtureRow } from "@/components/dashboard/FixtureRow";
import { Calendar, Clock, Wifi } from "lucide-react";

interface FetchState {
  fixtures: Fixture[];
  loading: boolean;
  /** null until browser timezone is known */
  tz: string | null;
  dayLabel: string;
}

async function fetchFixturesForDate(
  utcDate: string
): Promise<{ data: Fixture[]; static?: boolean }> {
  const res = await fetch(`/api/fixtures?date=${utcDate}`);
  if (!res.ok) return { data: [] };
  return res.json();
}

export default function DashboardClient() {
  const [state, setState] = useState<FetchState>({
    fixtures: [],
    loading:  true,
    tz:       null,
    dayLabel: "",
  });

  useEffect(() => {
    const tz = getBrowserTimezone();
    const todayStr   = getTodayLocalDate(tz);
    const dayLabel   = formatDayLabel(tz);

    const [utcDate0, utcDate1] = getLocalDayUtcDates(tz);
    const dates = utcDate0 === utcDate1 ? [utcDate0] : [utcDate0, utcDate1];

    Promise.all(dates.map(fetchFixturesForDate))
      .then((results) => {
        const seen    = new Set<number>();
        const allRaw  = results.flatMap((r) => (r.data ?? []) as Fixture[]);
        const allUniq = allRaw.filter((f) => {
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return true;
        });

        // Filter to matches that fall on the user's local "today"
        const todayMatches = allUniq.filter((f) =>
          isMatchOnLocalToday(f.timestamp, tz, todayStr)
        );

        const sorted = sortTodayFixtures(todayMatches);

        setState({
          fixtures: sorted.slice(0, 8),
          loading:  false,
          tz,
          dayLabel,
        });
      })
      .catch(() => {
        setState((prev) => ({
          ...prev,
          fixtures: [],
          loading:  false,
          tz,
          dayLabel,
        }));
      });
  }, []);

  const { fixtures, loading, tz, dayLabel } = state;

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-[#e8eaf0]">
            Today&apos;s Matches
          </h2>
          {dayLabel && (
            <p className="text-xs text-[#4a5570] mt-0.5">{dayLabel}</p>
          )}
        </div>

        {!loading && (
          <div className="flex items-center gap-1.5 text-xs mt-0.5">
            <Wifi className="w-3 h-3 text-[#22c55e]" />
            <span className="text-[#22c55e]">Live</span>
          </div>
        )}
      </div>

      {/* ── Timezone note ── */}
      {!loading && fixtures.length > 0 && tz && (
        <div className="flex items-center gap-1.5 text-[10px] text-[#2d3a5a] mb-3">
          <Clock className="w-3 h-3" />
          <span>Times in your timezone ({tz.replace(/_/g, " ")})</span>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <LoadingSkeleton />
      ) : fixtures.length === 0 ? (
        <NoMatchesToday />
      ) : (
        <div className="space-y-2">
          {fixtures.map((fixture) => (
            <FixtureRow
              key={fixture.id}
              fixture={fixture}
              userTz={tz ?? "UTC"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

function NoMatchesToday() {
  return (
    <div className="text-center py-10 rounded-xl border border-dashed border-[#1e2640]">
      <Calendar className="w-8 h-8 text-[#2d3a5a] mx-auto mb-3" />
      <p className="text-sm font-medium text-[#4a5570]">No matches today</p>
      <p className="text-xs text-[#2d3a5a] mt-1">
        Check back on the next match day
      </p>
    </div>
  );
}
