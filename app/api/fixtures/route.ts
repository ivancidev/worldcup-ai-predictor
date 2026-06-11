import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WC2026_GROUPS } from "@/lib/world-cup-data";

const API_BASE = "https://v3.football.api-sports.io";
const CACHE_TTL_HOURS = 6;

interface StaticFixture {
  id: number; date: string; timestamp: number;
  status: { short: string; long: string; elapsed: number | null };
  homeTeam: { id: number; name: string; code: string; country: string; logo: string; flagCode: string };
  awayTeam: { id: number; name: string; code: string; country: string; logo: string; flagCode: string };
  goals: { home: number | null; away: number | null };
  league: { round: string };
  venue: { name: string; city: string };
}

function generateStaticFixtures(): StaticFixture[] {
  const groups = Object.entries(WC2026_GROUPS);
  const fixtures: StaticFixture[] = [];
  let id = 9000;

  groups.forEach(([group, teams], groupIdx) => {
    const base = new Date("2026-06-11T20:00:00Z");
    base.setDate(base.getDate() + groupIdx);
    const date = base.toISOString();
    const timestamp = Math.floor(base.getTime() / 1000);

    fixtures.push({
      id: id++,
      date,
      timestamp,
      status: { short: "NS", long: "Not Started", elapsed: null },
      homeTeam: { id: teams[0].id, name: teams[0].name, code: teams[0].code, country: teams[0].name, logo: "", flagCode: teams[0].flagCode },
      awayTeam: { id: teams[1].id, name: teams[1].name, code: teams[1].code, country: teams[1].name, logo: "", flagCode: teams[1].flagCode },
      goals: { home: null, away: null },
      league: { round: `Group Stage - Group ${group}` },
      venue: { name: "TBD", city: "USA/Canada/Mexico" },
    });

    const base2 = new Date("2026-06-15T20:00:00Z");
    base2.setDate(base2.getDate() + groupIdx);
    const date2 = base2.toISOString();
    const timestamp2 = Math.floor(base2.getTime() / 1000);

    fixtures.push({
      id: id++,
      date: date2,
      timestamp: timestamp2,
      status: { short: "NS", long: "Not Started", elapsed: null },
      homeTeam: { id: teams[2].id, name: teams[2].name, code: teams[2].code, country: teams[2].name, logo: "", flagCode: teams[2].flagCode },
      awayTeam: { id: teams[3].id, name: teams[3].name, code: teams[3].code, country: teams[3].name, logo: "", flagCode: teams[3].flagCode },
      goals: { home: null, away: null },
      league: { round: `Group Stage - Group ${group}` },
      venue: { name: "TBD", city: "USA/Canada/Mexico" },
    });
  });

  return fixtures;
}

async function fetchFromAPIFootball(endpoint: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! },
    next: { revalidate: 60 * 60 * CACHE_TTL_HOURS },
  });
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const round = searchParams.get("round");
  const group = searchParams.get("group");

  if (!process.env.API_FOOTBALL_KEY) {
    const all = generateStaticFixtures()
      .filter((f) => f.status.short === "NS")
      .sort((a, b) => a.timestamp - b.timestamp);
    return Response.json({ data: all, static: true });
  }

  try {
    const supabase = await createClient();

    const cacheKey = `fixtures_${round || "all"}_${group || "all"}`;
    const { data: cached } = await supabase
      .from("api_cache")
      .select("data, updated_at")
      .eq("cache_key", cacheKey)
      .single();

    if (cached) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < CACHE_TTL_HOURS * 60 * 60 * 1000) {
        return Response.json({ data: cached.data, cached: true });
      }
    }

    let endpoint = `/fixtures?league=1&season=2026`;
    if (round) endpoint += `&round=${encodeURIComponent(round)}`;

    const apiData = await fetchFromAPIFootball(endpoint);

    const fixtures = apiData.response?.map((f: {
      fixture: { id: number; date: string; timestamp: number; status: { short: string; long: string; elapsed: number | null }; venue: { name: string; city: string } };
      teams: { home: { id: number; name: string; code: string; country: string; logo: string }; away: { id: number; name: string; code: string; country: string; logo: string } };
      goals: { home: number | null; away: number | null };
      league: { round: string };
    }) => ({
      id: f.fixture.id,
      date: f.fixture.date,
      timestamp: f.fixture.timestamp,
      status: f.fixture.status,
      homeTeam: { ...f.teams.home, flagCode: "" },
      awayTeam: { ...f.teams.away, flagCode: "" },
      goals: f.goals,
      league: { round: f.league.round },
      venue: f.fixture.venue,
    })) ?? [];

    await supabase.from("api_cache").upsert({
      cache_key: cacheKey,
      data: fixtures,
      updated_at: new Date().toISOString(),
    });

    return Response.json({ data: fixtures, cached: false });
  } catch (error) {
    console.error("Fixtures API error:", error);
    const fallback = generateStaticFixtures()
      .filter((f) => f.status.short === "NS")
      .sort((a, b) => a.timestamp - b.timestamp);
    return Response.json({ data: fallback, static: true });
  }
}
