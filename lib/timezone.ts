function localDateString(d: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const dd = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${dd}`;
}

export function getTodayLocalDate(tz: string): string {
  return localDateString(new Date(), tz);
}

export function getTimezoneOffsetHours(tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "longOffset",
    }).formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
    if (tzPart === "GMT" || tzPart === "UTC") return 0;
    const match = tzPart.match(/GMT([+-])(\d+):(\d+)/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    return sign * (hours + minutes / 60);
  } catch {
    return 0;
  }
}

export function getLocalDayUtcDates(tz: string): [string, string] {
  const todayStr = getTodayLocalDate(tz);
  const offset = getTimezoneOffsetHours(tz);
  
  if (offset < 0) {
    const today = new Date(`${todayStr}T12:00:00Z`);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const d0 = todayStr;
    const d1 = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(tomorrow);
    return [d0, d1];
  } else if (offset > 0) {
    const today = new Date(`${todayStr}T12:00:00Z`);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const d0 = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(yesterday);
    const d1 = todayStr;
    return [d0, d1];
  } else {
    return [todayStr, todayStr];
  }
}

export function isMatchOnLocalToday(timestamp: number, tz: string, todayStr: string): boolean {
  const matchLocalDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
  }).format(new Date(timestamp * 1000));
  return matchLocalDate === todayStr;
}

export function formatLocalTime(timestamp: number, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(timestamp * 1000));
}

export function formatDayLabel(tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function formatMatchDateTime(timestamp: number, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(timestamp * 1000));
}
