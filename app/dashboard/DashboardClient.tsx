"use client";

import { useState, useEffect } from "react";
import { Fixture } from "@/lib/types";
import {
  getBrowserTimezone,
  getTodayLocalDate,
  isMatchOnLocalToday,
  formatDayLabel,
} from "@/lib/timezone";
import { sortTodayFixtures } from "@/lib/fixture-status";
import { Skeleton } from "@/components/ui/Skeleton";
import { FixtureRow } from "@/components/dashboard/FixtureRow";
import { Calendar, CalendarClock } from "lucide-react";
import { useTranslation, Locale } from "@/lib/i18n/context";

interface FetchState {
  today: Fixture[];
  upcoming: Fixture[];
  loading: boolean;
  /** null until browser timezone is known */
  tz: string | null;
  dayLabel: string;
}

export default function DashboardClient({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  const [state, setState] = useState<FetchState>({
    today: [],
    upcoming: [],
    loading: true,
    tz: null,
    dayLabel: "",
  });

  useEffect(() => {
    const tz = getBrowserTimezone();
    const todayStr = getTodayLocalDate(tz);
    const dayLabel = formatDayLabel(tz, locale);

    fetch("/api/fixtures?round=Group Stage")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        const all = (json.data ?? []) as Fixture[];
        const nowSec = Date.now() / 1000;

        const today = sortTodayFixtures(
          all.filter((f) => isMatchOnLocalToday(f.timestamp, tz, todayStr))
        ).slice(0, 8);

        const upcoming = all
          .filter(
            (f) =>
              f.timestamp > nowSec &&
              !isMatchOnLocalToday(f.timestamp, tz, todayStr)
          )
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, 6);

        setState({ today, upcoming, loading: false, tz, dayLabel });
      })
      .catch(() => {
        setState((prev) => ({
          ...prev,
          today: [],
          upcoming: [],
          loading: false,
          tz,
          dayLabel,
        }));
      });
  }, [locale]);

  const { today, upcoming, loading, tz, dayLabel } = state;

  return (
    <div className="space-y-8">
      {/* ── Today ── */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#e8eaf0]">
              {t("dashboard.todaySchedule")}
            </h2>
            {dayLabel && (
              <p className="text-xs text-[#4a5570] mt-0.5">{dayLabel}</p>
            )}
          </div>

          {!loading && (
            <div className="flex items-center gap-1.5 text-xs mt-0.5 text-[#4a5570]">
              <Calendar className="w-3 h-3" />
              <span>{t("dashboard.officialSchedule")}</span>
            </div>
          )}
        </div>

        {!loading && today.length > 0 && tz && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#2d3a5a] mb-3">
            <CalendarClock className="w-3 h-3" />
            <span>{t("dashboard.timezoneNotice", { tz: tz.replace(/_/g, " ") })}</span>
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : today.length === 0 ? (
          <NoMatchesToday />
        ) : (
          <div className="space-y-2">
            {today.map((fixture) => (
              <FixtureRow key={fixture.id} fixture={fixture} userTz={tz ?? "UTC"} locale={locale} />
            ))}
          </div>
        )}
      </div>

      {/* ── Upcoming ── */}
      {!loading && upcoming.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-[#e8eaf0] mb-1">
            {t("dashboard.upcomingMatches")}
          </h2>
          <p className="text-xs text-[#4a5570] mb-4">
            {t("dashboard.upcomingMatchesDesc")}
          </p>
          <div className="space-y-2">
            {upcoming.map((fixture) => (
              <FixtureRow
                key={fixture.id}
                fixture={fixture}
                userTz={tz ?? "UTC"}
                showDate
                locale={locale}
              />
            ))}
          </div>
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
  const { t } = useTranslation();
  return (
    <div className="text-center py-10 rounded-xl border border-dashed border-[#1e2640]">
      <Calendar className="w-8 h-8 text-[#2d3a5a] mx-auto mb-3" />
      <p className="text-sm font-medium text-[#4a5570]">{t("dashboard.noMatchesToday")}</p>
      <p className="text-xs text-[#2d3a5a] mt-1">
        {t("dashboard.checkUpcoming")}
      </p>
    </div>
  );
}
