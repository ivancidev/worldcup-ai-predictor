"use client";

import { useState, use, useEffect, useCallback } from "react";
import Link from "next/link";
import { AIPrediction, Fixture, Prediction } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FlagImage } from "@/components/ui/FlagImage";
import { getConfidenceLabel } from "@/lib/utils";
import {
  parseGroupMatchId,
  getFlagUrl,
  groupMatchIdToNumber,
} from "@/lib/world-cup-data";
import { formatMatchDateTime, getBrowserTimezone } from "@/lib/timezone";
import { isLive, isFinished } from "@/lib/fixture-status";
import { createClient } from "@/lib/supabase/client";
import {
  Bot,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Save,
  Trophy,
  CalendarClock,
} from "lucide-react";
import { DownloadPredictionCard } from "@/components/share/DownloadPredictionCard";
import { useTranslation, getTranslatedTeamName } from "@/lib/i18n/context";

interface PredictPageProps {
  params: Promise<{ matchId: string }>;
}

export default function PredictPage({ params }: PredictPageProps) {
  const { matchId } = use(params);
  const parsed = parseGroupMatchId(matchId);
  const { t } = useTranslation();

  if (!parsed) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#e8eaf0] mb-2">{t("predict.matchNotFound")}</p>
          <p className="text-[#8899bb] mb-6">
            {t("predict.matchNotFoundSub")}
          </p>
          <Link
            href="/groups"
            className="inline-flex items-center gap-2 px-6 py-3 font-bold bg-gradient-to-r from-[#f5c518] to-[#c9a000] text-[#080b14] rounded-xl hover:from-[#ffd54f] hover:to-[#f5c518] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("predict.backToGroupsBtn")}
          </Link>
        </div>
      </div>
    );
  }

  return <MatchPredict matchId={matchId} parsed={parsed} />;
}

function MatchPredict({
  matchId,
  parsed,
}: {
  matchId: string;
  parsed: NonNullable<ReturnType<typeof parseGroupMatchId>>;
}) {
  const { group, home, away } = parsed;
  const { t, locale } = useTranslation();

  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [aiPred, setAiPred] = useState<AIPrediction | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [tz, setTz] = useState("UTC");

  // Resolve kickoff time + status from the group-stage fixtures
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTz(getBrowserTimezone());
    let active = true;
    fetch("/api/fixtures?round=Group Stage")
      .then((r) => r.json())
      .then((json) => {
        if (!active || !Array.isArray(json.data)) return;
        const f = (json.data as Fixture[]).find(
          (fx) =>
            (fx.homeTeam.name === home.name && fx.awayTeam.name === away.name) ||
            (fx.homeTeam.name === away.name && fx.awayTeam.name === home.name)
        );
        if (f) setFixture(f);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [home.name, away.name]);

  // Load any previously saved prediction for this match
  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", user.id)
        .eq("match_id", groupMatchIdToNumber(matchId))
        .maybeSingle();
      if (active && data) {
        const pred = data as Prediction;
        setScoreA(String(pred.score_a));
        setScoreB(String(pred.score_b));
        setSaved(true);
        setPredictionId(pred.id);
      }
    })();
    return () => {
      active = false;
    };
  }, [matchId]);

  const onScore = (setter: (v: string) => void) => (raw: string) => {
    const clean = raw.replace(/[^0-9]/g, "").slice(0, 2);
    setter(clean);
    setSaved(false);
    setShareSlug(null);
  };

  const handleAIPredict = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA: home.name, teamB: away.name, matchId, locale }),
      });
      const data: AIPrediction = await res.json();
      setAiPred(data);
      setScoreA(String(data.scoreA));
      setScoreB(String(data.scoreB));
      setSaved(false);
      setShareSlug(null);
    } catch {
      /* ignore */
    }
    setAiLoading(false);
  }, [home.name, away.name, matchId, locale]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const a = parseInt(scoreA || "0", 10);
    const b = parseInt(scoreB || "0", 10);
    const winner = a > b ? home.name : a < b ? away.name : "Draw";

    const { data: pred } = await supabase
      .from("predictions")
      .upsert(
        {
          user_id: user.id,
          match_id: groupMatchIdToNumber(matchId),
          score_a: a,
          score_b: b,
          winner,
          ai_reasoning: aiPred?.reasoning ?? "",
          home_team: home.name,
          away_team: away.name,
        },
        { onConflict: "user_id,match_id" }
      )
      .select()
      .single();

    if (pred) {
      setSaved(true);
      setPredictionId(pred.id);
    }
    setSaving(false);
  }, [scoreA, scoreB, home.name, away.name, matchId, aiPred]);

  const handleShare = useCallback(async () => {
    if (!predictionId) return;
    setSharing(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictionId }),
      });
      const data = await res.json();
      setShareSlug(data.slug);
    } catch {
      /* ignore */
    }
    setSharing(false);
  }, [predictionId]);

  const shareUrl = shareSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareSlug}`
    : "";

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const live = fixture ? isLive(fixture.status) : false;
  const finished = fixture ? isFinished(fixture.status) : false;
  const kickoff = fixture ? formatMatchDateTime(fixture.timestamp, tz, locale) : null;
  const a = parseInt(scoreA || "0", 10);
  const b = parseInt(scoreB || "0", 10);
  const winnerName = a > b ? home.name : a < b ? away.name : "Draw";

  const homeNameTr = getTranslatedTeamName(home.name, locale);
  const awayNameTr = getTranslatedTeamName(away.name, locale);
  const winnerNameTr = winnerName === "Draw" ? t("predict.draw") : getTranslatedTeamName(winnerName, locale);

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-6 sm:py-8">
      <div className="max-w-xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[#8899bb] hover:text-[#e8eaf0] text-sm mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("predict.backToDashboardBtn")}
        </Link>

        {/* ── Match header ── */}
        <div className="rounded-2xl bg-[#0e1220] border border-[#1e2640] overflow-hidden mb-5">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-3 border-b border-[#1e2640] bg-[#141928]">
            <Badge variant="gold">{t("groups.groupLabel", { group })}</Badge>
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#8899bb] whitespace-nowrap">
              {live ? (
                <span className="flex items-center gap-1 text-[#22c55e] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  {t("predict.inPlay")}
                </span>
              ) : (
                <>
                  <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                  {kickoff ?? t("predict.scheduleTbd")}
                  {finished && <span className="text-[#4a5570]">· {t("predict.played")}</span>}
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 py-5 sm:py-6">
            {/* Home */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <FlagImage
                src={getFlagUrl(home.flagCode, 80)}
                alt={homeNameTr}
                cdnSize={80}
                className="w-12 h-8 sm:w-16 sm:h-11 object-cover rounded-md shadow-lg"
              />
              <span className="text-xs sm:text-sm font-bold text-[#e8eaf0] text-center leading-tight break-words">
                {homeNameTr}
              </span>
            </div>

            {/* Score inputs */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <ScoreInput value={scoreA} onChange={onScore(setScoreA)} />
              <span className="text-[#2d3a5a] font-black text-base sm:text-lg">—</span>
              <ScoreInput value={scoreB} onChange={onScore(setScoreB)} />
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <FlagImage
                src={getFlagUrl(away.flagCode, 80)}
                alt={awayNameTr}
                cdnSize={80}
                className="w-12 h-8 sm:w-16 sm:h-11 object-cover rounded-md shadow-lg"
              />
              <span className="text-xs sm:text-sm font-bold text-[#e8eaf0] text-center leading-tight break-words">
                {awayNameTr}
              </span>
            </div>
          </div>

          {(scoreA !== "" || scoreB !== "") && (
            <div className="flex items-center justify-center gap-2 px-3 sm:px-5 py-3 border-t border-[#1e2640] bg-[#0c101d]">
              <Trophy className="w-3.5 h-3.5 text-[#f5c518]" />
              <span className="text-xs text-[#8899bb]">
                {t("predict.yourPick")}{" "}
                <span className="font-bold text-[#f5c518]">
                  {winnerNameTr}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-5">
          <Button
            variant="secondary"
            size="lg"
            loading={aiLoading}
            onClick={handleAIPredict}
            className="flex-1"
          >
            <Bot className="w-4 h-4" />
            {t("predict.aiBtn")}
          </Button>
          <Button
            variant="gold"
            size="lg"
            loading={saving}
            onClick={handleSave}
            className="flex-1"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? t("predict.savedBtn") : t("predict.saveBtn")}
          </Button>
        </div>

        {/* ── AI reasoning ── */}
        {aiPred && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0e1220] border border-[#1e2640] mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#f5c518]">
                <Bot className="w-4 h-4" /> {t("predict.aiAnalysis")}
              </span>
              <Badge
                variant={
                  aiPred.confidence >= 70
                    ? "green"
                    : aiPred.confidence >= 50
                      ? "gold"
                      : "red"
                }
              >
                {aiPred.confidence}% {getConfidenceLabel(aiPred.confidence, locale)}
              </Badge>
            </div>
            <p className="text-[#8899bb] text-sm leading-relaxed whitespace-pre-wrap">
              {aiPred.reasoning}
            </p>
          </div>
        )}

        {/* ── Share ── */}
        {saved && !shareSlug && (
          <Button
            variant="ghost"
            size="lg"
            loading={sharing}
            onClick={handleShare}
            className="w-full border border-[#1e2640]"
          >
            <Share2 className="w-4 h-4" />
            {t("predict.shareBtn")}
          </Button>
        )}

        {shareSlug && (
          <div className="p-4 rounded-2xl bg-[#0e1220] border border-[#22c55e40]">
            <p className="text-sm font-semibold text-[#22c55e] mb-3 flex items-center gap-2">
              <Check className="w-4 h-4" /> {t("predict.readyToShare")}
            </p>
            <div className="flex gap-2">
              <input
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg bg-[#141928] border border-[#1e2640] text-[#8899bb] text-sm"
              />
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e2640] border border-[#2d3a5a] text-[#8899bb] hover:text-[#e8eaf0] text-sm font-medium transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[#22c55e]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? t("predict.copied") : t("predict.copy")}
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  locale === "es"
                    ? `Mi predicción para ${homeNameTr} vs ${awayNameTr} en el Mundial 2026: ${a}-${b} ${shareUrl}`
                    : `My AI prediction for ${home.name} vs ${away.name} at WC2026: ${a}-${b} ${shareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#1da1f220] border border-[#1da1f230] text-[#1da1f2] text-sm font-medium hover:bg-[#1da1f230] transition-colors cursor-pointer"
              >
                <span className="font-black text-sm">𝕏</span> {locale === "es" ? "Twitter" : "Twitter"}
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  locale === "es"
                    ? `Mi predicción para el Mundial 2026: ${homeNameTr} ${a}-${b} ${awayNameTr} ${shareUrl}`
                    : `My WC2026 prediction: ${home.name} ${a}-${b} ${away.name} ${shareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#25d36620] border border-[#25d36630] text-[#25d366] text-sm font-medium hover:bg-[#25d36630] transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> {locale === "es" ? "WhatsApp" : "WhatsApp"}
              </a>
            </div>
            <DownloadPredictionCard
              teamA={homeNameTr}
              teamB={awayNameTr}
              scoreA={a}
              scoreB={b}
              winner={winnerNameTr}
              confidence={aiPred?.confidence ?? 0}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => e.target.select()}
      placeholder="0"
      maxLength={2}
      className="w-12 h-12 sm:w-14 sm:h-14 text-center text-2xl sm:text-3xl font-black rounded-xl bg-[#141928] border border-[#1e2640] text-[#f5c518] placeholder-[#2d3a5a] focus:outline-none focus:border-[#f5c518] transition-colors cursor-text"
    />
  );
}
