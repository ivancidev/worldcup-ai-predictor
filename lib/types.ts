export interface Team {
  id: number;
  name: string;
  code: string;
  country: string;
  logo: string;
  flagCode: string;
}

export interface Fixture {
  id: number;
  date: string;
  timestamp: number;
  status: {
    short: string;
    long: string;
    elapsed: number | null;
  };
  homeTeam: Team;
  awayTeam: Team;
  goals: {
    home: number | null;
    away: number | null;
  };
  league: {
    round: string;
    group?: string;
  };
  venue?: {
    name: string;
    city: string;
  };
}

export interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  group: string;
  form?: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

export interface GroupStanding {
  group: string;
  standings: Standing[][];
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: number;
  score_a: number;
  score_b: number;
  winner: string;
  ai_reasoning: string;
  confidence: number;
  created_at: string;
  home_team?: string;
  away_team?: string;
}

export interface SharedPrediction {
  id: string;
  prediction_id: string;
  slug: string;
  created_at: string;
  prediction?: Prediction & {
    home_team: string;
    away_team: string;
    username?: string;
  };
}

export interface AIPrediction {
  winner: string;
  scoreA: number;
  scoreB: number;
  confidence: number;
  reasoning: string;
}

export interface BracketMatch {
  id: string;
  round: string;
  position: number;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore: number | null;
  awayScore: number | null;
  winner: Team | null;
  fixtureId?: number;
}

export interface TeamStats {
  team: Team;
  form: string;
  fixtures: {
    played: { total: number };
    wins: { total: number };
    draws: { total: number };
    loses: { total: number };
  };
  goals: {
    for: { average: { total: string } };
    against: { average: { total: string } };
  };
}

export interface BracketSlot {
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
