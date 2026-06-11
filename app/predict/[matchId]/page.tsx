"use client";

import { useState, use } from "react";
import { AIPrediction } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getConfidenceLabel } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Bot, ArrowLeft, Share2, Copy, Check } from "lucide-react";

interface PredictPageProps {
  params: Promise<{ matchId: string }>;
}

export default function PredictPage({ params }: PredictPageProps) {
  const { matchId } = use(params);

  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePredict = async () => {
    if (!teamA || !teamB) { setError("Enter both team names"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA, teamB, matchId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrediction(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndShare = async () => {
    if (!prediction) return;
    setSharing(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const winner = prediction.scoreA > prediction.scoreB ? teamA : prediction.scoreA < prediction.scoreB ? teamB : "Draw";
      const matchIdNum = parseInt(matchId.replace(/\D/g, "").padEnd(8, "0").slice(0, 8));

      const { data: pred } = await supabase.from("predictions").upsert({
        user_id: user.id, match_id: matchIdNum,
        score_a: prediction.scoreA, score_b: prediction.scoreB,
        winner, ai_reasoning: prediction.reasoning,
        home_team: teamA, away_team: teamB,
      }, { onConflict: "user_id,match_id" }).select().single();

      if (pred) {
        const shareRes = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ predictionId: pred.id }),
        });
        const shareData = await shareRes.json();
        setShareSlug(shareData.slug);
      }
    } finally {
      setSharing(false);
    }
  };

  const copyLink = async () => {
    if (!shareSlug) return;
    await navigator.clipboard.writeText(`${window.location.origin}/share/${shareSlug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = shareSlug ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareSlug}` : "";

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-12">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <Link href="/groups" className="inline-flex items-center gap-1.5 text-[#8899bb] hover:text-[#e8eaf0] text-sm mb-4 transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Groups
          </Link>
          <h1 className="text-3xl font-black text-[#e8eaf0] mb-2">AI Match Prediction</h1>
          <p className="text-[#8899bb]">Enter two teams and get an AI-powered prediction with reasoning.</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#8899bb] mb-1.5">Team A (Home)</label>
            <input
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              placeholder="e.g. Brazil"
              className="w-full px-4 py-3 rounded-xl bg-[#0e1220] border border-[#1e2640] text-[#e8eaf0] placeholder-[#4a5570] focus:outline-none focus:border-[#f5c518] transition-colors cursor-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8899bb] mb-1.5">Team B (Away)</label>
            <input
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              placeholder="e.g. Argentina"
              className="w-full px-4 py-3 rounded-xl bg-[#0e1220] border border-[#1e2640] text-[#e8eaf0] placeholder-[#4a5570] focus:outline-none focus:border-[#f5c518] transition-colors cursor-text"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#ef444415] border border-[#ef444430] text-[#ef4444] text-sm">{error}</div>
          )}

          <Button variant="gold" size="lg" loading={loading} onClick={handlePredict} className="w-full">
            <Bot className="w-4 h-4" />
            Generate AI Prediction
          </Button>
        </div>

        {prediction && (
          <div className="space-y-5">
            <div className="p-6 rounded-2xl bg-[#0e1220] border border-[#1e2640]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1">
                  <div className="text-xl font-black text-[#e8eaf0] mb-1">{teamA}</div>
                  <div className="text-5xl font-black text-[#f5c518]">{prediction.scoreA}</div>
                </div>
                <div className="text-[#4a5570] font-bold text-xl px-4">—</div>
                <div className="text-center flex-1">
                  <div className="text-xl font-black text-[#e8eaf0] mb-1">{teamB}</div>
                  <div className="text-5xl font-black text-[#f5c518]">{prediction.scoreB}</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-[#1e2640]">
                <Badge variant="gold">Winner: {prediction.winner}</Badge>
                <Badge variant={prediction.confidence >= 70 ? "green" : prediction.confidence >= 50 ? "gold" : "red"}>
                  {prediction.confidence}% {getConfidenceLabel(prediction.confidence)}
                </Badge>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0e1220] border border-[#1e2640]">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-[#f5c518]" />
                <span className="text-sm font-semibold text-[#f5c518]">AI Analysis</span>
                <Badge variant="gold">AI Prediction</Badge>
              </div>
              <p className="text-[#8899bb] text-sm leading-relaxed whitespace-pre-wrap">{prediction.reasoning}</p>
            </div>

            {!shareSlug ? (
              <Button variant="secondary" size="lg" loading={sharing} onClick={handleSaveAndShare} className="w-full">
                <Share2 className="w-4 h-4" />
                Save &amp; Share Prediction
              </Button>
            ) : (
              <div className="p-4 rounded-2xl bg-[#0e1220] border border-[#22c55e40]">
                <p className="text-sm font-semibold text-[#22c55e] mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Saved! Share it:
                </p>
                <div className="flex gap-2">
                  <input value={shareUrl} readOnly className="flex-1 px-3 py-2 rounded-lg bg-[#141928] border border-[#1e2640] text-[#8899bb] text-sm cursor-text" />
                  <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e2640] border border-[#2d3a5a] text-[#8899bb] hover:text-[#e8eaf0] text-sm font-medium transition-colors cursor-pointer">
                    {copied ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <a
                    href={`https://twitter.com/intent/tweet?text=My+AI+prediction+for+${encodeURIComponent(teamA)}+vs+${encodeURIComponent(teamB)}+at+WC2026:+${prediction.scoreA}-${prediction.scoreB}+${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#1da1f220] border border-[#1da1f230] text-[#1da1f2] text-sm font-medium hover:bg-[#1da1f230] transition-colors cursor-pointer"
                  >
                    <span className="font-black text-sm">𝕏</span> Twitter
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`My WC2026 prediction: ${teamA} ${prediction.scoreA}-${prediction.scoreB} ${teamB} ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#25d36620] border border-[#25d36630] text-[#25d366] text-sm font-medium hover:bg-[#25d36630] transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
