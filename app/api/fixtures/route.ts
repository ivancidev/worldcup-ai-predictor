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
// Source: official FIFA World Cup 2026 fixture list (via ESPN). Kickoff times
// are given in ET (UTC-4 in June) and converted to UTC here. Late ET kickoffs
// (9 PM ET and later) roll over to the next UTC calendar day.
// Each entry: [group, homeIdx, awayIdx, "YYYY-MM-DD" (UTC kickoff date), utcHour, utcMinute?]
// homeIdx/awayIdx index into WC2026_GROUPS[group].
//
// When the live API key is present this table is bypassed entirely
// (only used as a fallback when the API returns empty or is unavailable).

type ScheduleEntry = [string, number, number, string, number, number?];

const WC2026_SCHEDULE: ScheduleEntry[] = [
  // ══ Matchday 1 ══════════════════════════════════════════════════════════
  // Thu Jun 11
  ["A", 0, 1, "2026-06-11", 18],  // Mexico vs South Africa (2 PM ET)
  ["A", 2, 3, "2026-06-11", 18],  // Korea Republic vs Czech Republic (2 PM ET)
  // Fri Jun 12
  ["B", 0, 1, "2026-06-12", 19],  // Canada vs Bosnia & Herz. (3 PM ET)
  ["D", 0, 1, "2026-06-12", 23],  // USA vs Paraguay (7 PM ET)
  // Sat Jun 13
  ["B", 2, 3, "2026-06-13", 19],  // Qatar vs Switzerland (3 PM ET)
  ["C", 0, 1, "2026-06-13", 23],  // Brazil vs Morocco (7 PM ET)
  ["C", 2, 3, "2026-06-13", 23],  // Haiti vs Scotland (7 PM ET)
  ["D", 2, 3, "2026-06-14", 4],   // Australia vs Turkey (12 AM ET → Jun 14 UTC)
  // Sun Jun 14
  ["E", 0, 1, "2026-06-14", 17],  // Germany vs Curaçao (1 PM ET)
  ["F", 0, 1, "2026-06-14", 19],  // Netherlands vs Japan (3 PM ET)
  ["E", 2, 3, "2026-06-14", 19],  // Ivory Coast vs Ecuador (3 PM ET)
  ["F", 2, 3, "2026-06-15", 2],   // Sweden vs Tunisia (10 PM ET → Jun 15 UTC)
  // Mon Jun 15
  ["H", 0, 1, "2026-06-15", 22],  // Spain vs Cape Verde (6 PM ET)
  ["G", 0, 1, "2026-06-15", 22],  // Belgium vs Egypt (6 PM ET)
  ["H", 2, 3, "2026-06-15", 22],  // Saudi Arabia vs Uruguay (6 PM ET)
  ["G", 2, 3, "2026-06-16", 4],   // Iran vs New Zealand (12 AM ET → Jun 16 UTC)
  // Tue Jun 16
  ["I", 0, 1, "2026-06-16", 19],  // France vs Senegal (3 PM ET)
  ["I", 2, 3, "2026-06-16", 22],  // Iraq vs Norway (6 PM ET)
  ["J", 0, 1, "2026-06-17", 1],   // Argentina vs Algeria (9 PM ET → Jun 17 UTC)
  ["J", 2, 3, "2026-06-17", 4],   // Austria vs Jordan (12 AM ET → Jun 17 UTC)
  // Wed Jun 17
  ["K", 0, 1, "2026-06-17", 17],  // Portugal vs DR Congo (1 PM ET)
  ["L", 0, 1, "2026-06-17", 20],  // England vs Croatia (4 PM ET)
  ["L", 2, 3, "2026-06-17", 23],  // Ghana vs Panama (7 PM ET)
  ["K", 2, 3, "2026-06-18", 2],   // Uzbekistan vs Colombia (10 PM ET → Jun 18 UTC)

  // ══ Matchday 2 ══════════════════════════════════════════════════════════
  // Thu Jun 18
  ["A", 3, 1, "2026-06-18", 16],  // Czech Republic vs South Africa (12 PM ET)
  ["B", 3, 1, "2026-06-18", 19],  // Switzerland vs Bosnia & Herz. (3 PM ET)
  ["B", 0, 2, "2026-06-18", 22],  // Canada vs Qatar (6 PM ET)
  ["A", 0, 2, "2026-06-19", 3],   // Mexico vs Korea Republic (11 PM ET → Jun 19 UTC)
  // Fri Jun 19
  ["D", 0, 2, "2026-06-19", 19],  // USA vs Australia (3 PM ET)
  ["C", 3, 1, "2026-06-19", 22],  // Scotland vs Morocco (6 PM ET)
  ["C", 0, 2, "2026-06-20", 1],   // Brazil vs Haiti (9 PM ET → Jun 20 UTC)
  ["D", 3, 1, "2026-06-20", 4],   // Turkey vs Paraguay (12 AM ET → Jun 20 UTC)
  // Sat Jun 20
  ["F", 0, 2, "2026-06-20", 17],  // Netherlands vs Sweden (1 PM ET)
  ["E", 0, 2, "2026-06-20", 20],  // Germany vs Ivory Coast (4 PM ET)
  ["E", 3, 1, "2026-06-21", 0],   // Ecuador vs Curaçao (8 PM ET → Jun 21 UTC)
  ["F", 3, 1, "2026-06-21", 4],   // Tunisia vs Japan (12 AM ET → Jun 21 UTC)
  // Sun Jun 21
  ["H", 0, 2, "2026-06-21", 16],  // Spain vs Saudi Arabia (12 PM ET)
  ["G", 0, 2, "2026-06-21", 19],  // Belgium vs Iran (3 PM ET)
  ["H", 3, 1, "2026-06-21", 22],  // Uruguay vs Cape Verde (6 PM ET)
  ["G", 3, 1, "2026-06-22", 1],   // New Zealand vs Egypt (9 PM ET → Jun 22 UTC)
  // Mon Jun 22
  ["J", 0, 2, "2026-06-22", 17],  // Argentina vs Austria (1 PM ET)
  ["I", 0, 2, "2026-06-22", 21],  // France vs Iraq (5 PM ET)
  ["I", 3, 1, "2026-06-23", 0],   // Norway vs Senegal (8 PM ET → Jun 23 UTC)
  ["J", 3, 1, "2026-06-23", 3],   // Jordan vs Algeria (11 PM ET → Jun 23 UTC)
  // Tue Jun 23
  ["K", 0, 2, "2026-06-23", 17],  // Portugal vs Uzbekistan (1 PM ET)
  ["L", 0, 2, "2026-06-23", 20],  // England vs Ghana (4 PM ET)
  ["L", 3, 1, "2026-06-23", 23],  // Panama vs Croatia (7 PM ET)
  ["K", 3, 1, "2026-06-24", 2],   // Colombia vs DR Congo (10 PM ET → Jun 24 UTC)

  // ══ Matchday 3 (simultaneous kickoffs per group) ════════════════════════
  // Wed Jun 24
  ["B", 3, 0, "2026-06-24", 19], ["B", 1, 2, "2026-06-24", 19],  // Group B (3 PM ET)
  ["C", 3, 0, "2026-06-24", 22], ["C", 1, 2, "2026-06-24", 22],  // Group C (6 PM ET)
  ["A", 3, 0, "2026-06-25", 1],  ["A", 1, 2, "2026-06-25", 1],   // Group A (9 PM ET → Jun 25 UTC)
  // Thu Jun 25
  ["E", 3, 0, "2026-06-25", 20], ["E", 1, 2, "2026-06-25", 20],  // Group E (4 PM ET)
  ["F", 1, 2, "2026-06-25", 23], ["F", 3, 0, "2026-06-25", 23],  // Group F (7 PM ET)
  ["D", 3, 0, "2026-06-26", 2],  ["D", 1, 2, "2026-06-26", 2],   // Group D (10 PM ET → Jun 26 UTC)
  // Fri Jun 26
  ["I", 3, 0, "2026-06-26", 19], ["I", 1, 2, "2026-06-26", 19],  // Group I (3 PM ET)
  ["H", 1, 2, "2026-06-27", 0],  ["H", 3, 0, "2026-06-27", 0],   // Group H (8 PM ET → Jun 27 UTC)
  ["G", 1, 2, "2026-06-27", 3],  ["G", 3, 0, "2026-06-27", 3],   // Group G (11 PM ET → Jun 27 UTC)
  // Sat Jun 27
  ["L", 3, 0, "2026-06-27", 21], ["L", 1, 2, "2026-06-27", 21],  // Group L (5 PM ET)
  ["K", 3, 0, "2026-06-27", 23, 30], ["K", 1, 2, "2026-06-27", 23, 30],  // Group K (7:30 PM ET)
  ["J", 1, 2, "2026-06-28", 2],  ["J", 3, 0, "2026-06-28", 2],   // Group J (10 PM ET → Jun 28 UTC)
];


// ── Static fixture generator ──────────────────────────────────────────────

function buildStaticFixtures(): RawFixture[] {
  return WC2026_SCHEDULE.map(([group, hi, ai, dateStr, hour, min = 0], idx) => {
    const teams = WC2026_GROUPS[group];
    const home  = teams[hi];
    const away  = teams[ai];
    const dt    = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00Z`);

    const now = Date.now();
    const startTime = dt.getTime();
    const elapsedMs = now - startTime;
    const matchDurationMs = 120 * 60 * 1000; // 120 mins including half time

    let status: { short: string; long: string; elapsed: number | null };
    let goals: { home: number | null; away: number | null };

    if (elapsedMs < 0) {
      // Not Started
      status = { short: "NS", long: "Not Started", elapsed: null };
      goals = { home: null, away: null };
    } else if (elapsedMs >= matchDurationMs) {
      // Finished
      status = { short: "FT", long: "Finished", elapsed: 90 };
      goals = {
        home: (idx * 3 + 2) % 4,
        away: (idx * 2 + 1) % 3,
      };
    } else {
      // Live! (In progress)
      const elapsedMins = Math.floor(elapsedMs / (60 * 1000));
      
      if (elapsedMins < 45) {
        status = { short: "1H", long: "First Half", elapsed: elapsedMins || 1 };
      } else if (elapsedMins < 60) {
        status = { short: "HT", long: "Halftime", elapsed: 45 };
      } else if (elapsedMins < 105) {
        status = { short: "2H", long: "Second Half", elapsed: elapsedMins - 15 };
      } else {
        status = { short: "2H", long: "Second Half", elapsed: 90 };
      }

      const homeFinal = (idx * 3 + 2) % 4;
      const awayFinal = (idx * 2 + 1) % 3;

      let homeLive = 0;
      if (homeFinal >= 1 && elapsedMins >= 15) homeLive = 1;
      if (homeFinal >= 2 && elapsedMins >= 50) homeLive = 2;
      if (homeFinal >= 3 && elapsedMins >= 80) homeLive = 3;

      let awayLive = 0;
      if (awayFinal >= 1 && elapsedMins >= 30) awayLive = 1;
      if (awayFinal >= 2 && elapsedMins >= 75) awayLive = 2;

      goals = { home: homeLive, away: awayLive };
    }

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
