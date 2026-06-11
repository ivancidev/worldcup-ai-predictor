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
