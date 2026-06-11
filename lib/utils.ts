export function formatMatchDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(timestamp * 1000));
}

export function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10);
}

export function getFlagUrl(code: string, width: number = 40): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 70) return "#22c55e";
  if (confidence >= 50) return "#f5c518";
  return "#ef4444";
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 70) return "High";
  if (confidence >= 50) return "Medium";
  return "Low";
}
