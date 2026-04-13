/** Parse FinPrompt / Alpha Vantage formatted market blocks into UI-friendly fields. */

export type MarketNewsItem = {
  title: string;
  source: string;
  sentiment: string;
};

export type ParsedMarketDisplay = {
  name?: string;
  symbol?: string;
  sectorLine?: string;
  price?: string;
  change?: string;
  changePercent?: string;
  isUp: boolean | null;
  volume?: string;
  open?: string;
  high?: string;
  low?: string;
  pe?: string;
  forwardPe?: string;
  peg?: string;
  marketCap?: string;
  enterpriseValue?: string;
  beta?: string;
  weekLow?: string;
  weekHigh?: string;
  target?: string;
  divYield?: string;
  /** Fundamentals block */
  revenueTtm?: string;
  ebitda?: string;
  grossMargin?: string;
  opMargin?: string;
  roe?: string;
  revGrowth?: string;
  news: MarketNewsItem[];
};

function splitBlocks(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = raw.split(/\r?\n/);
  let title: string | null = null;
  const buf: string[] = [];

  const flush = () => {
    if (title) map.set(title, buf.join("\n").trim());
    buf.length = 0;
  };

  for (const line of lines) {
    const m = line.match(/^---\s*(.+?)\s*---\s*$/);
    if (m) {
      flush();
      title = m[1].trim();
    } else if (title) {
      buf.push(line);
    }
  }
  flush();
  return map;
}

function parseKeyValueLine(line: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = line.split("|").map((p) => p.trim());
  for (const p of parts) {
    const idx = p.indexOf(":");
    if (idx === -1) continue;
    const k = p.slice(0, idx).trim();
    const v = p.slice(idx + 1).trim();
    if (k && v) out[k] = v;
  }
  return out;
}

function parseNewsBlock(text: string): MarketNewsItem[] {
  const items: MarketNewsItem[] = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    const m = t.match(/^\d+\.\s*(.+?)\s*\(([^)]+)\)\s*[—-]\s*(.+)$/);
    if (m) {
      items.push({ title: m[1].trim(), source: m[2].trim(), sentiment: m[3].trim() });
    }
  }
  return items;
}

export function parseMarketDataForDisplay(raw: string): ParsedMarketDisplay | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed || trimmed.startsWith("[")) return null;

  const blocks = splitBlocks(trimmed);
  const out: ParsedMarketDisplay = {
    isUp: null,
    news: [],
  };

  const overview = blocks.get("COMPANY OVERVIEW");
  if (overview) {
    const lines = overview.split("\n").map((l) => l.trim()).filter(Boolean);
    const head = lines[0]?.match(/^(.+?)\s*\(([^)]+)\)\s*\|\s*(.+)$/);
    if (head) {
      out.name = head[1].trim();
      out.symbol = head[2].trim();
      out.sectorLine = head[3].trim();
    }
    for (const line of lines.slice(1)) {
      Object.assign(out, parseKeyValueLine(line));
    }
  }

  const fundamentals = blocks.get("FUNDAMENTALS");
  if (fundamentals) {
    for (const line of fundamentals.split("\n").map((l) => l.trim()).filter(Boolean)) {
      const kv = parseKeyValueLine(line);
      if (kv["Rev TTM"]) out.revenueTtm = kv["Rev TTM"];
      if (kv["EBITDA"]) out.ebitda = kv["EBITDA"];
      if (kv["Margin"]) out.grossMargin = kv["Margin"];
      if (kv["Op Margin"]) out.opMargin = kv["Op Margin"];
      if (kv["ROE"]) out.roe = kv["ROE"];
      if (kv["Rev Growth"]) out.revGrowth = kv["Rev Growth"];
    }
  }

  const valuation = blocks.get("VALUATION");
  if (valuation) {
    const kv = parseKeyValueLine(valuation.split("\n")[0] ?? "");
    out.pe = kv["P/E"];
    out.forwardPe = kv["Fwd P/E"];
    out.peg = kv["PEG"];
  }

  const trading = blocks.get("TRADING");
  if (trading) {
    const lines = trading.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const kv = parseKeyValueLine(line);
      if (kv["Beta"]) out.beta = kv["Beta"];
      const w = line.match(/52W:\s*\$?([\d,.]+)\s*[–-]\s*\$?([\d,.]+)/i);
      if (w) {
        out.weekLow = w[1].replace(/,/g, "");
        out.weekHigh = w[2].replace(/,/g, "");
      }
      if (kv["Target"]) out.target = kv["Target"]?.replace(/^\$/, "");
      if (kv["Div Yield"]) out.divYield = kv["Div Yield"];
    }
  }

  const quote = blocks.get("LIVE QUOTE");
  if (quote) {
    const line = quote.split("\n")[0] ?? "";
    const priceM = line.match(/\$([\d,.]+)/);
    if (priceM) out.price = priceM[1].replace(/,/g, "");

    const chgM = line.match(/Chg:\s*([+-]?[\d,.]+)\s*\(([+-]?[\d,.]+%?)\)/i);
    if (chgM) {
      out.change = chgM[1].replace(/,/g, "");
      out.changePercent = chgM[2].includes("%") ? chgM[2] : `${chgM[2]}%`;
      const n = parseFloat(chgM[1].replace(/,/g, ""));
      out.isUp = Number.isNaN(n) ? null : n >= 0;
    }

    const rest = quote.split("\n").join(" ");
    const volM = rest.match(/Vol:\s*([\d,]+)/i);
    if (volM) out.volume = volM[1];
    const openM = rest.match(/Open:\s*\$?([\d,.]+)/i);
    if (openM) out.open = openM[1];
    const hlM = rest.match(/H\/L:\s*\$?([\d,.]+)\/\$?([\d,.]+)/i);
    if (hlM) {
      out.high = hlM[1];
      out.low = hlM[2];
    }
  }

  const news = blocks.get("NEWS");
  if (news) out.news = parseNewsBlock(news);

  if (overview) {
    const lines = overview.split("\n");
    for (const line of lines) {
      if (line.includes("Mkt Cap:")) {
        const m = line.match(/Mkt Cap:\s*([^|]+)/i);
        if (m) out.marketCap = m[1].trim();
      }
      if (line.includes("EV:")) {
        const m = line.match(/EV:\s*([^|]+)/i);
        if (m) out.enterpriseValue = m[1].trim();
      }
    }
  }

  const hasAny =
    out.price ||
    out.symbol ||
    out.pe ||
    out.marketCap ||
    out.news.length > 0;
  if (!hasAny) return null;

  return out;
}

export function parsePriceNum(s: string | undefined): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** e.g. 312847000 → "312.8M" for compact headers */
export function formatVolumeAbbrev(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const n = parseInt(raw.replace(/,/g, ""), 10);
  if (!Number.isFinite(n)) return raw;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export type SentimentTone = "bull" | "mid" | "bear";

export function sentimentTone(label: string): SentimentTone {
  const t = label.toLowerCase();
  if (/\bbear/.test(t)) return "bear";
  if (/\bbull/.test(t)) return "bull";
  return "mid";
}
