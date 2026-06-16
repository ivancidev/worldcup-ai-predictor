import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// Groq rate limits are per model, so a secondary model keeps its own quota
// even when the primary one is exhausted.
const MODEL_CHAIN = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"] as const;

// The model converges on the single most likely scoreline no matter the
// temperature, so the variety comes from here: each request rolls a match
// scenario and the AI builds its analysis around it. Weights keep results
// realistic — the favorite still wins most of the time.
const SCENARIOS: { weight: number; hint: string }[] = [
  { weight: 30, hint: "the stronger team wins by a narrow one-goal margin" },
  { weight: 20, hint: "the stronger team wins comfortably by two or more goals" },
  { weight: 20, hint: "the match ends in a draw" },
  { weight: 15, hint: "the underdog pulls off a surprise win" },
  { weight: 15, hint: "an open, high-scoring match where both teams score" },
];

function pickScenario(): string {
  const total = SCENARIOS.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * total;
  for (const scenario of SCENARIOS) {
    roll -= scenario.weight;
    if (roll <= 0) return scenario.hint;
  }
  return SCENARIOS[0].hint;
}

function isRecoverableGroqError(error: unknown): boolean {
  if (!(error instanceof Groq.APIError)) return false;
  const status = error.status ?? 0;
  // 429: rate limit / quota exhausted; 400/404: model decommissioned; 5xx: service down
  return status === 429 || status === 400 || status === 404 || status >= 500;
}

async function createCompletionWithFallback(
  groq: Groq,
  messages: Groq.Chat.ChatCompletionMessageParam[]
) {
  let lastError: unknown;
  for (const model of MODEL_CHAIN) {
    try {
      return await groq.chat.completions.create({
        model,
        messages,
        // High temperature on purpose: re-running the same matchup should
        // produce visibly different analyses, not a repeated answer.
        temperature: 0.9,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      });
    } catch (error) {
      if (!isRecoverableGroqError(error)) throw error;
      console.warn(`Groq model ${model} failed, trying next in chain:`, error);
      lastError = error;
    }
  }
  throw lastError;
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
    const { teamA, teamB, teamAId, teamBId, locale } = body;

    if (!teamA || !teamB) {
      return Response.json({ error: "teamA and teamB are required" }, { status: 400 });
    }

    const supabase = await createClient();
    // Key the cache by matchup and locale, never by matchId alone: bracket slot ids like
    // "f-0" are shared by every user, and the same slot holds different teams
    // depending on each user's bracket.
    const slug = (name: string) =>
      name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const activeLocale = locale === "es" ? "es" : "en";
    const cacheKey = `predict_${activeLocale}_${slug(teamA)}_vs_${slug(teamB)}`;

    // The cached prediction is only a fallback for when every Groq model
    // fails — each request gets a fresh AI analysis so results can vary.
    const { data: cached } = await supabase
      .from("api_cache")
      .select("data, updated_at")
      .eq("cache_key", cacheKey)
      .single();

    const [statsA, statsB, h2h] = await Promise.all([
      teamAId ? fetchTeamStats(teamAId) : null,
      teamBId ? fetchTeamStats(teamBId) : null,
      teamAId && teamBId ? fetchH2H(teamAId, teamBId) : [],
    ]);

    const statsContext = buildStatsContext(teamA, teamB, statsA, statsB, h2h);

    const groq = getGroqClient();
    const isSpanish = locale === "es";
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a world-class football analyst specializing in FIFA World Cup predictions.
You analyze team statistics, head-to-head records, current form, and tactical matchups to provide expert predictions.
Always respond with valid JSON only, no markdown or extra text.
${isSpanish ? "IMPORTANT: You MUST write the 'reasoning' analysis in Spanish." : ""}`,
      },
      {
        role: "user",
        content: `Analyze this FIFA World Cup 2026 match and predict the result.

${statsContext}

Scenario to explore in this analysis: ${pickScenario()}.
Build your prediction and reasoning around this scenario, choosing a realistic scoreline that fits it. Only if the scenario is completely implausible for these two teams, pick the nearest realistic alternative. Do not mention the scenario instruction in your reasoning.

Respond with this exact JSON structure:
{
  "winner": "${teamA} or ${teamB} or Draw",
  "scoreA": <integer score for ${teamA}>,
  "scoreB": <integer score for ${teamB}>,
  "confidence": <integer 40-95>,
  "reasoning": "<2-3 paragraph expert analysis explaining the prediction, key factors, tactical considerations, and historical context>${isSpanish ? " (written in Spanish)" : ""}"
}`,
      },
    ];

    let completion: Groq.Chat.ChatCompletion;
    try {
      completion = await createCompletionWithFallback(groq, messages);
    } catch (error) {
      console.error("All Groq models failed:", error);
      // A stale prediction beats no prediction.
      if (cached) {
        return Response.json({ ...cached.data, cached: true, stale: true });
      }
      if (error instanceof Groq.APIError && error.status === 429) {
        return Response.json(
          { error: isSpanish ? "El servicio de IA está saturado en este momento. Inténtelo de nuevo en unos minutos." : "AI service is at capacity right now — please try again in a few minutes." },
          { status: 429 }
        );
      }
      throw error;
    }

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from Groq");

    const prediction = JSON.parse(content);

    const result = {
      winner: prediction.winner || teamA,
      scoreA: Math.max(0, Math.min(10, parseInt(prediction.scoreA) || 1)),
      scoreB: Math.max(0, Math.min(10, parseInt(prediction.scoreB) || 0)),
      confidence: Math.max(40, Math.min(95, parseInt(prediction.confidence) || 60)),
      reasoning: prediction.reasoning || (isSpanish ? "El análisis de la IA no está disponible." : "AI analysis unavailable."),
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
