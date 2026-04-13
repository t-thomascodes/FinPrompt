import type { MarketDataResult } from "@/lib/types";

const AV_BASE = "https://www.alphavantage.co/query";

export async function fetchQuote(
  symbol: string,
  apiKey: string,
): Promise<Record<string, string> | null> {
  const url = `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  const r = await fetch(url);
  const d = (await r.json()) as Record<string, unknown>;
  return (d["Global Quote"] as Record<string, string>) || null;
}

export async function fetchOverview(
  symbol: string,
  apiKey: string,
): Promise<Record<string, string>> {
  const url = `${AV_BASE}?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  const r = await fetch(url);
  return (await r.json()) as Record<string, string>;
}

export async function fetchNews(
  symbol: string,
  apiKey: string,
): Promise<
  Array<{
    title: string;
    source: string;
    overall_sentiment_label: string;
  }>
> {
  const url = `${AV_BASE}?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(symbol)}&limit=5&apikey=${apiKey}`;
  const r = await fetch(url);
  const d = (await r.json()) as { feed?: Array<Record<string, string>> };
  const feed = d.feed?.slice(0, 5) ?? [];
  return feed.map((x) => ({
    title: x.title ?? "",
    source: x.source ?? "",
    overall_sentiment_label: x.overall_sentiment_label ?? "N/A",
  }));
}

export function formatMarketData(
  q: Record<string, string> | null,
  o: Record<string, string> | null | undefined,
  n: Array<{
    title: string;
    source: string;
    overall_sentiment_label: string;
  }>,
): string {
  const s: string[] = [];
  if (o?.Symbol) {
    s.push(
      `--- COMPANY OVERVIEW ---\n${o.Name} (${o.Symbol}) | ${o.Sector} · ${o.Industry}\nMkt Cap: $${Number(o.MarketCapitalization || 0).toLocaleString()} | EV: $${Number(o.EnterpriseValue || 0).toLocaleString()}\n${(o.Description || "").slice(0, 250)}...`,
    );
    s.push(
      `--- VALUATION ---\nP/E: ${o.TrailingPE || "—"} | Fwd P/E: ${o.ForwardPE || "—"} | PEG: ${o.PEGRatio || "—"}\nP/B: ${o.PriceToBookRatio || "—"} | P/S: ${o.PriceToSalesRatioTTM || "—"}\nEV/Rev: ${o.EVToRevenue || "—"} | EV/EBITDA: ${o.EVToEBITDA || "—"}`,
    );
    s.push(
      `--- FUNDAMENTALS ---\nRev TTM: $${Number(o.RevenueTTM || 0).toLocaleString()} | EBITDA: $${Number(o.EBITDA || 0).toLocaleString()}\nMargin: ${o.ProfitMargin || "—"} | Op Margin: ${o.OperatingMarginTTM || "—"}\nROE: ${o.ReturnOnEquityTTM || "—"} | Rev Growth: ${o.QuarterlyRevenueGrowthYOY || "—"}`,
    );
    s.push(
      `--- TRADING ---\nBeta: ${o.Beta || "—"} | 52W: $${o["52WeekLow"] || "—"}–$${o["52WeekHigh"] || "—"}\n50D MA: $${o["50DayMovingAverage"] || "—"} | 200D MA: $${o["200DayMovingAverage"] || "—"}\nTarget: $${o.AnalystTargetPrice || "—"} | Div Yield: ${o.DividendYield || "—"}`,
    );
  }
  if (q?.["05. price"]) {
    s.push(
      `--- LIVE QUOTE ---\n$${q["05. price"]} | Chg: ${q["09. change"]} (${q["10. change percent"]})\nVol: ${Number(q["06. volume"] || 0).toLocaleString()} | Open: $${q["02. open"]} | H/L: $${q["03. high"]}/$${q["04. low"]}`,
    );
  }
  if (n?.length) {
    s.push(
      `--- NEWS ---\n${n.map((x, i) => `${i + 1}. ${x.title} (${x.source}) — ${x.overall_sentiment_label || "N/A"}`).join("\n")}`,
    );
  }
  return s.join("\n\n") || "[No data available]";
}

export async function enrichTickerData(
  ticker: string,
  apiKey: string | undefined,
): Promise<MarketDataResult> {
  if (!apiKey) {
    return {
      quote: null,
      overview: null,
      news: [],
      formatted: "[Market data unavailable: configure ALPHA_VANTAGE_API_KEY on the server]",
    };
  }

  try {
    const [quote, overviewRaw, news] = await Promise.all([
      fetchQuote(ticker, apiKey),
      fetchOverview(ticker, apiKey),
      fetchNews(ticker, apiKey),
    ]);

    const overview =
      overviewRaw && !overviewRaw["Error Message"] && overviewRaw.Symbol
        ? overviewRaw
        : null;

    const formatted = formatMarketData(quote, overview, news);
    const usable =
      formatted !== "[No data available]" &&
      !formatted.toLowerCase().includes("thank you for using alpha vantage") &&
      !formatted.toLowerCase().includes("note:");

    return {
      quote,
      overview,
      news,
      formatted: usable
        ? formatted
        : "[Market data temporarily unavailable — proceeding without enrichment]",
    };
  } catch {
    return {
      quote: null,
      overview: null,
      news: [],
      formatted: "[Market data fetch failed — proceeding without enrichment]",
    };
  }
}
