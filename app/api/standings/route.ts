import { createClient } from "@/lib/supabase/server";

const API_BASE = "https://v3.football.api-sports.io";
const CACHE_TTL_HOURS = 6;

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: cached } = await supabase
      .from("api_cache")
      .select("data, updated_at")
      .eq("cache_key", "standings_2026")
      .single();

    if (cached) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < CACHE_TTL_HOURS * 60 * 60 * 1000) {
        return Response.json({ data: cached.data, cached: true });
      }
    }

    const res = await fetch(
      `${API_BASE}/standings?league=1&season=2026`,
      {
        headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! },
        next: { revalidate: 60 * 60 * CACHE_TTL_HOURS },
      }
    );

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const apiData = await res.json();
    const standings = apiData.response?.[0]?.league?.standings ?? [];

    await supabase.from("api_cache").upsert({
      cache_key: "standings_2026",
      data: standings,
      updated_at: new Date().toISOString(),
    });

    return Response.json({ data: standings, cached: false });
  } catch (error) {
    console.error("Standings API error:", error);
    return Response.json(
      { error: "Failed to fetch standings", data: [] },
      { status: 500 }
    );
  }
}
