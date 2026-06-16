import { cookies } from "next/headers";
import { Locale } from "./translations";

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const locale = cookieStore.get("NEXT_LOCALE")?.value;
    return (locale === "es" ? "es" : "en") as Locale;
  } catch {
    return "en";
  }
}
