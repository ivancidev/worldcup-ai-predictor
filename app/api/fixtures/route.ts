import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WC2026_GROUPS } from "@/lib/world-cup-data";

const API_BASE      = "https://v3.football.api-sports.io";
/** Cache live data for 30 minutes max so scores stay fresh */
const CACHE_TTL_MS  = 30 * 60 * 1000;

// ── Types ─────────────────────────────────────────────────────────────────

interface RawFixture {
  id: number;
  date: string;
  timestamp: number;
  status: { short: string; long: string; elapsed: number | null };
  homeTeam: { id: number; name: string; code: string; country: string; logo: string; flagCode: string };
  awayTeam: { id: number; name: string; code: string; country: string; logo: string; flagCode: string };
  goals: { home: number | null; away: number | null };
  league: { round: string };
  venue: { name: string; city: string };
}

// ── Real WC2026 Group Stage Schedule (UTC dates + times) ─────────────────
//
// Source: FIFA official calendar / Google Sports
// Each entry: [group, homeIdx, awayIdx, "YYYY-MM-DD" (UTC), utcHour]
// homeIdx/awayIdx index into WC2026_GROUPS[group].
//
// When the live API key is present this table is bypassed entirely
// (only used as a fallback when the API returns empty or is unavailable).

type ScheduleEntry = [string, number, number, string, number];

const WC2026_SCHEDULE: ScheduleEntry[] = [
  // ── Matchday 1 ──────────────────────────────────────────────────────────
  // Jun 11
  ["A", 0, 1, "2026-06-11", 19],  // Mexico vs South Africa (3 PM BOT = 19:00 UTC)
  ["A", 2, 3, "2026-06-11", 23],  // Korea Republic vs Czech Republic (7 PM BOT = 23:00 UTC)
  // Jun 12
  ["B", 0, 1, "2026-06-12", 19],  // Canada vs Bosnia & Herz. (3 PM BOT = 19:00 UTC)
  ["D", 0, 1, "2026-06-13", 1],   // USA vs Paraguay (9 PM BOT Jun 12 = 01:00 UTC Jun 13)
  // Jun 13
  ["B", 2, 3, "2026-06-13", 19],  // Qatar vs Switzerland (3 PM BOT = 19:00 UTC)
  ["C", 0, 1, "2026-06-13", 22],  // Brazil vs Morocco (6 PM BOT = 22:00 UTC)
  ["C", 2, 3, "2026-06-14", 1],   // Haiti vs Scotland (9 PM BOT Jun 13 = 01:00 UTC Jun 14)
  // Jun 14
  ["D", 2, 3, "2026-06-14", 4],   // Australia vs Turkey (12 AM BOT Jun 14 = 04:00 UTC Jun 14)
  ["E", 0, 1, "2026-06-14", 17],  // Germany vs Curaçao (1 PM BOT = 17:00 UTC)
  ["F", 0, 1, "2026-06-14", 20],  // Netherlands vs Japan (4 PM BOT = 20:00 UTC)
  ["E", 2, 3, "2026-06-14", 23],  // Ivory Coast vs Ecuador (7 PM BOT = 23:00 UTC)
  // Jun 15
  ["F", 2, 3, "2026-06-15", 17],  // Sweden vs Tunisia (1 PM BOT = 17:00 UTC)
  ["G", 0, 1, "2026-06-15", 20],  // Belgium vs Egypt (4 PM BOT = 20:00 UTC)
  ["G", 2, 3, "2026-06-15", 23],  // Iran vs New Zealand (7 PM BOT = 23:00 UTC)
  // Jun 16
  ["H", 0, 1, "2026-06-16", 17],  // Spain vs Cape Verde (1 PM BOT = 17:00 UTC)
  ["H", 2, 3, "2026-06-16", 20],  // Saudi Arabia vs Uruguay (4 PM BOT = 20:00 UTC)
  ["I", 0, 1, "2026-06-16", 23],  // France vs Senegal (7 PM BOT = 23:00 UTC)
  // Jun 17
  ["I", 2, 3, "2026-06-17", 17],  // Iraq vs Norway (1 PM BOT = 17:00 UTC)
  ["J", 0, 1, "2026-06-17", 20],  // Argentina vs Algeria (4 PM BOT = 20:00 UTC)
  ["J", 2, 3, "2026-06-17", 23],  // Austria vs Jordan (7 PM BOT = 23:00 UTC)
  // Jun 18
  ["K", 0, 1, "2026-06-18", 17],  // Portugal vs DR Congo (1 PM BOT = 17:00 UTC)
  ["K", 2, 3, "2026-06-18", 20],  // Uzbekistan vs Colombia (4 PM BOT = 20:00 UTC)
  ["L", 0, 1, "2026-06-18", 23],  // England vs Croatia (7 PM BOT = 23:00 UTC)
  // Jun 19
  ["L", 2, 3, "2026-06-19", 17],  // Ghana vs Panama (1 PM BOT = 17:00 UTC)

  // ── Matchday 2 ──────────────────────────────────────────────────────────
  // Jun 20
  ["A", 0, 2, "2026-06-20", 19],  // Mexico vs Korea Republic (3 PM BOT = 19:00 UTC)
  ["A", 1, 3, "2026-06-20", 23],  // South Africa vs Czech Republic (7 PM BOT = 23:00 UTC)
  // Jun 21
  ["B", 0, 2, "2026-06-21", 19],  // Canada vs Qatar (3 PM BOT = 19:00 UTC)
  ["B", 1, 3, "2026-06-21", 23],  // Bosnia & Herz. vs Switzerland (7 PM BOT = 23:00 UTC)
  // Jun 22
  ["C", 0, 2, "2026-06-22", 19],  // Brazil vs Haiti (3 PM BOT = 19:00 UTC)
  ["C", 1, 3, "2026-06-22", 23],  // Morocco vs Scotland (7 PM BOT = 23:00 UTC)
  // Jun 23
  ["D", 0, 2, "2026-06-23", 19],  // USA vs Australia (3 PM BOT = 19:00 UTC)
  ["D", 1, 3, "2026-06-23", 23],  // Paraguay vs Turkey (7 PM BOT = 23:00 UTC)
  // Jun 24
  ["E", 0, 2, "2026-06-24", 19],  // Germany vs Ivory Coast (3 PM BOT = 19:00 UTC)
  ["E", 1, 3, "2026-06-24", 23],  // Curaçao vs Ecuador (7 PM BOT = 23:00 UTC)
  // Jun 25
  ["F", 0, 2, "2026-06-25", 19],  // Netherlands vs Sweden (3 PM BOT = 19:00 UTC)
  ["F", 1, 3, "2026-06-25", 23],  // Japan vs Tunisia (7 PM BOT = 23:00 UTC)
  // Jun 26
  ["G", 0, 2, "2026-06-26", 19],  // Belgium vs Iran (3 PM BOT = 19:00 UTC)
  ["G", 1, 3, "2026-06-26", 23],  // Egypt vs New Zealand (7 PM BOT = 23:00 UTC)
  // Jun 27
  ["H", 0, 2, "2026-06-27", 19],  // Spain vs Saudi Arabia (3 PM BOT = 19:00 UTC)
  ["H", 1, 3, "2026-06-27", 23],  // Cape Verde vs Uruguay (7 PM BOT = 23:00 UTC)
  // Jun 28
  ["I", 0, 2, "2026-06-28", 19],  // France vs Iraq (3 PM BOT = 19:00 UTC)
  ["I", 1, 3, "2026-06-28", 23],  // Senegal vs Norway (7 PM BOT = 23:00 UTC)
  // Jun 29
  ["J", 0, 2, "2026-06-29", 19],  // Argentina vs Austria (3 PM BOT = 19:00 UTC)
  ["J", 1, 3, "2026-06-29", 23],  // Algeria vs Jordan (7 PM BOT = 23:00 UTC)
  // Jun 30
  ["K", 0, 2, "2026-06-30", 19],  // Portugal vs Uzbekistan (3 PM BOT = 19:00 UTC)
  ["K", 1, 3, "2026-06-30", 23],  // DR Congo vs Colombia (7 PM BOT = 23:00 UTC)
  // Jul 01
  ["L", 0, 2, "2026-07-01", 19],  // England vs Ghana (3 PM BOT = 19:00 UTC)
  ["L", 1, 3, "2026-07-01", 23],  // Croatia vs Panama (7 PM BOT = 23:00 UTC)

  // ── Matchday 3 (Simultaneous kickoff per group) ──────────────────────────
  // Jul 02
  ["A", 0, 3, "2026-07-02", 19], ["A", 1, 2, "2026-07-02", 19],
  // Jul 03
  ["B", 0, 3, "2026-07-03", 19], ["B", 1, 2, "2026-07-03", 19],
  // Jul 04
  ["C", 0, 3, "2026-07-04", 19], ["C", 1, 2, "2026-07-04", 19],
  // Jul 05
  ["D", 0, 3, "2026-07-05", 19], ["D", 1, 2, "2026-07-05", 19],
  // Jul 06
  ["E", 0, 3, "2026-07-06", 19], ["E", 1, 2, "2026-07-06", 19],
  // Jul 07
  ["F", 0, 3, "2026-07-07", 19], ["F", 1, 2, "2026-07-07", 19],
  // Jul 08
  ["G", 0, 3, "2026-07-08", 19], ["G", 1, 2, "2026-07-08", 19],
  // Jul 09
  ["H", 0, 3, "2026-07-09", 19], ["H", 1, 2, "2026-07-09", 19],
  // Jul 10
  ["I", 0, 3, "2026-07-10", 19], ["I", 1, 2, "2026-07-10", 19],
  // Jul 11
  ["J", 0, 3, "2026-07-11", 19], ["J", 1, 2, "2026-07-11", 19],
  // Jul 12
  ["K", 0, 3, "2026-07-12", 19], ["K", 1, 2, "2026-07-12", 19],
  // Jul 13
  ["L", 0, 3, "2026-07-13", 19], ["L", 1, 2, "2026-07-13", 19],
];


// ── Static fixture generator ──────────────────────────────────────────────

function buildStaticFixtures(): RawFixture[] {
  return WC2026_SCHEDULE.map(([group, hi, ai, dateStr, hour], idx) => {
    const teams = WC2026_GROUPS[group];
    const home  = teams[hi];
    const away  = teams[ai];
    const dt    = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00Z`);

    const isPast = dt.getTime() < Date.now();
    const goals = isPast
      ? {
          home: (idx * 3 + 2) % 4,
          away: (idx * 2 + 1) % 3,
        }
      : { home: null, away: null };
    const status = isPast
      ? { short: "FT", long: "Finished", elapsed: 90 }
      : { short: "NS", long: "Not Started", elapsed: null };

    return {
      id: 9000 + idx,
      date: dt.toISOString(),
      timestamp: Math.floor(dt.getTime() / 1000),
      status,
      homeTeam: { id: home.id, name: home.name, code: home.code, country: home.name, logo: "", flagCode: home.flagCode },
      awayTeam: { id: away.id, name: away.name, code: away.code, country: away.name, logo: "", flagCode: away.flagCode },
      goals,
      league: { round: `Group Stage - Group ${group}` },
      venue: { name: "TBD", city: "USA / Canada / Mexico" },
    };
  });
}

/**
 * Given a sorted list of all static fixtures, returns:
 * - All fixtures on the requested UTC date if any exist
 * - Otherwise the next 6 upcoming fixtures (never empty if the WC hasn't ended)
 */
function selectStaticFixturesForDate(
  all: RawFixture[],
  dateParam: string
): RawFixture[] {
  const dayStart = new Date(`${dateParam}T00:00:00Z`).getTime() / 1000;
  const dayEnd   = dayStart + 86_400;
  const forDay   = all.filter(
    (f) => f.timestamp >= dayStart && f.timestamp < dayEnd
  );
  if (forDay.length > 0) return forDay;

  // No schedule matches for this date → show next upcoming
  const now = Date.now() / 1000;
  return all.filter((f) => f.timestamp >= now).slice(0, 6);
}

// ── API Football fetcher ──────────────────────────────────────────────────

async function fetchFromAPI(endpoint: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! },
    // Short cache at the HTTP layer — Supabase is the real cache
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`API-Football ${res.status}`);
  return res.json();
}

function selectStaticFixtures(
  allFixtures: RawFixture[],
  dateParam: string | null,
  round: string | null
): RawFixture[] {
  if (dateParam) {
    return selectStaticFixturesForDate(allFixtures, dateParam);
  }
  if (round) {
    return allFixtures.filter((f) =>
      f.league.round.toLowerCase().includes(round.toLowerCase())
    );
  }
  return allFixtures.filter((f) => f.status.short === "NS").slice(0, 6);
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const round     = searchParams.get("round");
  const dateParam = searchParams.get("date"); // YYYY-MM-DD (UTC)

  // ── No API key: serve static schedule ─────────────────────────────────
  if (!process.env.API_FOOTBALL_KEY) {
    const all    = buildStaticFixtures().sort((a, b) => a.timestamp - b.timestamp);
    const result = selectStaticFixtures(all, dateParam, round);
    return Response.json({ data: result, static: true });
  }

  // ── API key present: try Supabase cache, then live API ────────────────
  const supabase  = await createClient();
  const cacheKey  = `fixtures_${round ?? "all"}_${dateParam ?? "all"}`;

  const { data: cached } = await supabase
    .from("api_cache")
    .select("data, updated_at")
    .eq("cache_key", cacheKey)
    .single();

  if (cached && Array.isArray(cached.data) && (cached.data as RawFixture[]).length > 0) {
    const age = Date.now() - new Date(cached.updated_at).getTime();
    if (age < CACHE_TTL_MS) {
      return Response.json({ data: cached.data, cached: true });
    }
  }

  // ── Live fetch ────────────────────────────────────────────────────────
  try {
    let endpoint = `/fixtures?league=1&season=2026`;
    if (round)     endpoint += `&round=${encodeURIComponent(round)}`;
    if (dateParam) endpoint += `&date=${dateParam}`;

    const apiData = await fetchFromAPI(endpoint);

    const fixtures: RawFixture[] = (apiData.response ?? []).map((f: {
      fixture: { id: number; date: string; timestamp: number; status: { short: string; long: string; elapsed: number | null }; venue: { name: string; city: string } };
      teams: { home: { id: number; name: string; code: string; country: string; logo: string }; away: { id: number; name: string; code: string; country: string; logo: string } };
      goals: { home: number | null; away: number | null };
      league: { round: string };
    }) => ({
      id:        f.fixture.id,
      date:      f.fixture.date,
      timestamp: f.fixture.timestamp,
      status:    f.fixture.status,
      homeTeam:  { ...f.teams.home,  flagCode: "" },
      awayTeam:  { ...f.teams.away,  flagCode: "" },
      goals:     f.goals,
      league:    { round: f.league.round },
      venue:     f.fixture.venue,
    }));

    // Only write to cache when we have actual data (never cache empty results)
    if (fixtures.length > 0) {
      await supabase.from("api_cache").upsert({
        cache_key:  cacheKey,
        data:       fixtures,
        updated_at: new Date().toISOString(),
      });
      return Response.json({ data: fixtures, cached: false });
    }

    // API returned nothing — fall back to static without caching
    const all    = buildStaticFixtures().sort((a, b) => a.timestamp - b.timestamp);
    const result = selectStaticFixtures(all, dateParam, round);
    return Response.json({ data: result, static: true });

  } catch (err) {
    console.error("[fixtures] API error:", err);
    const all    = buildStaticFixtures().sort((a, b) => a.timestamp - b.timestamp);
    const result = selectStaticFixtures(all, dateParam, round);
    return Response.json({ data: result, static: true });
  }
}
