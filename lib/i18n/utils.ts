import { Locale, translations, TEAM_TRANSLATIONS } from "./translations";

export function getTranslation(locale: Locale, key: string, replacements?: Record<string, string | number>): string {
  const keys = key.split(".");
  let current: unknown = (translations as Record<Locale, unknown>)[locale];
  
  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      // Fallback to English
      let fallback: unknown = translations["en"];
      for (const fk of keys) {
        if (fallback && typeof fallback === "object" && fk in fallback) {
          fallback = (fallback as Record<string, unknown>)[fk];
        } else {
          return key;
        }
      }
      current = fallback;
      break;
    }
  }

  let text = typeof current === "string" ? current : key;
  
  if (replacements) {
    Object.entries(replacements).forEach(([k, val]) => {
      text = text.replace(new RegExp(`{${k}}`, "g"), String(val));
    });
  }
  
  return text;
}

export function getTranslatedTeamName(name: string, locale: Locale): string {
  if (locale === "es") {
    return TEAM_TRANSLATIONS[name] || name;
  }
  return name;
}
