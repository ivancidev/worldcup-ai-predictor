import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Bot, Trophy, ArrowRight } from "lucide-react";

interface SharePageProps {
  params: Promise<{ predictionId: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { predictionId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("shared_predictions")
    .select("*, prediction:predictions(*)")
    .eq("slug", predictionId)
    .single();

  if (!data?.prediction) return { title: "Prediction not found — WC2026 Predictor" };

  const { home_team, away_team, score_a, score_b } = data.prediction as {
    home_team: string; away_team: string; score_a: number; score_b: number;
  };
  const title = `${home_team} ${score_a}–${score_b} ${away_team} | WC2026 AI Prediction`;

  return {
    title,
    description: `AI-powered World Cup 2026 prediction: ${home_team} vs ${away_team}`,
    openGraph: { title, description: `${home_team} ${score_a}–${score_b} ${away_team} — AI prediction for WC2026`, type: "website" },
    twitter: { card: "summary", title, description: `${home_team} ${score_a}–${score_b} ${away_team} — WC2026 AI Prediction` },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { predictionId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("shared_predictions")
    .select(`*, prediction:predictions(*, user:users(username))`)
    .eq("slug", predictionId)
    .single();

  if (!data?.prediction) notFound();

  const pred = data.prediction as {
    home_team: string; away_team: string; score_a: number; score_b: number;
    winner: string; ai_reasoning: string; confidence: number; created_at: string;
    user?: { username: string };
  };

  const confidence = pred.confidence || 60;
  const formattedDate = new Date(pred.created_at).toLocaleDateString(undefined, {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-12">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5c51815] border border-[#f5c51830] text-[#f5c518] text-sm mb-4">
            <Trophy className="w-4 h-4" />
            WC2026 AI Prediction
          </div>
          <h1 className="text-2xl font-black text-[#e8eaf0]">{pred.home_team} vs {pred.away_team}</h1>
          {pred.user?.username && (
            <p className="text-[#8899bb] text-sm mt-1">
              by <span className="text-[#f5c518]">{pred.user.username}</span>
            </p>
          )}
          <p className="text-[#4a5570] text-xs mt-1">{formattedDate}</p>
        </div>

        <div className="p-8 rounded-2xl bg-[#0e1220] border border-[#1e2640] mb-5">
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <div className="text-xl font-bold text-[#e8eaf0] mb-2">{pred.home_team}</div>
              <div className="text-6xl font-black text-[#f5c518]">{pred.score_a}</div>
            </div>
            <div className="text-[#4a5570] font-bold text-2xl px-4">—</div>
            <div className="text-center flex-1">
              <div className="text-xl font-bold text-[#e8eaf0] mb-2">{pred.away_team}</div>
              <div className="text-6xl font-black text-[#f5c518]">{pred.score_b}</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-[#1e2640]">
            <Badge variant="gold">Winner: {pred.winner}</Badge>
            <Badge variant={confidence >= 70 ? "green" : confidence >= 50 ? "gold" : "red"}>
              {confidence}% confidence
            </Badge>
          </div>
        </div>

        {pred.ai_reasoning && (
          <div className="p-5 rounded-2xl bg-[#0e1220] border border-[#1e2640] mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-[#f5c518]" />
              <span className="text-sm font-semibold text-[#f5c518]">AI Analysis</span>
              <Badge variant="gold">AI Prediction</Badge>
            </div>
            <p className="text-[#8899bb] text-sm leading-relaxed whitespace-pre-wrap">{pred.ai_reasoning}</p>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#f5c518] to-[#c9a000] text-[#080b14] font-bold hover:from-[#ffd54f] hover:to-[#f5c518] transition-all duration-300 active:scale-95 cursor-pointer"
          >
            Make your own predictions
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[#4a5570] text-xs mt-3">Free · No credit card needed</p>
        </div>
      </div>
    </div>
  );
}
