import { Fixture } from "@/lib/types";

export const LIVE_STATUSES = ["1H", "2H", "HT", "ET", "PEN"] as const;

export const FINISHED_STATUSES = ["FT", "AET", "PEN_FT"] as const;

export function isLive(status: Fixture["status"]): boolean {
  return (LIVE_STATUSES as readonly string[]).includes(status.short);
}

export function isFinished(status: Fixture["status"]): boolean {
  return (FINISHED_STATUSES as readonly string[]).includes(status.short);
}

export function sortTodayFixtures(fixtures: Fixture[]): Fixture[] {
  return [...fixtures].sort((a, b) => {
    const priority = (f: Fixture) =>
      isLive(f.status) ? 0 : f.status.short === "NS" ? 1 : 2;
    const dp = priority(a) - priority(b);
    return dp !== 0 ? dp : a.timestamp - b.timestamp;
  });
}
