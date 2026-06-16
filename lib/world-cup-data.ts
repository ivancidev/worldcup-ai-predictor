import { Team } from "./types";

export const WC2026_GROUPS: Record<string, Team[]> = {
  A: [
    { id: 1,  name: "Mexico",          code: "MEX", country: "Mexico",               logo: "", flagCode: "mx" },
    { id: 2,  name: "South Africa",    code: "RSA", country: "South Africa",          logo: "", flagCode: "za" },
    { id: 3,  name: "Korea Republic",  code: "KOR", country: "South Korea",           logo: "", flagCode: "kr" },
    { id: 4,  name: "Czech Republic",  code: "CZE", country: "Czech Republic",        logo: "", flagCode: "cz" },
  ],
  B: [
    { id: 5,  name: "Canada",          code: "CAN", country: "Canada",                logo: "", flagCode: "ca" },
    { id: 6,  name: "Bosnia & Herz.",  code: "BIH", country: "Bosnia and Herzegovina",logo: "", flagCode: "ba" },
    { id: 7,  name: "Qatar",           code: "QAT", country: "Qatar",                 logo: "", flagCode: "qa" },
    { id: 8,  name: "Switzerland",     code: "SUI", country: "Switzerland",           logo: "", flagCode: "ch" },
  ],
  C: [
    { id: 9,  name: "Brazil",          code: "BRA", country: "Brazil",                logo: "", flagCode: "br" },
    { id: 10, name: "Morocco",         code: "MAR", country: "Morocco",               logo: "", flagCode: "ma" },
    { id: 11, name: "Haiti",           code: "HAI", country: "Haiti",                 logo: "", flagCode: "ht" },
    { id: 12, name: "Scotland",        code: "SCO", country: "Scotland",              logo: "", flagCode: "gb-sct" },
  ],
  D: [
    { id: 13, name: "USA",             code: "USA", country: "United States",         logo: "", flagCode: "us" },
    { id: 14, name: "Paraguay",        code: "PAR", country: "Paraguay",              logo: "", flagCode: "py" },
    { id: 15, name: "Australia",       code: "AUS", country: "Australia",             logo: "", flagCode: "au" },
    { id: 16, name: "Turkey",          code: "TUR", country: "Turkey",                logo: "", flagCode: "tr" },
  ],
  E: [
    { id: 17, name: "Germany",         code: "GER", country: "Germany",               logo: "", flagCode: "de" },
    { id: 18, name: "Curaçao",         code: "CUW", country: "Curaçao",               logo: "", flagCode: "cw" },
    { id: 19, name: "Ivory Coast",     code: "CIV", country: "Ivory Coast",           logo: "", flagCode: "ci" },
    { id: 20, name: "Ecuador",         code: "ECU", country: "Ecuador",               logo: "", flagCode: "ec" },
  ],
  F: [
    { id: 21, name: "Netherlands",     code: "NED", country: "Netherlands",           logo: "", flagCode: "nl" },
    { id: 22, name: "Japan",           code: "JPN", country: "Japan",                 logo: "", flagCode: "jp" },
    { id: 23, name: "Sweden",          code: "SWE", country: "Sweden",                logo: "", flagCode: "se" },
    { id: 24, name: "Tunisia",         code: "TUN", country: "Tunisia",               logo: "", flagCode: "tn" },
  ],
  G: [
    { id: 25, name: "Belgium",         code: "BEL", country: "Belgium",               logo: "", flagCode: "be" },
    { id: 26, name: "Egypt",           code: "EGY", country: "Egypt",                 logo: "", flagCode: "eg" },
    { id: 27, name: "Iran",            code: "IRN", country: "Iran",                  logo: "", flagCode: "ir" },
    { id: 28, name: "New Zealand",     code: "NZL", country: "New Zealand",           logo: "", flagCode: "nz" },
  ],
  H: [
    { id: 29, name: "Spain",           code: "ESP", country: "Spain",                 logo: "", flagCode: "es" },
    { id: 30, name: "Cape Verde",      code: "CPV", country: "Cape Verde",            logo: "", flagCode: "cv" },
    { id: 31, name: "Saudi Arabia",    code: "KSA", country: "Saudi Arabia",          logo: "", flagCode: "sa" },
    { id: 32, name: "Uruguay",         code: "URU", country: "Uruguay",               logo: "", flagCode: "uy" },
  ],
  I: [
    { id: 33, name: "France",          code: "FRA", country: "France",                logo: "", flagCode: "fr" },
    { id: 34, name: "Senegal",         code: "SEN", country: "Senegal",               logo: "", flagCode: "sn" },
    { id: 35, name: "Iraq",            code: "IRQ", country: "Iraq",                  logo: "", flagCode: "iq" },
    { id: 36, name: "Norway",          code: "NOR", country: "Norway",                logo: "", flagCode: "no" },
  ],
  J: [
    { id: 37, name: "Argentina",       code: "ARG", country: "Argentina",             logo: "", flagCode: "ar" },
    { id: 38, name: "Algeria",         code: "ALG", country: "Algeria",               logo: "", flagCode: "dz" },
    { id: 39, name: "Austria",         code: "AUT", country: "Austria",               logo: "", flagCode: "at" },
    { id: 40, name: "Jordan",          code: "JOR", country: "Jordan",                logo: "", flagCode: "jo" },
  ],
  K: [
    { id: 41, name: "Portugal",        code: "POR", country: "Portugal",              logo: "", flagCode: "pt" },
    { id: 42, name: "DR Congo",        code: "COD", country: "DR Congo",              logo: "", flagCode: "cd" },
    { id: 43, name: "Uzbekistan",      code: "UZB", country: "Uzbekistan",            logo: "", flagCode: "uz" },
    { id: 44, name: "Colombia",        code: "COL", country: "Colombia",              logo: "", flagCode: "co" },
  ],
  L: [
    { id: 45, name: "England",         code: "ENG", country: "England",               logo: "", flagCode: "gb-eng" },
    { id: 46, name: "Croatia",         code: "CRO", country: "Croatia",               logo: "", flagCode: "hr" },
    { id: 47, name: "Ghana",           code: "GHA", country: "Ghana",                 logo: "", flagCode: "gh" },
    { id: 48, name: "Panama",          code: "PAN", country: "Panama",                logo: "", flagCode: "pa" },
  ],
};

export const GROUP_MATCHES = Object.entries(WC2026_GROUPS).flatMap(([group, teams]) => {
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: `${group}-${i}-${j}`,
        group,
        homeTeam: teams[i],
        awayTeam: teams[j],
        round: `Group ${group}`,
      });
    }
  }
  return matches;
});

export function getFlagUrl(code: string, size: number = 40): string {
  return `https://flagcdn.com/w${size}/${code.toLowerCase()}.png`;
}

/**
 * Parses a group match id (e.g. "H-0-1") into its group letter and the two
 * teams it references inside WC2026_GROUPS. The canonical id always has the
 * lower team index first, matching how group standings are computed.
 */
export function parseGroupMatchId(
  matchId: string
): { group: string; home: Team; away: Team } | null {
  const m = matchId.match(/^([A-L])-(\d+)-(\d+)$/);
  if (!m) return null;
  const [, group, iStr, jStr] = m;
  const teams = WC2026_GROUPS[group];
  if (!teams) return null;
  const home = teams[parseInt(iStr, 10)];
  const away = teams[parseInt(jStr, 10)];
  if (!home || !away) return null;
  return { group, home, away };
}

/**
 * Maps a group match id (e.g. "H-0-1") to a stable, collision-free numeric id
 * for the Supabase `predictions.match_id` column. Encodes the group letter so
 * matches that share team indices across different groups never collide:
 *   number = groupIndex(0-11) * 100 + min(i,j) * 10 + max(i,j)
 * e.g. "H-0-1" → 7*100 + 0*10 + 1 = 701. Range 0–1133 across all 72 matches.
 *
 * Must stay in sync with `supabase/migrations/002_fix_match_id_collision.sql`.
 * Non group-stage ids fall back to the legacy derivation.
 */
export function groupMatchIdToNumber(matchId: string): number {
  const m = matchId.match(/^([A-L])-(\d)-(\d)$/);
  if (!m) {
    return (
      parseInt(matchId.replace(/\D/g, "").padEnd(8, "0").slice(0, 8), 10) || 0
    );
  }
  const [, letter, iStr, jStr] = m;
  const g = letter.charCodeAt(0) - 65; // A=0 … L=11
  const i = parseInt(iStr, 10);
  const j = parseInt(jStr, 10);
  return g * 100 + Math.min(i, j) * 10 + Math.max(i, j);
}

/**
 * Resolves the canonical group match id (e.g. "H-0-1") for a pair of team
 * names, regardless of the order they appear in a fixture. Returns null when
 * the two teams are not in the same group.
 */
export function fixtureToGroupMatchId(
  homeName: string,
  awayName: string
): string | null {
  for (const [group, teams] of Object.entries(WC2026_GROUPS)) {
    const hi = teams.findIndex((t) => t.name === homeName);
    const ai = teams.findIndex((t) => t.name === awayName);
    if (hi !== -1 && ai !== -1) {
      const [i, j] = hi < ai ? [hi, ai] : [ai, hi];
      return `${group}-${i}-${j}`;
    }
  }
  return null;
}

export function getCountryFlagCode(teamName: string): string {
  const map: Record<string, string> = {
    Mexico: "mx", "South Africa": "za", "Korea Republic": "kr", "Czech Republic": "cz",
    Canada: "ca", "Bosnia & Herz.": "ba", "Bosnia and Herzegovina": "ba", Qatar: "qa",
    Switzerland: "ch", Brazil: "br", Morocco: "ma", Haiti: "ht", Scotland: "gb-sct",
    USA: "us", "United States": "us", Paraguay: "py", Australia: "au", Turkey: "tr",
    Germany: "de", "Curaçao": "cw", Curacao: "cw", "Ivory Coast": "ci",
    "Cote D'Ivoire": "ci", Ecuador: "ec", Netherlands: "nl", Japan: "jp",
    Sweden: "se", Tunisia: "tn", Belgium: "be", Egypt: "eg", Iran: "ir",
    "IR Iran": "ir", "New Zealand": "nz", Spain: "es", "Cape Verde": "cv",
    "Saudi Arabia": "sa", Uruguay: "uy", France: "fr", Senegal: "sn", Iraq: "iq",
    Norway: "no", Argentina: "ar", Algeria: "dz", Austria: "at", Jordan: "jo",
    Portugal: "pt", "DR Congo": "cd", Uzbekistan: "uz", Colombia: "co",
    England: "gb-eng", Croatia: "hr", Ghana: "gh", Panama: "pa",
  };
  return map[teamName] || "un";
}
