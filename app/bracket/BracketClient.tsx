"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { usePredictionStore } from "@/lib/store";
import { getFlagUrl, WC2026_GROUPS } from "@/lib/world-cup-data";
import { Team, AIPrediction } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FireworksBackground } from "@/components/FireworksBackground";
import { Bot, Trophy, Search, Plus, X, Share2, Copy, HelpCircle, Users, Edit3, ChevronRight, Zap, Save } from "lucide-react";

const LS_KEY = "wc2026-bracket-slots";

interface BracketSlot {
  id: string;
  round: string;
  side: "left" | "right" | "center";
  subtitle?: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  winner: Team | null;
  scoreA: number | null;
  scoreB: number | null;
}

const ALL_TEAMS: Team[] = Object.values(WC2026_GROUPS).flat();

const LEFT_R32_LABELS  = ["A1×B2","B1×A2","C1×D2","D1×C2","E1×F2","F1×E2","A3×B3","C3×D3"];
const RIGHT_R32_LABELS = ["G1×H2","H1×G2","I1×J2","J1×I2","K1×L2","L1×K2","G3×H3","I3×J3"];

const GROUP_TO_R32: Record<string, Array<{ slotId: string; position: "home" | "away"; rank: number }>> = {
  A: [{ slotId: "l-r32-0", position: "home", rank: 0 }, { slotId: "l-r32-1", position: "away", rank: 1 }],
  B: [{ slotId: "l-r32-1", position: "home", rank: 0 }, { slotId: "l-r32-0", position: "away", rank: 1 }],
  C: [{ slotId: "l-r32-2", position: "home", rank: 0 }, { slotId: "l-r32-3", position: "away", rank: 1 }],
  D: [{ slotId: "l-r32-3", position: "home", rank: 0 }, { slotId: "l-r32-2", position: "away", rank: 1 }],
  E: [{ slotId: "l-r32-4", position: "home", rank: 0 }, { slotId: "l-r32-5", position: "away", rank: 1 }],
  F: [{ slotId: "l-r32-5", position: "home", rank: 0 }, { slotId: "l-r32-4", position: "away", rank: 1 }],
  G: [{ slotId: "r-r32-0", position: "home", rank: 0 }, { slotId: "r-r32-1", position: "away", rank: 1 }],
  H: [{ slotId: "r-r32-1", position: "home", rank: 0 }, { slotId: "r-r32-0", position: "away", rank: 1 }],
  I: [{ slotId: "r-r32-2", position: "home", rank: 0 }, { slotId: "r-r32-3", position: "away", rank: 1 }],
  J: [{ slotId: "r-r32-3", position: "home", rank: 0 }, { slotId: "r-r32-2", position: "away", rank: 1 }],
  K: [{ slotId: "r-r32-4", position: "home", rank: 0 }, { slotId: "r-r32-5", position: "away", rank: 1 }],
  L: [{ slotId: "r-r32-5", position: "home", rank: 0 }, { slotId: "r-r32-4", position: "away", rank: 1 }],
};

function makeSlot(id: string, round: string, side: "left" | "right" | "center", subtitle?: string): BracketSlot {
  return { id, round, side, subtitle, homeTeam: null, awayTeam: null, winner: null, scoreA: null, scoreB: null };
}

function buildInitialBracket(): BracketSlot[] {
  const s: BracketSlot[] = [];
  for (let i = 0; i < 8; i++) s.push(makeSlot(`l-r32-${i}`, "Round of 32",  "left",  LEFT_R32_LABELS[i]));
  for (let i = 0; i < 4; i++) s.push(makeSlot(`l-r16-${i}`, "Round of 16",  "left"));
  for (let i = 0; i < 2; i++) s.push(makeSlot(`l-qf-${i}`,  "Quarterfinal", "left"));
  s.push(makeSlot("l-sf-0", "Semifinal", "left"));
  s.push(makeSlot("f-0",    "Final",     "center"));
  s.push(makeSlot("r-sf-0", "Semifinal", "right"));
  for (let i = 0; i < 2; i++) s.push(makeSlot(`r-qf-${i}`,  "Quarterfinal", "right"));
  for (let i = 0; i < 4; i++) s.push(makeSlot(`r-r16-${i}`, "Round of 16",  "right"));
  for (let i = 0; i < 8; i++) s.push(makeSlot(`r-r32-${i}`, "Round of 32",  "right", RIGHT_R32_LABELS[i]));
  return s;
}

function getNextSlot(slotId: string): { nextId: string; position: "home" | "away" } | null {
  const lm = slotId.match(/^l-(r32|r16|qf|sf)-(\d+)$/);
  if (lm) {
    const [, round, idxS] = lm;
    const idx = parseInt(idxS);
    if (round === "sf") return { nextId: "f-0", position: "home" };
    const next: Record<string, string> = { r32: "r16", r16: "qf", qf: "sf" };
    return { nextId: `l-${next[round]}-${Math.floor(idx / 2)}`, position: idx % 2 === 0 ? "home" : "away" };
  }
  const rm = slotId.match(/^r-(r32|r16|qf|sf)-(\d+)$/);
  if (rm) {
    const [, round, idxS] = rm;
    const idx = parseInt(idxS);
    if (round === "sf") return { nextId: "f-0", position: "away" };
    const next: Record<string, string> = { r32: "r16", r16: "qf", qf: "sf" };
    return { nextId: `r-${next[round]}-${Math.floor(idx / 2)}`, position: idx % 2 === 0 ? "home" : "away" };
  }
  return null;
}

const sortIdx = (id: string) => parseInt(id.split("-").slice(-1)[0]) || 0;

export default function BracketClient({ userId: _userId }: { userId: string }) {
  const { champion, setChampion, completedGroups } = usePredictionStore();

  // Always start with a clean bracket (SSR-safe). Rehydrate from localStorage/URL in useEffect.
  const [bracket, setBracket] = useState<BracketSlot[]>(buildInitialBracket);

  const [aiAllLoading, setAiAllLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [teamPicker, setTeamPicker] = useState<{ slotId: string; position: "home" | "away" } | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  const [copied, setCopied] = useState(false);
  const [decidingPenalties, setDecidingPenalties] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Capture champion at mount — don't trigger fireworks for already-stored champion
  const [initialChampion] = useState(() => champion);

  // Rehydrate bracket from URL param or localStorage after mount (client-only)
  useEffect(() => {
    // 1. URL-shared bracket takes priority
    const v = new URLSearchParams(window.location.search).get("v");
    if (v) {
      try {
        const data = JSON.parse(atob(v)) as [string, number, number, number, number][];
        const teamById: Record<number, Team> = Object.fromEntries(ALL_TEAMS.map(t => [t.id, t]));
        const slots = buildInitialBracket();
        data.forEach(([id, homeId, awayId, scoreA, scoreB]) => {
          const homeTeam = teamById[homeId];
          const awayTeam = teamById[awayId];
          if (!homeTeam || !awayTeam) return;
          const winner = scoreA >= scoreB ? homeTeam : awayTeam;
          const slot = slots.find(s => s.id === id);
          if (slot) Object.assign(slot, { homeTeam, awayTeam, scoreA, scoreB, winner });
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBracket(slots);
        return;
      } catch { /* fallthrough */ }
    }

    // 2. localStorage (survives refresh / navigate away)
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setBracket(JSON.parse(stored) as BracketSlot[]);
    } catch { /* ignore */ }
  }, []);

  const prevCompletedRef = useRef<Record<string, Team[]>>({});

  // Auto-persist bracket on every change (survives refresh, navigate away, etc.)
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(bracket));
  }, [bracket]);

  // Sync f-0 winner → store champion (outside render, avoids setState-in-render error)
  const finalWinner = useMemo(() => bracket.find(s => s.id === "f-0")?.winner ?? null, [bracket]);
  useEffect(() => {
    if (finalWinner) setChampion(finalWinner);
  }, [finalWinner, setChampion]);

  // Show fireworks only when champion is set during THIS session
  useEffect(() => {
    if (champion && champion.id !== initialChampion?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowFireworks(true);
      const t = setTimeout(() => setShowFireworks(false), 9000);
      return () => clearTimeout(t);
    }
  }, [champion, initialChampion]);

  // Auto-seed R32 whenever a group completes (or re-completes with new standings)
  useEffect(() => {
    const prev = prevCompletedRef.current;
    setBracket(b => {
      let updated = [...b];
      Object.entries(completedGroups).forEach(([group, sortedTeams]) => {
        const mappings = GROUP_TO_R32[group];
        if (!mappings) return;
        mappings.forEach(({ slotId, position, rank }) => {
          const team = sortedTeams[rank];
          if (!team) return;
          const prevTeam = prev[group]?.[rank];
          updated = updated.map(s => {
            if (s.id !== slotId) return s;
            const current = position === "home" ? s.homeTeam : s.awayTeam;
            // Only set if slot is empty OR still has the prev auto-seeded team (not manually overridden)
            if (current === null || current?.id === prevTeam?.id) {
              return position === "home" ? { ...s, homeTeam: team } : { ...s, awayTeam: team };
            }
            return s;
          });
        });
      });
      return updated;
    });
    prevCompletedRef.current = completedGroups;
  }, [completedGroups]);

  // IDs of all teams already placed in bracket (for dedup)
  const usedTeamIds = useMemo(() => {
    const ids = new Set<number>();
    bracket.forEach(slot => {
      if (slot.homeTeam) ids.add(slot.homeTeam.id);
      if (slot.awayTeam) ids.add(slot.awayTeam.id);
    });
    return ids;
  }, [bracket]);

  const filteredTeams = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    const currentSlot = teamPicker ? bracket.find(s => s.id === teamPicker.slotId) : null;
    const ownTeamId = currentSlot
      ? (teamPicker?.position === "home" ? currentSlot.homeTeam?.id : currentSlot.awayTeam?.id)
      : undefined;

    return ALL_TEAMS.filter(t => {
      if (usedTeamIds.has(t.id) && t.id !== ownTeamId) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
    });
  }, [pickerSearch, usedTeamIds, teamPicker, bracket]);

  const openTeamPicker = useCallback((slotId: string, position: "home" | "away") => {
    setTeamPicker({ slotId, position });
    setPickerSearch("");
  }, []);

  const setTeamInSlot = useCallback((team: Team) => {
    if (!teamPicker) return;
    const { slotId, position } = teamPicker;
    setBracket(prev => prev.map(s =>
      s.id === slotId
        ? { ...s, homeTeam: position === "home" ? team : s.homeTeam, awayTeam: position === "away" ? team : s.awayTeam, winner: null, scoreA: null, scoreB: null }
        : s
    ));
    setTeamPicker(null);
  }, [teamPicker]);

  const handlePenaltyWinner = useCallback((slotId: string, winner: Team) => {
    setBracket(prev => {
      let updated = prev.map(s => s.id === slotId ? { ...s, winner } : s);
      const next = getNextSlot(slotId);
      if (next) {
        updated = updated.map(s =>
          s.id === next.nextId
            ? {
                ...s,
                homeTeam: next.position === "home" ? winner : s.homeTeam,
                awayTeam: next.position === "away" ? winner : s.awayTeam,
                winner: null, scoreA: null, scoreB: null,
              }
            : s
        );
      }
      return updated;
    });
  }, []);

  const handleAIPenaltyDecide = useCallback(async (slotId: string) => {
    const slot = bracket.find(s => s.id === slotId);
    if (!slot?.homeTeam || !slot.awayTeam) return;
    setDecidingPenalties(slotId);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA: slot.homeTeam.name, teamB: slot.awayTeam.name, matchId: slotId }),
      });
      const pred: AIPrediction = await res.json();
      const winner = pred.scoreA >= pred.scoreB ? slot.homeTeam : slot.awayTeam;
      handlePenaltyWinner(slotId, winner);
    } catch { /* ignore */ }
    setDecidingPenalties(null);
  }, [bracket, handlePenaltyWinner]);

  const handleScoreChange = useCallback((slotId: string, scoreA: number | null, scoreB: number | null) => {
    setBracket(prev => {
      const slot = prev.find(s => s.id === slotId);
      if (!slot) return prev;
      const prevWinner = slot.winner;

      let updated = prev.map(s => s.id === slotId ? { ...s, scoreA, scoreB, winner: null } : s);

      // If there was a previous winner, remove it from the next slot
      if (prevWinner) {
        const next = getNextSlot(slotId);
        if (next) {
          updated = updated.map(s => {
            if (s.id !== next.nextId) return s;
            const isHome = next.position === "home";
            const teamInNext = isHome ? s.homeTeam : s.awayTeam;
            if (teamInNext?.id === prevWinner.id) {
              return isHome
                ? { ...s, homeTeam: null, winner: null, scoreA: null, scoreB: null }
                : { ...s, awayTeam: null, winner: null, scoreA: null, scoreB: null };
            }
            return s;
          });
        }
      }

      // Non-draw: set winner and advance
      if (scoreA !== null && scoreB !== null && slot.homeTeam && slot.awayTeam && scoreA !== scoreB) {
        const winner = scoreA > scoreB ? slot.homeTeam : slot.awayTeam;
        updated = updated.map(s => s.id === slotId ? { ...s, winner } : s);
        const next = getNextSlot(slotId);
        if (next) {
          updated = updated.map(s =>
            s.id === next.nextId
              ? {
                  ...s,
                  homeTeam: next.position === "home" ? winner : s.homeTeam,
                  awayTeam: next.position === "away" ? winner : s.awayTeam,
                  winner: null, scoreA: null, scoreB: null,
                }
              : s
          );
        }
      }
      // Draw: winner stays null — penalties picker will appear in the card
      return updated;
    });
  }, []);

  const handleAIPredictAll = async () => {
    setAiAllLoading(true);
    setProgress(0);

    const groups = Object.entries(WC2026_GROUPS);
    const LG = groups.slice(0, 6);
    const RG = groups.slice(6);
    const [A, B, C, D, E, F] = LG.map(([, t]) => t);
    const [G, H, I, J, K, L] = RG.map(([, t]) => t);

    const lSeeds: [Team, Team][] = [
      [A[0],B[1]],[B[0],A[1]],[C[0],D[1]],[D[0],C[1]],
      [E[0],F[1]],[F[0],E[1]],[A[2],B[2]],[C[2],D[2]],
    ];
    const rSeeds: [Team, Team][] = [
      [G[0],H[1]],[H[0],G[1]],[I[0],J[1]],[J[0],I[1]],
      [K[0],L[1]],[L[0],K[1]],[G[2],H[2]],[I[2],J[2]],
    ];

    let current = buildInitialBracket().map(slot => {
      if (slot.id.startsWith("l-r32-")) {
        const idx = parseInt(slot.id.replace("l-r32-", ""));
        if (lSeeds[idx]) return { ...slot, homeTeam: lSeeds[idx][0], awayTeam: lSeeds[idx][1] };
      }
      if (slot.id.startsWith("r-r32-")) {
        const idx = parseInt(slot.id.replace("r-r32-", ""));
        if (rSeeds[idx]) return { ...slot, homeTeam: rSeeds[idx][0], awayTeam: rSeeds[idx][1] };
      }
      return slot;
    });
    // Override with user's completed group standings
    Object.entries(completedGroups).forEach(([group, sortedTeams]) => {
      GROUP_TO_R32[group]?.forEach(({ slotId, position, rank }) => {
        const team = sortedTeams[rank];
        if (!team) return;
        current = current.map(s => {
          if (s.id !== slotId) return s;
          return position === "home" ? { ...s, homeTeam: team } : { ...s, awayTeam: team };
        });
      });
    });
    setBracket([...current]);

    const ORDER = [
      ...[0,1,2,3,4,5,6,7].map(i => `l-r32-${i}`),
      ...[0,1,2,3,4,5,6,7].map(i => `r-r32-${i}`),
      ...[0,1,2,3].map(i => `l-r16-${i}`),
      ...[0,1,2,3].map(i => `r-r16-${i}`),
      "l-qf-0","l-qf-1","r-qf-0","r-qf-1",
      "l-sf-0","r-sf-0","f-0",
    ];

    for (let i = 0; i < ORDER.length; i++) {
      const slotId = ORDER[i];
      const slot = current.find(s => s.id === slotId);
      if (!slot?.homeTeam || !slot.awayTeam) { setProgress(Math.round((i + 1) / ORDER.length * 100)); continue; }

      let winner: Team = slot.homeTeam;
      let scoreA = 1, scoreB = 0;
      try {
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamA: slot.homeTeam.name, teamB: slot.awayTeam.name, matchId: slotId }),
        });
        const pred: AIPrediction = await res.json();
        scoreA = pred.scoreA; scoreB = pred.scoreB;
        winner = pred.scoreA >= pred.scoreB ? slot.homeTeam : slot.awayTeam;
      } catch { }

      current = current.map(s => s.id === slotId ? { ...s, winner, scoreA, scoreB } : s);
      if (slotId === "f-0") setChampion(winner);
      const next = getNextSlot(slotId);
      if (next) {
        current = current.map(s =>
          s.id === next.nextId
            ? { ...s, homeTeam: next.position === "home" ? winner : s.homeTeam, awayTeam: next.position === "away" ? winner : s.awayTeam }
            : s
        );
      }
      setProgress(Math.round((i + 1) / ORDER.length * 100));
      setBracket([...current]);
    }
    setAiAllLoading(false);
    setProgress(100);
  };

  // Reset bracket — clear all slots and champion
  const resetBracket = () => {
    if (!window.confirm("Reset the entire bracket? All teams and scores will be cleared.")) return;
    setBracket(buildInitialBracket());
    setChampion(null);
  };

  // Copy share URL with encoded bracket state to clipboard
  const shareBracket = () => {
    const compact = bracket
      .filter(s => s.homeTeam && s.awayTeam && s.scoreA !== null && s.scoreB !== null)
      .map(s => [s.id, s.homeTeam!.id, s.awayTeam!.id, s.scoreA, s.scoreB]);
    const encoded = btoa(JSON.stringify(compact));
    const url = `${window.location.origin}/bracket?v=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const slotMap = useMemo(() => Object.fromEntries(bracket.map(s => [s.id, s])), [bracket]);
  const finalSlot = slotMap["f-0"];

  const LEFT_COLS = [
    { key: "l-r32", label: "Round of 32",  gap: "8px",  pt: "0px"  },
    { key: "l-r16", label: "Round of 16",  gap: "24px", pt: "12px" },
    { key: "l-qf",  label: "Quarterfinal", gap: "56px", pt: "28px" },
    { key: "l-sf",  label: "Semifinal",    gap: "0px",  pt: "60px" },
  ];
  const RIGHT_COLS = [
    { key: "r-sf",  label: "Semifinal",    gap: "0px",  pt: "60px" },
    { key: "r-qf",  label: "Quarterfinal", gap: "56px", pt: "28px" },
    { key: "r-r16", label: "Round of 16",  gap: "24px", pt: "12px" },
    { key: "r-r32", label: "Round of 32",  gap: "8px",  pt: "0px"  },
  ];

  const getColSlots = (key: string) =>
    bracket.filter(s => s.id.startsWith(key + "-")).sort((a, b) => sortIdx(a.id) - sortIdx(b.id));

  return (
    <div>
      {/* Header */}
      <div className="max-w-7xl mx-auto flex items-center gap-3 mb-4 flex-wrap px-4">
        {/* Primary action */}
        <Button variant="gold" onClick={handleAIPredictAll} loading={aiAllLoading}>
          <Bot className="w-4 h-4" />
          AI Predict All
        </Button>

        {aiAllLoading && (
          <div className="flex items-center gap-2">
            <div className="w-28 h-1.5 bg-[#1e2640] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#f5c518] to-[#c9a000] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-[#8899bb]">{progress}%</span>
          </div>
        )}

        {/* Secondary actions — right side */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-[#2d3a5a] hidden sm:block mr-1">Auto-saved</span>
          <Button variant="secondary" size="sm" onClick={shareBracket}>
            {copied ? <Copy className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Share"}
          </Button>
          <Button variant="ghost" size="sm" onClick={resetBracket}>
            Reset
          </Button>
          {/* Help button */}
          <button
            onClick={() => setShowHelp(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a5570] hover:text-[#8899bb] hover:bg-[#1e2640] transition-all cursor-pointer"
            aria-label="How the bracket works"
            title="How the bracket works"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Help modal */}
      <BracketHelpModal open={showHelp} onClose={() => setShowHelp(false)} />

      {/* Bracket */}
      <div className="overflow-x-auto pb-8">
        <div className="flex items-start px-4 mx-auto" style={{ width: "fit-content", gap: "3px" }}>

          {/* LEFT HALF */}
          {LEFT_COLS.map(({ key, label, gap, pt }) => (
            <div key={key} className="flex flex-col" style={{ width: "192px" }}>
              <div className="text-[10px] font-bold text-[#8899bb] uppercase tracking-wider mb-3 text-center">{label}</div>
              <div className="flex flex-col" style={{ gap, paddingTop: pt }}>
                {getColSlots(key).map(slot => (
                  <BracketCard
                    key={slot.id}
                    slot={slot}
                    onPickHome={() => openTeamPicker(slot.id, "home")}
                    onPickAway={() => openTeamPicker(slot.id, "away")}
                    onScoreChange={(a, b) => handleScoreChange(slot.id, a, b)}
                    pickable={slot.id.startsWith("l-r32-") || slot.id.startsWith("r-r32-")}
                    onPenaltyWinner={winner => handlePenaltyWinner(slot.id, winner)}
                    onAIPenalty={() => handleAIPenaltyDecide(slot.id)}
                    decidingPenalties={decidingPenalties === slot.id}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* CENTER — Trophy + Final */}
          <div className="flex flex-col items-center shrink-0" style={{ width: "200px", paddingTop: "24px" }}>
            <div className="text-[10px] font-bold text-[#f5c518] uppercase tracking-wider mb-3 text-center">Final</div>

            <div className="flex flex-col items-center mb-5 gap-2">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f5c518] to-[#c9a000] flex items-center justify-center animate-float shadow-2xl shadow-[#f5c51840]">
                <Trophy className="w-10 h-10 text-[#080b14]" strokeWidth={1.5} />
              </div>
              <p className="text-[10px] text-[#f5c518] font-bold uppercase tracking-widest">WC 2026</p>
              {champion && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f5c51815] border border-[#f5c51830]">
                  <img src={getFlagUrl(champion.flagCode, 20)} alt={champion.name} className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
                  <span className="text-xs font-black text-[#f5c518]">{champion.name}</span>
                </div>
              )}
            </div>

            {finalSlot && (
              <BracketCard
                slot={finalSlot}
                onPickHome={() => openTeamPicker("f-0", "home")}
                onPickAway={() => openTeamPicker("f-0", "away")}
                onScoreChange={(a, b) => handleScoreChange("f-0", a, b)}
                pickable={false}
                onPenaltyWinner={winner => handlePenaltyWinner("f-0", winner)}
                onAIPenalty={() => handleAIPenaltyDecide("f-0")}
                decidingPenalties={decidingPenalties === "f-0"}
              />
            )}
          </div>

          {/* RIGHT HALF */}
          {RIGHT_COLS.map(({ key, label, gap, pt }) => (
            <div key={key} className="flex flex-col" style={{ width: "192px" }}>
              <div className="text-[10px] font-bold text-[#8899bb] uppercase tracking-wider mb-3 text-center">{label}</div>
              <div className="flex flex-col" style={{ gap, paddingTop: pt }}>
                {getColSlots(key).map(slot => (
                  <BracketCard
                    key={slot.id}
                    slot={slot}
                    onPickHome={() => openTeamPicker(slot.id, "home")}
                    onPickAway={() => openTeamPicker(slot.id, "away")}
                    onScoreChange={(a, b) => handleScoreChange(slot.id, a, b)}
                    pickable={slot.id.startsWith("l-r32-") || slot.id.startsWith("r-r32-")}
                    onPenaltyWinner={winner => handlePenaltyWinner(slot.id, winner)}
                    onAIPenalty={() => handleAIPenaltyDecide(slot.id)}
                    decidingPenalties={decidingPenalties === slot.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fireworks celebration */}
      {showFireworks && champion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          onClick={() => setShowFireworks(false)}
        >
          <FireworksBackground
            className="absolute inset-0 w-full h-full"
            population={3}
            color={["#f5c518", "#ffd54f", "#ffffff", "#60a5fa", "#34d399"]}
          />
          <div className="relative z-10 flex flex-col items-center gap-4 px-10 py-8 rounded-3xl bg-[#080b14cc] backdrop-blur-md border border-[#f5c51840] text-center shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f5c518] to-[#c9a000] flex items-center justify-center animate-float shadow-2xl shadow-[#f5c51840]">
              <Trophy className="w-10 h-10 text-[#080b14]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[#f5c518] text-xs font-bold uppercase tracking-[0.2em] mb-2">World Champion 2026</p>
              <div className="flex items-center gap-3 justify-center">
                <img src={getFlagUrl(champion.flagCode, 40)} alt={champion.name} className="w-12 h-8 object-cover rounded-md shrink-0" />
                <p className="text-3xl font-black text-[#e8eaf0]">{champion.name}</p>
              </div>
            </div>
            <p className="text-[#4a5570] text-xs mt-1">Click anywhere to dismiss</p>
          </div>
          <button
            onClick={() => setShowFireworks(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#1e2640] border border-[#2d3a5a] flex items-center justify-center text-[#8899bb] hover:text-[#e8eaf0] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Team picker */}
      <Dialog open={!!teamPicker} onClose={() => setTeamPicker(null)} title={`Pick ${teamPicker?.position === "home" ? "Home" : "Away"} Team`}>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5570]" />
            <input
              autoFocus
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              placeholder="Search team or code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141928] border border-[#1e2640] text-[#e8eaf0] placeholder-[#4a5570] focus:outline-none focus:border-[#f5c518] transition-colors cursor-text text-sm"
            />
          </div>
          {filteredTeams.length === 0 && pickerSearch === "" && (
            <p className="text-center text-sm text-[#4a5570] py-3">All 48 teams are already placed in the bracket.</p>
          )}
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-0.5">
            {filteredTeams.map(team => (
              <button key={team.id} onClick={() => setTeamInSlot(team)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#141928] border border-[#1e2640] hover:border-[#f5c51840] hover:bg-[#1a2035] transition-all cursor-pointer text-left"
              >
                <img src={getFlagUrl(team.flagCode, 20)} alt={team.name} className="w-6 h-4 object-cover rounded-sm shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#e8eaf0] truncate">{team.name}</p>
                  <p className="text-[10px] text-[#4a5570]">{team.code}</p>
                </div>
              </button>
            ))}
            {filteredTeams.length === 0 && pickerSearch !== "" && (
              <p className="col-span-2 text-center text-sm text-[#4a5570] py-6">No teams found</p>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

const HELP_TIPS = [
  {
    icon: Users,
    label: "Teams auto-fill from Group Stage",
    desc: "Complete all 6 group matches and the qualified teams seed into R32 automatically.",
  },
  {
    icon: Edit3,
    label: "R32 slots are editable",
    desc: "Click any team name in the outer columns to change it manually.",
  },
  {
    icon: ChevronRight,
    label: "Enter scores to advance",
    desc: "The winner auto-moves to the next round. R16 onwards only advances via scores — no manual picks.",
  },
  {
    icon: Zap,
    label: "Draws → Penalties",
    desc: "Equal scores show a penalty picker. Choose the winner yourself or let AI decide.",
  },
  {
    icon: Save,
    label: "Auto-saved",
    desc: "Everything is saved in your browser automatically. Use Share to copy a link.",
  },
] as const;

function BracketHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="How the Bracket works">
      <ul className="space-y-3">
        {HELP_TIPS.map(({ icon: Icon, label, desc }) => (
          <li key={label} className="flex gap-3 items-start">
            <span className="mt-0.5 w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-[#f5c51815] border border-[#f5c51825]">
              <Icon className="w-3.5 h-3.5 text-[#f5c518]" />
            </span>
            <div>
              <p className="text-xs font-semibold text-[#e8eaf0] leading-snug">{label}</p>
              <p className="text-[11px] text-[#6677aa] mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

function BracketCard({
  slot, onPickHome, onPickAway, onScoreChange, pickable = false,
  onPenaltyWinner, onAIPenalty, decidingPenalties,
}: {
  slot: BracketSlot;
  onPickHome: () => void;
  onPickAway: () => void;
  onScoreChange: (a: number | null, b: number | null) => void;
  pickable?: boolean;
  onPenaltyWinner: (winner: Team) => void;
  onAIPenalty: () => void;
  decidingPenalties: boolean;
}) {
  const homeWins = !!slot.winner && slot.winner.id === slot.homeTeam?.id;
  const awayWins = !!slot.winner && slot.winner.id === slot.awayTeam?.id;
  const bothScores = slot.scoreA !== null && slot.scoreB !== null;
  const isDraw = bothScores && slot.scoreA === slot.scoreB && !!slot.homeTeam && !!slot.awayTeam;
  const awaitingPenalties = isDraw && !slot.winner;
  const penaltiesDecided = isDraw && !!slot.winner;

  return (
    <div className={`w-full rounded-xl bg-[#0e1220] border transition-all duration-200 overflow-hidden ${
      awaitingPenalties ? "border-[#f5c51860]" : "border-[#1e2640] hover:border-[#f5c51830]"
    }`}>
      {slot.subtitle && !slot.homeTeam && !slot.awayTeam && (
        <div className="px-2.5 pt-1.5 text-[9px] text-[#2d3a5a] font-mono tracking-wider">{slot.subtitle}</div>
      )}
      <TeamInputRow
        team={slot.homeTeam} score={slot.scoreA} isWinner={homeWins}
        onPickTeam={pickable ? onPickHome : undefined}
        onScoreChange={v => onScoreChange(v, slot.scoreB)}
      />
      <div className="h-px bg-[#1e2640]" />
      <TeamInputRow
        team={slot.awayTeam} score={slot.scoreB} isWinner={awayWins}
        onPickTeam={pickable ? onPickAway : undefined}
        onScoreChange={v => onScoreChange(slot.scoreA, v)}
      />

      {/* Penalty shootout picker — appears when scores are equal */}
      {awaitingPenalties && (
        <div className="px-2.5 py-2 border-t border-[#f5c51820] bg-[#f5c51806]">
          <p className="text-[9px] text-[#f5c518] font-bold uppercase tracking-wider mb-1.5">Draw — Penalties</p>
          <div className="flex gap-1">
            <button
              onClick={() => onPenaltyWinner(slot.homeTeam!)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-[#141928] border border-[#1e2640] hover:border-[#f5c51840] hover:bg-[#1a2035] transition-all cursor-pointer min-w-0"
            >
              <img src={getFlagUrl(slot.homeTeam!.flagCode, 20)} className="w-4 h-2.5 object-cover rounded-sm shrink-0" />
              <span className="text-[10px] text-[#c8cfe0] truncate">{slot.homeTeam!.name.split(" ")[0]}</span>
            </button>
            <button
              onClick={onAIPenalty}
              disabled={decidingPenalties}
              className="px-2 py-1.5 rounded bg-[#f5c51810] border border-[#f5c51820] hover:bg-[#f5c51820] transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1 shrink-0"
            >
              {decidingPenalties
                ? <span className="text-[10px] text-[#f5c518]">…</span>
                : <><Bot className="w-3 h-3 text-[#f5c518]" /><span className="text-[10px] text-[#f5c518] font-bold">AI</span></>
              }
            </button>
            <button
              onClick={() => onPenaltyWinner(slot.awayTeam!)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-[#141928] border border-[#1e2640] hover:border-[#f5c51840] hover:bg-[#1a2035] transition-all cursor-pointer min-w-0"
            >
              <img src={getFlagUrl(slot.awayTeam!.flagCode, 20)} className="w-4 h-2.5 object-cover rounded-sm shrink-0" />
              <span className="text-[10px] text-[#c8cfe0] truncate">{slot.awayTeam!.name.split(" ")[0]}</span>
            </button>
          </div>
        </div>
      )}

      {/* Penalties result badge */}
      {penaltiesDecided && (
        <div className="px-2.5 py-1.5 border-t border-[#f5c51815] flex items-center gap-1.5">
          <img src={getFlagUrl(slot.winner!.flagCode, 20)} className="w-3.5 h-2.5 object-cover rounded-sm" />
          <span className="text-[9px] text-[#f5c518] font-bold">Pen. {slot.winner!.name.split(" ")[0]}</span>
        </div>
      )}
    </div>
  );
}

function TeamInputRow({
  team, score, isWinner, onPickTeam, onScoreChange,
}: {
  team: Team | null;
  score: number | null;
  isWinner: boolean;
  onPickTeam?: () => void;
  onScoreChange: (v: number | null) => void;
}) {
  const teamContent = team ? (
    <>
      <img src={getFlagUrl(team.flagCode, 20)} alt={team.name} className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
      <span className={`text-[11px] font-medium truncate ${isWinner ? "text-[#f5c518]" : "text-[#e8eaf0]"}`}>
        {team.name}
      </span>
    </>
  ) : (
    <>
      <div className="w-5 h-3.5 bg-[#1e2640] rounded-sm shrink-0" />
      {onPickTeam ? (
        <span className="text-[11px] text-[#4a5570] italic flex items-center gap-1">
          TBD <Plus className="w-2.5 h-2.5" />
        </span>
      ) : (
        <span className="text-[11px] text-[#2d3a5a] italic">TBD</span>
      )}
    </>
  );

  return (
    <div className={`flex items-stretch transition-colors ${isWinner ? "bg-[#f5c51812]" : ""}`}>
      {onPickTeam ? (
        <button
          onClick={onPickTeam}
          className="flex-1 flex items-center gap-2 px-2.5 py-2 text-left hover:bg-[#141928] transition-colors cursor-pointer min-w-0"
        >
          {teamContent}
        </button>
      ) : (
        <div className="flex-1 flex items-center gap-2 px-2.5 py-2 min-w-0">
          {teamContent}
        </div>
      )}
      <input
        type="text"
        inputMode="numeric"
        value={score ?? ""}
        onFocus={e => e.target.select()}
        maxLength={2}
        onChange={e => {
          const clean = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
          onScoreChange(clean === "" ? null : Math.min(30, parseInt(clean, 10)));
        }}
        className={`w-8 text-center text-xs font-bold bg-[#141928] border-l border-[#1e2640] focus:outline-none focus:bg-[#1a2035] cursor-text shrink-0 ${isWinner ? "text-[#f5c518]" : "text-[#8899bb]"}`}
        placeholder="–"
      />
    </div>
  );
}
