import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function fetchTeamStats(teamId: number) {
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/teams/statistics?league=1&season=2026&team=${teamId}`,
      {
        headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.response;
  } catch {
    return null;
  }
}

async function fetchH2H(teamA: number, teamB: number) {
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures/headtohead?h2h=${teamA}-${teamB}&last=5`,
      {
        headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.response?.slice(0, 5) ?? [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamA, teamB, teamAId, teamBId, matchId } = body;

    if (!teamA || !teamB) {
      return Response.json({ error: "teamA and teamB are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const cacheKey = `predict_${matchId || `${teamA}_${teamB}`}`;

    const { data: cached } = await supabase
      .from("api_cache")
      .select("data, updated_at")
      .eq("cache_key", cacheKey)
      .single();

    if (cached) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < 24 * 60 * 60 * 1000) {
        return Response.json({ ...cached.data, cached: true });
      }
    }

    const [statsA, statsB, h2h] = await Promise.all([
      teamAId ? fetchTeamStats(teamAId) : null,
      teamBId ? fetchTeamStats(teamBId) : null,
      teamAId && teamBId ? fetchH2H(teamAId, teamBId) : [],
    ]);

    const statsContext = buildStatsContext(teamA, teamB, statsA, statsB, h2h);

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a world-class football analyst specializing in FIFA World Cup predictions.
You analyze team statistics, head-to-head records, current form, and tactical matchups to provide expert predictions.
Always respond with valid JSON only, no markdown or extra text.`,
        },
        {
          role: "user",
          content: `Analyze this FIFA World Cup 2026 match and predict the result.

${statsContext}

Respond with this exact JSON structure:
{
  "winner": "${teamA} or ${teamB} or Draw",
  "scoreA": <integer score for ${teamA}>,
  "scoreB": <integer score for ${teamB}>,
  "confidence": <integer 40-95>,
  "reasoning": "<2-3 paragraph expert analysis explaining the prediction, key factors, tactical considerations, and historical context>"
}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from Groq");

    const prediction = JSON.parse(content);

    const result = {
      winner: prediction.winner || teamA,
      scoreA: Math.max(0, Math.min(10, parseInt(prediction.scoreA) || 1)),
      scoreB: Math.max(0, Math.min(10, parseInt(prediction.scoreB) || 0)),
      confidence: Math.max(40, Math.min(95, parseInt(prediction.confidence) || 60)),
      reasoning: prediction.reasoning || "AI analysis unavailable.",
    };

    await supabase.from("api_cache").upsert({
      cache_key: cacheKey,
      data: result,
      updated_at: new Date().toISOString(),
    });

    return Response.json(result);
  } catch (error) {
    console.error("Predict API error:", error);
    return Response.json(
      { error: "Failed to generate prediction" },
      { status: 500 }
    );
  }
}

function buildStatsContext(
  teamA: string,
  teamB: string,
  statsA: Record<string, unknown> | null,
  statsB: Record<string, unknown> | null,
  h2h: unknown[]
): string {
  const lines: string[] = [`Match: ${teamA} vs ${teamB} — FIFA World Cup 2026`];

  if (statsA) {
    const fixtures = statsA.fixtures as { played?: { total: number }; wins?: { total: number }; draws?: { total: number }; loses?: { total: number } };
    const goals = statsA.goals as { for?: { average?: { total: string } }; against?: { average?: { total: string } } };
    lines.push(`\n${teamA} Stats:`);
    lines.push(`  - Form: ${statsA.form || "N/A"}`);
    lines.push(`  - Played: ${fixtures?.played?.total ?? "N/A"}, W: ${fixtures?.wins?.total ?? "N/A"}, D: ${fixtures?.draws?.total ?? "N/A"}, L: ${fixtures?.loses?.total ?? "N/A"}`);
    lines.push(`  - Avg goals scored: ${goals?.for?.average?.total ?? "N/A"}`);
    lines.push(`  - Avg goals conceded: ${goals?.against?.average?.total ?? "N/A"}`);
  } else {
    lines.push(`\n${teamA}: No detailed stats available — use general football knowledge`);
  }

  if (statsB) {
    const fixtures = statsB.fixtures as { played?: { total: number }; wins?: { total: number }; draws?: { total: number }; loses?: { total: number } };
    const goals = statsB.goals as { for?: { average?: { total: string } }; against?: { average?: { total: string } } };
    lines.push(`\n${teamB} Stats:`);
    lines.push(`  - Form: ${statsB.form || "N/A"}`);
    lines.push(`  - Played: ${fixtures?.played?.total ?? "N/A"}, W: ${fixtures?.wins?.total ?? "N/A"}, D: ${fixtures?.draws?.total ?? "N/A"}, L: ${fixtures?.loses?.total ?? "N/A"}`);
    lines.push(`  - Avg goals scored: ${goals?.for?.average?.total ?? "N/A"}`);
    lines.push(`  - Avg goals conceded: ${goals?.against?.average?.total ?? "N/A"}`);
  } else {
    lines.push(`\n${teamB}: No detailed stats available — use general football knowledge`);
  }

  if (h2h.length > 0) {
    lines.push(`\nHead-to-Head (last ${h2h.length} meetings):`);
    (h2h as Array<{ teams: { home: { name: string }; away: { name: string } }; goals: { home: number; away: number }; fixture: { date: string } }>).forEach((match) => {
      lines.push(
        `  ${match.teams.home.name} ${match.goals.home}-${match.goals.away} ${match.teams.away.name} (${match.fixture.date.slice(0, 10)})`
      );
    });
  }

  return lines.join("\n");
}
