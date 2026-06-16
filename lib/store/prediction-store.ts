"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Team, BracketMatch } from "../types";

interface GroupResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  homeTeam: Team;
  awayTeam: Team;
}

interface PredictionState {
  groupResults: Record<string, GroupResult>;
  bracketMatches: BracketMatch[];
  champion: Team | null;
  completedGroups: Record<string, Team[]>;

  setGroupResult: (matchId: string, result: GroupResult) => void;
  setBracketMatch: (match: BracketMatch) => void;
  setBracketMatches: (matches: BracketMatch[]) => void;
  setChampion: (team: Team | null) => void;
  setCompletedGroup: (group: string, sortedTeams: Team[]) => void;
  clearAll: () => void;
  getGroupWinners: () => Record<string, Team[]>;
}

const INITIAL_BRACKET: BracketMatch[] = Array.from({ length: 16 }, (_, i) => ({
  id: `r32-${i}`,
  round: "Round of 32",
  position: i,
  homeTeam: null,
  awayTeam: null,
  homeScore: null,
  awayScore: null,
  winner: null,
}));

export const usePredictionStore = create<PredictionState>()(
  persist(
    (set, get) => ({
      groupResults: {},
      bracketMatches: INITIAL_BRACKET,
      champion: null,
      completedGroups: {},

      setGroupResult: (matchId, result) =>
        set((state) => ({
          groupResults: { ...state.groupResults, [matchId]: result },
        })),

      setBracketMatch: (match) =>
        set((state) => ({
          bracketMatches: state.bracketMatches.map((m) =>
            m.id === match.id ? match : m
          ),
        })),

      setBracketMatches: (matches) => set({ bracketMatches: matches }),

      setChampion: (team) => set({ champion: team }),

      setCompletedGroup: (group, sortedTeams) =>
        set((state) => ({
          completedGroups: { ...state.completedGroups, [group]: sortedTeams },
        })),

      clearAll: () =>
        set({
          groupResults: {},
          bracketMatches: INITIAL_BRACKET,
          champion: null,
          completedGroups: {},
        }),

      getGroupWinners: () => {
        const { groupResults } = get();
        const groupPoints: Record<string, Record<number, { team: Team; pts: number; gd: number }>> = {};

        Object.values(groupResults).forEach((result) => {
          const group = result.matchId.split("-")[0];
          if (!groupPoints[group]) groupPoints[group] = {};

          const homeId = result.homeTeam.id;
          const awayId = result.awayTeam.id;

          if (!groupPoints[group][homeId]) {
            groupPoints[group][homeId] = { team: result.homeTeam, pts: 0, gd: 0 };
          }
          if (!groupPoints[group][awayId]) {
            groupPoints[group][awayId] = { team: result.awayTeam, pts: 0, gd: 0 };
          }

          const hg = result.homeScore;
          const ag = result.awayScore;
          groupPoints[group][homeId].gd += hg - ag;
          groupPoints[group][awayId].gd += ag - hg;

          if (hg > ag) {
            groupPoints[group][homeId].pts += 3;
          } else if (hg === ag) {
            groupPoints[group][homeId].pts += 1;
            groupPoints[group][awayId].pts += 1;
          } else {
            groupPoints[group][awayId].pts += 3;
          }
        });

        const winners: Record<string, Team[]> = {};
        Object.entries(groupPoints).forEach(([group, teams]) => {
          const sorted = Object.values(teams).sort(
            (a, b) => b.pts - a.pts || b.gd - a.gd
          );
          winners[group] = sorted.slice(0, 2).map((t) => t.team);
        });

        return winners;
      },
    }),
    {
      name: "worldcup-predictions",
    }
  )
);
