"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { WC2026_GROUPS, getFlagUrl, groupMatchIdToNumber } from "@/lib/world-cup-data";
import { usePredictionStore } from "@/lib/store";
import { AIPrediction, Prediction, Team, Fixture } from "@/lib/types";
import { Dialog } from "@/components/ui/Dialog";
import { FlagImage } from "@/components/ui/FlagImage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { Bot, CheckCircle, ArrowRight, Plus, Share2, Copy, Check } from "lucide-react";
import { formatMatchDateTime, getBrowserTimezone } from "@/lib/timezone";
import { DownloadPredictionCard } from "@/components/share/DownloadPredictionCard";

interface GroupsClientProps {
  userId: string;
  savedPredictions: Prediction[];
  /** Group letter (A-L) to pre-select, e.g. when arriving from the dashboard */
  initialGroup?: string;
}

interface MatchPrediction {
  homeScore: number;
  awayScore: number;
}

function findRealFixture(homeName: string, awayName: string, fixtures: Fixture[]): Fixture | undefined {
  return fixtures.find(
    (f) =>
      (f.homeTeam.name === homeName && f.awayTeam.name === awayName) ||
      (f.homeTeam.name === awayName && f.awayTeam.name === homeName)
  );
}

function calcGroupStandings(
  teams: Team[],
  group: string,
  predictions: Record<string, MatchPrediction>
) {
  const stats: Record<number, { team: Team; P: number; W: number; D: number; Pts: number; GF: number; GA: number }> = {};
  teams.forEach(t => { stats[t.id] = { team: t, P: 0, W: 0, D: 0, Pts: 0, GF: 0, GA: 0 }; });

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const id = `${group}-${i}-${j}`;
      const pred = predictions[id];
      if (pred === undefined) continue;
      const hg = pred.homeScore, ag = pred.awayScore;
      const hi = teams[i].id, ai = teams[j].id;
      stats[hi].P++; stats[ai].P++;
      stats[hi].GF += hg; stats[hi].GA += ag;
      stats[ai].GF += ag; stats[ai].GA += hg;
      if (hg > ag) { stats[hi].W++; stats[hi].Pts += 3; }
      else if (hg === ag) { stats[hi].Pts++; stats[hi].D++; stats[ai].Pts++; stats[ai].D++; }
      else { stats[ai].W++; stats[ai].Pts += 3; }
    }
  }
  return Object.values(stats).sort((a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA));
}

interface EditModal {
  matchId: string;
  home: Team;
  away: Team;
  homeScore: number;
  awayScore: number;
}

export default function GroupsClient({ userId, savedPredictions, initialGroup }: GroupsClientProps) {
  const { setGroupResult, setCompletedGroup } = usePredictionStore();
  const [localPredictions, setLocalPredictions] = useState<Record<string, MatchPrediction>>({});
  const [savedMatches, setSavedMatches] = useState<Set<string>>(new Set());
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>(initialGroup ?? "all");
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [realFixtures, setRealFixtures] = useState<Fixture[]>([]);
  const [fullPredictions, setFullPredictions] = useState<Record<string, Prediction>>({});
  const [shareModal, setShareModal] = useState<{
    open: boolean;
    matchId: string;
    homeTeam: Team | null;
    awayTeam: Team | null;
    loading: boolean;
    shareSlug: string | null;
  }>({ open: false, matchId: "", homeTeam: null, awayTeam: null, loading: false, shareSlug: null });
  const [shareCopied, setShareCopied] = useState(false);
  const [aiModal, setAiModal] = useState<{
    open: boolean;
    matchId: string;
    homeTeam: Team | null;
    awayTeam: Team | null;
    result?: AIPrediction;
    loading: boolean;
  }>({ open: false, matchId: "", homeTeam: null, awayTeam: null, loading: false });

  const handleOpenShareModal = async (matchId: string, homeTeam: Team, awayTeam: Team) => {
    const pred = fullPredictions[matchId];
    if (!pred) return;

    setShareModal({
      open: true,
      matchId,
      homeTeam,
      awayTeam,
      loading: true,
      shareSlug: null,
    });

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictionId: pred.id }),
      });
      const data = await res.json();
      setShareModal(prev => ({ ...prev, shareSlug: data.slug, loading: false }));
    } catch {
      setShareModal(prev => ({ ...prev, loading: false }));
    }
  };

  const copyShareLink = async () => {
    if (!shareModal.shareSlug) return;
    await navigator.clipboard.writeText(`${window.location.origin}/share/${shareModal.shareSlug}`);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Fetch real/static fixtures for group stage on mount
  useEffect(() => {
    fetch("/api/fixtures?round=Group Stage")
      .then((res) => res.json())
      .then((json) => {
        if (json && Array.isArray(json.data)) {
          setRealFixtures(json.data);
        }
      })
      .catch((err) => console.error("Error fetching group stage fixtures:", err));
  }, []);

  const [mounted, setMounted] = useState(false);
  const [userTz, setUserTz] = useState<string>("UTC");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserTz(getBrowserTimezone());
    setMounted(true);
  }, []);

  const checkGroupComplete = useCallback(
    (group: string, savedSet: Set<string>, predictions: Record<string, MatchPrediction>) => {
      const groupTeams = WC2026_GROUPS[group];
      if (!groupTeams) return;
      const ids: string[] = [];
      for (let i = 0; i < groupTeams.length; i++)
        for (let j = i + 1; j < groupTeams.length; j++)
          ids.push(`${group}-${i}-${j}`);
      if (!ids.every(id => savedSet.has(id))) return;
      const sorted = calcGroupStandings(groupTeams, group, predictions);
      setCompletedGroup(group, sorted.map(s => s.team));
    },
    [setCompletedGroup]
  );

  useEffect(() => {
    const predByTeams: Record<string, { score_a: number; score_b: number }> = {};
    savedPredictions.forEach(p => {
      if (p.home_team && p.away_team) {
        predByTeams[`${p.home_team}|${p.away_team}`] = { score_a: p.score_a, score_b: p.score_b };
        predByTeams[`${p.away_team}|${p.home_team}`] = { score_a: p.score_a, score_b: p.score_b };
      }
    });

    const initial: Record<string, MatchPrediction> = {};
    const saved = new Set<string>();
    const fullPredMap: Record<string, Prediction> = {};

    Object.entries(WC2026_GROUPS).forEach(([group, teams]) => {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const key = `${group}-${i}-${j}`;
          const pred = predByTeams[`${teams[i].name}|${teams[j].name}`];
          if (pred) {
            initial[key] = { homeScore: pred.score_a, awayScore: pred.score_b };
            saved.add(key);
            setGroupResult(key, {
              matchId: key,
              homeScore: pred.score_a,
              awayScore: pred.score_b,
              homeTeam: teams[i],
              awayTeam: teams[j],
            });

            const dbRecord = savedPredictions.find(
              (p) =>
                (p.home_team === teams[i].name && p.away_team === teams[j].name) ||
                (p.home_team === teams[j].name && p.away_team === teams[i].name)
            );
            if (dbRecord) {
              fullPredMap[key] = dbRecord;
            }
          }
        }
      }
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalPredictions(initial);
    setSavedMatches(saved);
    setFullPredictions(fullPredMap);
    Object.keys(WC2026_GROUPS).forEach(g => checkGroupComplete(g, saved, initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPredictions]);

  const saveMatch = async (
    matchId: string,
    homeTeam: Team,
    awayTeam: Team,
    homeScore: number,
    awayScore: number,
    aiReasoning?: string
  ) => {
    setSavingMatch(matchId);
    const supabase = createClient();
    const matchIdNum = groupMatchIdToNumber(matchId);
    const winner = homeScore > awayScore ? homeTeam.name : homeScore < awayScore ? awayTeam.name : "Draw";

    const { data: pred, error } = await supabase.from("predictions").upsert({
      user_id: userId,
      match_id: matchIdNum,
      score_a: homeScore,
      score_b: awayScore,
      winner,
      ai_reasoning: aiReasoning ?? "",
      home_team: homeTeam.name,
      away_team: awayTeam.name,
    }, { onConflict: "user_id,match_id" }).select().single();

    if (!error && pred) {
      const newPred = { homeScore, awayScore };
      const newSaved = new Set([...savedMatches, matchId]);
      const updatedPreds = { ...localPredictions, [matchId]: newPred };
      setSavedMatches(newSaved);
      setLocalPredictions(updatedPreds);
      setFullPredictions(prev => ({ ...prev, [matchId]: pred }));
      setGroupResult(matchId, { matchId, homeScore, awayScore, homeTeam, awayTeam });
      checkGroupComplete(matchId.split("-")[0], newSaved, updatedPreds);
    }
    setSavingMatch(null);
  };

  const openEditModal = (matchId: string, home: Team, away: Team) => {
    const pred = localPredictions[matchId];
    setEditModal({
      matchId, home, away,
      homeScore: pred?.homeScore ?? 0,
      awayScore: pred?.awayScore ?? 0,
    });
  };

  const handleAIPredict = async (matchId: string, homeTeam: Team, awayTeam: Team) => {
    setAiModal({ open: true, matchId, homeTeam, awayTeam, loading: true });
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA: homeTeam.name, teamB: awayTeam.name, matchId }),
      });
      const data: AIPrediction = await res.json();
      setAiModal(prev => ({ ...prev, result: data, loading: false }));
    } catch {
      setAiModal(prev => ({ ...prev, loading: false }));
    }
  };

  const groups = Object.entries(WC2026_GROUPS);
  const displayGroups = selectedGroup === "all" ? groups : groups.filter(([g]) => g === selectedGroup);

  return (
    <div>
      {/* Group filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedGroup("all")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            selectedGroup === "all"
              ? "bg-[#f5c518] text-[#080b14]"
              : "bg-[#1e2640] text-[#8899bb] hover:bg-[#2d3a5a] hover:text-[#e8eaf0]"
          }`}
        >
          All Groups
        </button>
        {groups.map(([group]) => (
          <button
            key={group}
            onClick={() => setSelectedGroup(group)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              selectedGroup === group
                ? "bg-[#f5c518] text-[#080b14]"
                : "bg-[#1e2640] text-[#8899bb] hover:bg-[#2d3a5a] hover:text-[#e8eaf0]"
            }`}
          >
            Group {group}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayGroups.map(([group, teams]) => (
          <GroupCard
            key={group}
            group={group}
            teams={teams}
            localPredictions={localPredictions}
            savedMatches={savedMatches}
            savingMatch={savingMatch}
            onOpenModal={openEditModal}
            onAIPredict={handleAIPredict}
            realFixtures={realFixtures}
            userTz={userTz}
            mounted={mounted}
            onShare={handleOpenShareModal}
          />
        ))}
      </div>

      {/* ── Edit Score Modal ── */}
      {editModal && (
        <Dialog
          open={true}
          onClose={() => setEditModal(null)}
          title={`${editModal.home.name} vs ${editModal.away.name}`}
          className="max-w-sm"
        >
          <div className="space-y-5">
            <div className="flex items-end justify-between gap-3 py-2">
              <div className="flex flex-col items-center gap-2 flex-1">
                <FlagImage
                  src={getFlagUrl(editModal.home.flagCode, 40)}
                  alt={editModal.home.name}
                  cdnSize={40}
                  className="w-12 h-8 object-cover rounded-md"
                />
                <p className="text-xs font-bold text-[#e8eaf0] text-center leading-tight max-w-[80px] truncate">
                  {editModal.home.name}
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(editModal.homeScore)}
                  autoFocus
                  onFocus={e => e.target.select()}
                  maxLength={2}
                  onChange={e => {
                    const c = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                    setEditModal(prev => prev
                      ? { ...prev, homeScore: c === "" ? 0 : Math.min(20, parseInt(c, 10)) }
                      : null);
                  }}
                  className="w-16 h-14 text-3xl font-black text-center text-[#f5c518] bg-[#141928] border-2 border-[#1e2640] rounded-xl focus:outline-none focus:border-[#f5c518] transition-colors cursor-text"
                />
              </div>

              <span className="text-2xl font-black text-[#2d3a5a] pb-3 shrink-0">—</span>

              <div className="flex flex-col items-center gap-2 flex-1">
                <FlagImage
                  src={getFlagUrl(editModal.away.flagCode, 40)}
                  alt={editModal.away.name}
                  cdnSize={40}
                  className="w-12 h-8 object-cover rounded-md"
                />
                <p className="text-xs font-bold text-[#e8eaf0] text-center leading-tight max-w-[80px] truncate">
                  {editModal.away.name}
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(editModal.awayScore)}
                  onFocus={e => e.target.select()}
                  maxLength={2}
                  onChange={e => {
                    const c = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                    setEditModal(prev => prev
                      ? { ...prev, awayScore: c === "" ? 0 : Math.min(20, parseInt(c, 10)) }
                      : null);
                  }}
                  className="w-16 h-14 text-3xl font-black text-center text-[#f5c518] bg-[#141928] border-2 border-[#1e2640] rounded-xl focus:outline-none focus:border-[#f5c518] transition-colors cursor-text"
                />
              </div>
            </div>

            <div className="text-center text-sm h-5">
              {editModal.homeScore > editModal.awayScore ? (
                <span className="text-[#22c55e] font-semibold">{editModal.home.name} wins</span>
              ) : editModal.homeScore < editModal.awayScore ? (
                <span className="text-[#22c55e] font-semibold">{editModal.away.name} wins</span>
              ) : (
                <span className="text-[#8899bb]">Draw</span>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setEditModal(null)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                loading={savingMatch === editModal.matchId}
                onClick={async () => {
                  const { matchId, home, away, homeScore, awayScore } = editModal;
                  await saveMatch(matchId, home, away, homeScore, awayScore);
                  setEditModal(null);
                }}
              >
                <CheckCircle className="w-4 h-4" /> Save
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ── AI Prediction Modal ── */}
      <Dialog
        open={aiModal.open}
        onClose={() => setAiModal(p => ({ ...p, open: false }))}
        title={`AI Prediction: ${aiModal.homeTeam?.name ?? ""} vs ${aiModal.awayTeam?.name ?? ""}`}
        className="max-w-xl"
      >
        {aiModal.loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 rounded-full border-2 border-[#f5c518] border-t-transparent animate-spin" />
            <p className="text-[#8899bb]">Analyzing match data...</p>
          </div>
        ) : aiModal.result ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#141928] border border-[#1e2640]">
              <div className="text-left">
                <div className="text-sm text-[#8899bb] mb-1">{aiModal.homeTeam?.name}</div>
                <div className="text-4xl font-black text-[#f5c518]">{aiModal.result.scoreA}</div>
              </div>
              <div className="text-center">
                <div className="text-[#4a5570] font-bold text-lg">—</div>
                <Badge
                  variant={aiModal.result.confidence >= 70 ? "green" : aiModal.result.confidence >= 50 ? "gold" : "red"}
                  className="mt-1"
                >
                  {aiModal.result.confidence}% conf.
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#8899bb] mb-1">{aiModal.awayTeam?.name}</div>
                <div className="text-4xl font-black text-[#f5c518]">{aiModal.result.scoreB}</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#141928] border border-[#1e2640]">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-[#f5c518]" />
                <span className="text-sm font-semibold text-[#f5c518]">AI Analysis</span>
                <Badge variant="gold">AI Prediction</Badge>
              </div>
              <p className="text-[#8899bb] text-sm leading-relaxed whitespace-pre-wrap">{aiModal.result.reasoning}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="gold"
                className="flex-1"
                loading={savingMatch === aiModal.matchId}
                onClick={async () => {
                  if (aiModal.result && aiModal.homeTeam && aiModal.awayTeam) {
                    await saveMatch(
                      aiModal.matchId,
                      aiModal.homeTeam,
                      aiModal.awayTeam,
                      aiModal.result.scoreA,
                      aiModal.result.scoreB,
                      aiModal.result.reasoning
                    );
                  }
                  setAiModal(p => ({ ...p, open: false }));
                }}
              >
                Use this prediction
              </Button>
              <Button variant="secondary" onClick={() => setAiModal(p => ({ ...p, open: false }))}>
                Dismiss
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[#ef4444] text-sm">Failed to generate prediction. Try again.</p>
        )}
      </Dialog>

      {/* ── Share / Export Modal ── */}
      <Dialog
        open={shareModal.open}
        onClose={() => setShareModal(p => ({ ...p, open: false }))}
        title={`Share Prediction: ${shareModal.homeTeam?.name ?? ""} vs ${shareModal.awayTeam?.name ?? ""}`}
        className="max-w-md"
      >
        {shareModal.loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 rounded-full border-2 border-[#f5c518] border-t-transparent animate-spin" />
            <p className="text-[#8899bb]">Generating share link...</p>
          </div>
        ) : shareModal.shareSlug ? (
          <div className="space-y-5">
            <p className="text-[#8899bb] text-sm">
              Your prediction is saved. Share the link or download a custom image card for social media:
            </p>
            <div className="flex gap-2">
              <input
                value={`${window.location.origin}/share/${shareModal.shareSlug}`}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg bg-[#141928] border border-[#1e2640] text-[#e8eaf0] text-sm cursor-text focus:outline-none"
              />
              <button
                onClick={copyShareLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e2640] border border-[#2d3a5a] text-[#8899bb] hover:text-[#e8eaf0] text-sm font-medium transition-colors cursor-pointer"
              >
                {shareCopied ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4" />}
                {shareCopied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="flex gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=My+prediction+for+${encodeURIComponent(shareModal.homeTeam?.name ?? "")}+vs+${encodeURIComponent(shareModal.awayTeam?.name ?? "")}+${encodeURIComponent(`${window.location.origin}/share/${shareModal.shareSlug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#1da1f220] border border-[#1da1f230] text-[#1da1f2] text-sm font-medium hover:bg-[#1da1f230] transition-colors cursor-pointer"
              >
                <span className="font-black text-sm">𝕏</span> Twitter
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`My prediction: ${shareModal.homeTeam?.name} vs ${shareModal.awayTeam?.name} ${window.location.origin}/share/${shareModal.shareSlug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#25d36620] border border-[#25d36630] text-[#25d366] text-sm font-medium hover:bg-[#25d36630] transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> WhatsApp
              </a>
            </div>

            <div className="pt-4 border-t border-[#1e2640]/50">
              {(() => {
                const pred = fullPredictions[shareModal.matchId];
                if (!pred) return null;
                return (
                  <DownloadPredictionCard
                    teamA={shareModal.homeTeam?.name ?? ""}
                    teamB={shareModal.awayTeam?.name ?? ""}
                    scoreA={pred.score_a}
                    scoreB={pred.score_b}
                    winner={pred.winner}
                    confidence={pred.confidence || 60}
                  />
                );
              })()}
            </div>
          </div>
        ) : (
          <p className="text-[#ef4444] text-sm">Failed to generate share link. Try again.</p>
        )}
      </Dialog>
    </div>
  );
}

function GroupCard({
  group, teams, localPredictions, savedMatches, savingMatch, onOpenModal, onAIPredict, realFixtures, userTz, mounted, onShare,
}: {
  group: string;
  teams: Team[];
  localPredictions: Record<string, MatchPrediction>;
  savedMatches: Set<string>;
  savingMatch: string | null;
  onOpenModal: (matchId: string, home: Team, away: Team) => void;
  onAIPredict: (matchId: string, homeTeam: Team, awayTeam: Team) => void;
  realFixtures: Fixture[];
  userTz: string;
  mounted: boolean;
  onShare: (matchId: string, home: Team, away: Team) => void;
}) {
  const matches = useMemo(() => {
    const m: Array<{ id: string; home: Team; away: Team }> = [];
    for (let i = 0; i < teams.length; i++)
      for (let j = i + 1; j < teams.length; j++)
        m.push({ id: `${group}-${i}-${j}`, home: teams[i], away: teams[j] });

    // Sort matches chronologically based on real/static fixture dates/times
    return m.sort((a, b) => {
      const fA = findRealFixture(a.home.name, a.away.name, realFixtures);
      const fB = findRealFixture(b.home.name, b.away.name, realFixtures);
      const tsA = fA ? fA.timestamp : 0;
      const tsB = fB ? fB.timestamp : 0;
      return tsA - tsB;
    });
  }, [group, teams, realFixtures]);

  const standings = useMemo(
    () => calcGroupStandings(teams, group, localPredictions),
    [teams, group, localPredictions]
  );

  const isComplete = useMemo(() => {
    return matches.every(m => savedMatches.has(m.id));
  }, [matches, savedMatches]);

  return (
    <div className="rounded-2xl bg-[#0e1220] border border-[#1e2640] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2640] bg-[#141928]">
        <div className="flex items-center gap-3">
          <h3 className="font-black text-[#e8eaf0] text-base">Group {group}</h3>
          {isComplete && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-[#22c55e] bg-[#22c55e15] border border-[#22c55e30] px-2 py-0.5 rounded-full uppercase tracking-wider">
              <CheckCircle className="w-2.5 h-2.5" /> Complete
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {teams.map(t => (
            <FlagImage key={t.id} src={getFlagUrl(t.flagCode, 20)} alt={t.name} cdnSize={20} className="w-6 h-4 object-cover rounded-sm" title={t.name} />
          ))}
        </div>
      </div>

      {/* Live standings */}
      <div className="px-5 py-3 border-b border-[#1e2640]">
        <div className="grid grid-cols-[1fr_28px_28px_28px_32px] gap-x-2 text-xs text-[#4a5570] mb-2 pr-1">
          <span>Team</span>
          <span className="text-center">P</span>
          <span className="text-center">W</span>
          <span className="text-center">D</span>
          <span className="text-center">Pts</span>
        </div>
        {standings.map((s, idx) => (
          <div
            key={s.team.id}
            className={`grid grid-cols-[1fr_28px_28px_28px_32px] gap-x-2 py-1.5 text-sm items-center ${idx < 2 ? "bg-[#f5c51808] -mx-2 px-2 rounded-lg" : ""}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-3 text-xs shrink-0 font-bold ${idx < 2 ? "text-[#f5c518]" : "text-[#4a5570]"}`}>{idx + 1}</span>
              <FlagImage src={getFlagUrl(s.team.flagCode, 20)} alt={s.team.name} cdnSize={20} className="w-6 h-4 object-cover rounded-sm shrink-0" />
              <span className="text-[#e8eaf0] truncate text-xs font-medium">{s.team.name}</span>
              {idx < 2 && <ArrowRight className="w-3 h-3 text-[#f5c51880] shrink-0" aria-label="Advances" />}
            </div>
            <span className="text-center text-[#8899bb] text-xs">{s.P}</span>
            <span className="text-center text-[#8899bb] text-xs">{s.W}</span>
            <span className="text-center text-[#8899bb] text-xs">{s.D}</span>
            <span className={`text-center font-bold text-xs ${s.Pts > 0 ? "text-[#f5c518]" : "text-[#4a5570]"}`}>{s.Pts}</span>
          </div>
        ))}
      </div>

      {/* Matches */}
      <div className="divide-y divide-[#1e2640]">
        {matches.map(match => {
          const pred = localPredictions[match.id];
          const isSaved = savedMatches.has(match.id);
          const isSaving = savingMatch === match.id;

          const f = findRealFixture(match.home.name, match.away.name, realFixtures);
          const live = f ? ["1H", "2H", "HT", "ET", "PEN"].includes(f.status.short) : false;
          const matchTimeStr = mounted && f ? formatMatchDateTime(f.timestamp, userTz) : "";

          return (
            <div key={match.id} className="px-4 py-3">
              {/* Match schedule date/time and live indicator */}
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[10px] font-bold text-[#4a5570]">
                  {matchTimeStr}
                </span>
                {live && (
                  <span className="flex items-center gap-1 text-[8px] font-black text-[#ef4444] bg-[#ef444410] border border-[#ef444425] px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                    ● Live
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2.5">
                <TeamPill team={match.home} />
                <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl bg-[#141928] border border-[#1e2640] min-w-[72px] justify-center">
                  <span className={`text-sm font-black w-4 text-center ${pred ? "text-[#f5c518]" : "text-[#2d3a5a]"}`}>
                    {pred ? pred.homeScore : "–"}
                  </span>
                  <span className="text-[#2d3a5a] text-xs font-bold">—</span>
                  <span className={`text-sm font-black w-4 text-center ${pred ? "text-[#f5c518]" : "text-[#2d3a5a]"}`}>
                    {pred ? pred.awayScore : "–"}
                  </span>
                </div>
                <TeamPill team={match.away} align="right" />
              </div>

              <div className="flex gap-2">
                <button
                  disabled={isSaving}
                  onClick={() => onOpenModal(match.id, match.home, match.away)}
                  className={`flex-grow flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 ${
                    isSaved
                      ? "bg-[#22c55e12] border border-[#22c55e25] text-[#22c55e] hover:bg-[#22c55e20]"
                      : "bg-[#1e2640] border border-[#2d3a5a] text-[#8899bb] hover:bg-[#2d3a5a] hover:text-[#e8eaf0]"
                  }`}
                >
                  {isSaving ? (
                    <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                  ) : isSaved ? (
                    <>
                      <CheckCircle className="w-3 h-3 shrink-0" />
                      <span className="font-black tracking-wider">
                        {pred?.homeScore ?? 0} – {pred?.awayScore ?? 0}
                      </span>
                      <span className="opacity-60">· Edit</span>
                    </>
                  ) : (
                    <><Plus className="w-3 h-3" /> Set Score</>
                  )}
                </button>
                <button
                  onClick={() => onAIPredict(match.id, match.home, match.away)}
                  className="flex-grow flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-[#f5c51810] border border-[#f5c51820] text-[#f5c518] hover:bg-[#f5c51820] transition-all cursor-pointer"
                >
                  <Bot className="w-3 h-3" /> AI Predict
                </button>
                {isSaved && (
                  <button
                    onClick={() => onShare(match.id, match.home, match.away)}
                    className="flex items-center justify-center p-1.5 rounded-lg bg-[#f5c51815] border border-[#f5c51830] text-[#f5c518] hover:bg-[#f5c51825] transition-all cursor-pointer shrink-0"
                    title="Share / Export Prediction"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamPill({ team, align = "left" }: { team: Team; align?: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${align === "right" ? "justify-end" : ""}`}>
      <FlagImage src={getFlagUrl(team.flagCode, 20)} alt={team.name} cdnSize={20} className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
      <span className="text-xs text-[#e8eaf0] truncate font-medium">{team.name}</span>
    </div>
  );
}
