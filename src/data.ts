import { Monster, ParsedMonster } from "./types";

const BASE = "https://5e.kiwee.top";

const SIZE_MAP: Record<string, string> = {
  T: "超小型", S: "小型", M: "中型", L: "大型", H: "巨型", G: "超巨型",
};

function parseAC(ac: any): number {
  if (!ac || !Array.isArray(ac) || ac.length === 0) return 10;
  const first = ac[0];
  if (typeof first === "number") return first;
  if (first && typeof first === "object" && "ac" in first) return first.ac;
  return 10;
}

function parseType(type: any): string {
  if (!type) return "unknown";
  if (typeof type === "string") return type;
  if (typeof type === "object") {
    const t = type.type;
    return typeof t === "string" ? t : JSON.stringify(t) || "unknown";
  }
  return String(type);
}

function parseMon(m: any): ParsedMonster | null {
  try {
    if (!m || !m.name) return null;
    return {
      name: m.name || "???",
      engName: m.ENG_name || m.name || "???",
      source: m.source || "?",
      ac: parseAC(m.ac),
      hp: m.hp?.average ?? 0,
      dexMod: Math.floor(((m.dex || 10) - 10) / 2),
      cr: m.cr ?? "?",
      size: SIZE_MAP[m.size?.[0]] || m.size?.[0] || "?",
      type: parseType(m.type),
      tokenUrl: m.hasToken !== false && m.source && (m.ENG_name || m.name)
        ? `${BASE}/img/bestiary/tokens/${m.source}/${encodeURIComponent(m.ENG_name || m.name)}.webp`
        : "",
    };
  } catch {
    return null;
  }
}

let cachedMonsters: ParsedMonster[] | null = null;
let loadingPromise: Promise<ParsedMonster[]> | null = null;

export async function loadAllMonsters(): Promise<ParsedMonster[]> {
  if (cachedMonsters) return cachedMonsters;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // Load index to get all source files
    const indexRes = await fetch(`${BASE}/data/bestiary/index.json`);
    const index = await indexRes.json() as Record<string, string>;

    // Load all source files in parallel
    const entries = Object.entries(index);
    const results = await Promise.all(
      entries.map(async ([, filename]) => {
        try {
          const res = await fetch(`${BASE}/data/bestiary/${filename}`);
          const data = await res.json();
          return (data.monster || []) as Monster[];
        } catch {
          return [] as Monster[];
        }
      })
    );

    const all = results.flat().map(parseMon).filter((x): x is ParsedMonster => x !== null);
    // Sort by CR numerically, then by name
    all.sort((a, b) => {
      const crA = parseCR(a.cr);
      const crB = parseCR(b.cr);
      if (crA !== crB) return crA - crB;
      return a.name.localeCompare(b.name);
    });

    cachedMonsters = all;
    return all;
  })();

  return loadingPromise;
}

function parseCR(cr: string): number {
  if (cr === "1/8") return 0.125;
  if (cr === "1/4") return 0.25;
  if (cr === "1/2") return 0.5;
  return parseFloat(cr) || 0;
}

export function searchMonsters(
  monsters: ParsedMonster[],
  query: string,
  sortDesc: boolean = false
): ParsedMonster[] {
  let result = monsters;

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    result = monsters.filter((m) => {
      const t = String(m.type || "");
      return (
        (m.name || "").toLowerCase().includes(q) ||
        (m.engName || "").toLowerCase().includes(q) ||
        m.cr === q ||
        t.toLowerCase().includes(q)
      );
    });
  }

  // Sort by CR
  result = [...result].sort((a, b) => {
    const diff = parseCR(a.cr) - parseCR(b.cr);
    return sortDesc ? -diff : diff;
  });

  return result.slice(0, 80);
}
