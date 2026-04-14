import YahooFinance from "yahoo-finance2";
import type {
  EarningsHistory,
  QuoteSummaryResult,
} from "yahoo-finance2/modules/quoteSummary-iface";
import type {
  AnalystRecDistribution,
  MarketBalanceQuarter,
  MarketCashFlowQuarter,
  MarketDataBundle,
  MarketNewsHeadline,
  MarketQuarterRow,
  QuarterEpsSurprise,
} from "@/lib/marketDataTypes";

export const MARKET_DATA_CACHE_TTL_MS = 30 * 60 * 1000;

const yahooFinance = new YahooFinance();

const cache = new Map<string, { expires: number; bundle: MarketDataBundle }>();

const QUOTE_SUMMARY_MODULES = [
  "price",
  "summaryDetail",
  "summaryProfile",
  "defaultKeyStatistics",
  "financialData",
  "recommendationTrend",
  "calendarEvents",
  "earningsHistory",
  "assetProfile",
] as const;

function subYears(d: Date, n: number): Date {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() - n);
  return x;
}

function isoDate(d: Date | null | undefined): string | null {
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function fmtUsdShort(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "N/A";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function fmtNum(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(n)) return "N/A";
  return n.toFixed(digits);
}

function fmtPctRatio(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "N/A";
  const x = Math.abs(n) <= 1 ? n * 100 : n;
  return `${x.toFixed(2)}%`;
}

function epsSurprise(
  actual: number | null | undefined,
  est: number | null | undefined,
): QuarterEpsSurprise {
  if (actual == null || est == null || Number.isNaN(actual) || Number.isNaN(est)) {
    return "N/A";
  }
  const d = actual - est;
  if (d > 0.005) return "BEAT";
  if (d < -0.005) return "MISS";
  return "MEET";
}

async function tryFetch<T>(
  label: string,
  errors: string[],
  fn: () => Promise<T>,
): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`${label}: ${msg}`);
    return null;
  }
}

function matchEpsRow(
  finDate: Date,
  history: EarningsHistory | null | undefined,
): { actual: number | null; estimate: number | null } {
  const rows = history?.history ?? [];
  let best: { actual: number | null; estimate: number | null } | null = null;
  let bestDelta = Infinity;
  const t = finDate.getTime();
  for (const h of rows) {
    const q = h.quarter;
    if (!q) continue;
    const d = Math.abs(q.getTime() - t);
    if (d < bestDelta && d < 120 * 24 * 60 * 60 * 1000) {
      bestDelta = d;
      best = {
        actual: h.epsActual ?? null,
        estimate: h.epsEstimate ?? null,
      };
    }
  }
  return best ?? { actual: null, estimate: null };
}

function normalizeFinancialsRow(r: Record<string, unknown>): {
  date: Date;
  totalRevenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
} | null {
  const date = r.date as Date | undefined;
  if (!date || Number.isNaN(date.getTime())) return null;
  const tr = r.totalRevenue as number | undefined;
  const oi = r.operatingIncome as number | undefined;
  const ni = r.netIncome as number | undefined;
  return {
    date,
    totalRevenue: tr ?? null,
    operatingIncome: oi ?? null,
    netIncome: ni ?? null,
  };
}

function buildQuarters(
  financials: Record<string, unknown>[] | null,
  earningsHistory: EarningsHistory | null | undefined,
): MarketQuarterRow[] {
  if (!financials?.length) return [];
  const parsed = financials
    .map(normalizeFinancialsRow)
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  return parsed.map((row) => {
    const { actual, estimate } = matchEpsRow(row.date, earningsHistory);
    let opMargin: number | null = null;
    if (
      row.totalRevenue != null &&
      row.totalRevenue !== 0 &&
      row.operatingIncome != null
    ) {
      opMargin = row.operatingIncome / row.totalRevenue;
    }
    return {
      periodEnd: isoDate(row.date) ?? "",
      revenue: row.totalRevenue,
      netIncome: row.netIncome,
      operatingMargin: opMargin,
      epsActual: actual,
      epsEstimate: estimate,
      epsSurprise: epsSurprise(actual, estimate),
    };
  });
}

function analystDistribution(
  qs: QuoteSummaryResult | null,
): AnalystRecDistribution | null {
  const t = qs?.recommendationTrend?.trend?.[0];
  if (!t) return null;
  return {
    period: t.period ?? "",
    strongBuy: t.strongBuy ?? 0,
    buy: t.buy ?? 0,
    hold: t.hold ?? 0,
    sell: t.sell ?? 0,
    strongSell: t.strongSell ?? 0,
  };
}

function sliceBalanceSheets(balRows: Record<string, unknown>[]): MarketBalanceQuarter[] {
  const out: MarketBalanceQuarter[] = [];
  for (const r of balRows) {
    const row = r as {
      date?: Date;
      TYPE?: string;
      totalDebt?: number;
      netDebt?: number;
      totalAssets?: number;
      cashAndCashEquivalents?: number;
      cashFinancial?: number;
    };
    if (!row.date || row.TYPE !== "BALANCE_SHEET") continue;
    const d = isoDate(row.date);
    if (!d) continue;
    const cash = row.cashAndCashEquivalents ?? row.cashFinancial ?? null;
    out.push({
      periodEnd: d,
      totalCash: cash,
      totalDebt: row.totalDebt ?? null,
      netDebt: row.netDebt ?? null,
      totalAssets: row.totalAssets ?? null,
    });
  }
  return out.sort((a, b) => b.periodEnd.localeCompare(a.periodEnd)).slice(0, 8);
}

function sliceCashFlows(cfRows: Record<string, unknown>[]): MarketCashFlowQuarter[] {
  const out: MarketCashFlowQuarter[] = [];
  for (const r of cfRows) {
    const row = r as {
      date?: Date;
      TYPE?: string;
      freeCashFlow?: number;
      operatingCashFlow?: number;
      cashFlowFromContinuingOperatingActivities?: number;
    };
    if (!row.date || row.TYPE !== "CASH_FLOW") continue;
    const d = isoDate(row.date);
    if (!d) continue;
    out.push({
      periodEnd: d,
      freeCashFlow: row.freeCashFlow ?? null,
      operatingCashFlow:
        row.operatingCashFlow ??
        row.cashFlowFromContinuingOperatingActivities ??
        null,
    });
  }
  return out.sort((a, b) => b.periodEnd.localeCompare(a.periodEnd)).slice(0, 8);
}

function buildNewsFromSearch(
  searchNews: Array<Record<string, unknown>> | undefined,
): MarketNewsHeadline[] {
  if (!searchNews?.length) return [];
  return searchNews.slice(0, 10).map((n) => {
    const pub = n.providerPublishTime as Date | undefined;
    return {
      title: String(n.title ?? ""),
      publisher: String(n.publisher ?? ""),
      link: String(n.link ?? ""),
      publishedAt: pub && !Number.isNaN(pub.getTime()) ? pub.toISOString() : null,
    };
  });
}

export async function fetchMarketDataBundle(tickerRaw: string): Promise<MarketDataBundle> {
  const ticker = tickerRaw.trim().toUpperCase();
  const errors: string[] = [];
  const nowIso = new Date().toISOString();
  const period2 = new Date();
  const period1Chart = subYears(period2, 1);
  const period1Fq = subYears(period2, 3);

  const [chartRes, qsRes, finRes, balRes, cfRes, searchRes] = await Promise.all([
    tryFetch("chart", errors, () =>
      yahooFinance.chart(ticker, {
        period1: period1Chart,
        period2,
        interval: "1d",
      }),
    ),
    tryFetch("quoteSummary", errors, () =>
      yahooFinance.quoteSummary(ticker, {
        modules: [...QUOTE_SUMMARY_MODULES],
      }),
    ),
    tryFetch("fundamentalsTimeSeries.financials", errors, () =>
      yahooFinance.fundamentalsTimeSeries(ticker, {
        period1: period1Fq,
        period2,
        type: "quarterly",
        module: "financials",
      }),
    ),
    tryFetch("fundamentalsTimeSeries.balance-sheet", errors, () =>
      yahooFinance.fundamentalsTimeSeries(ticker, {
        period1: period1Fq,
        period2,
        type: "quarterly",
        module: "balance-sheet",
      }),
    ),
    tryFetch("fundamentalsTimeSeries.cash-flow", errors, () =>
      yahooFinance.fundamentalsTimeSeries(ticker, {
        period1: period1Fq,
        period2,
        type: "quarterly",
        module: "cash-flow",
      }),
    ),
    tryFetch("search", errors, () =>
      yahooFinance.search(ticker, { quotesCount: 1, newsCount: 10 }),
    ),
  ]);

  const qs = qsRes as QuoteSummaryResult | null;
  const price = qs?.price;
  const sd = qs?.summaryDetail;
  const sp = qs?.summaryProfile;
  const ap = qs?.assetProfile;
  const fd = qs?.financialData;
  const dks = qs?.defaultKeyStatistics;
  const cal = qs?.calendarEvents;

  const quotes = chartRes?.quotes ?? [];
  const priceHistory = quotes
    .filter((q) => q.close != null && q.date)
    .map((q) => ({
      date: isoDate(q.date) ?? "",
      close: q.close as number,
    }))
    .filter((p) => p.date);

  const finRows = (finRes as Record<string, unknown>[] | null)?.filter(Boolean) ?? [];
  const balRows = (balRes as Record<string, unknown>[] | null)?.filter(Boolean) ?? [];
  const cfRows = (cfRes as Record<string, unknown>[] | null)?.filter(Boolean) ?? [];

  const quarters = buildQuarters(finRows, qs?.earningsHistory);
  const balanceSheets = sliceBalanceSheets(balRows);
  const cashFlows = sliceCashFlows(cfRows);

  const regPrice = price?.regularMarketPrice ?? null;
  const prevClose =
    price?.regularMarketPreviousClose ?? sd?.regularMarketPreviousClose ?? null;
  const change =
    regPrice != null && prevClose != null ? regPrice - prevClose : null;
  let changePct: number | null =
    change != null && prevClose != null && prevClose !== 0
      ? (change / prevClose) * 100
      : null;
  if (changePct == null && sd?.regularMarketChangePercent != null) {
    const raw = sd.regularMarketChangePercent as number;
    changePct = Math.abs(raw) <= 1 ? raw * 100 : raw;
  }

  const earnDates = cal?.earnings?.earningsDate ?? [];
  const callDates = cal?.earnings?.earningsCallDate ?? [];
  const nextEarn = earnDates[0] ?? null;

  const bundle: MarketDataBundle = {
    ticker,
    fetchedAt: nowIso,
    errors,
    profile: {
      name: price?.longName ?? price?.shortName ?? sp?.name ?? ap?.name ?? null,
      symbol: price?.symbol ?? ticker,
      sector: sp?.sector ?? ap?.sector ?? null,
      industry: sp?.industry ?? ap?.industry ?? null,
      summary: (sp?.longBusinessSummary ?? ap?.longBusinessSummary ?? null)?.slice(
        0,
        1200,
      ) ?? null,
      employees: sp?.fullTimeEmployees ?? ap?.fullTimeEmployees ?? null,
      website: sp?.website ?? ap?.website ?? null,
    },
    quote: {
      currency: price?.currency ?? sd?.currency ?? null,
      exchange: price?.exchangeName ?? null,
      currentPrice: regPrice,
      previousClose: prevClose,
      dayOpen: price?.regularMarketOpen ?? sd?.regularMarketOpen ?? null,
      dayHigh: price?.regularMarketDayHigh ?? sd?.regularMarketDayHigh ?? null,
      dayLow: price?.regularMarketDayLow ?? sd?.regularMarketDayLow ?? null,
      change,
      changePercent: changePct,
      volume: price?.regularMarketVolume ?? sd?.regularMarketVolume ?? null,
      marketCap: price?.marketCap ?? sd?.marketCap ?? null,
    },
    valuation: {
      trailingPE: sd?.trailingPE ?? null,
      forwardPE: sd?.forwardPE ?? dks?.forwardPE ?? null,
      peg: dks?.pegRatio ?? null,
      priceToBook: dks?.priceToBook ?? null,
      priceToSales: sd?.priceToSalesTrailing12Months ?? null,
      evToRevenue: dks?.enterpriseToRevenue ?? null,
      evToEbitda: dks?.enterpriseToEbitda ?? null,
    },
    fundamentals: {
      revenue: fd?.totalRevenue ?? null,
      ebitda: fd?.ebitda ?? null,
      netIncome: dks?.netIncomeToCommon ?? null,
      grossMargin: fd?.grossMargins ?? null,
      operatingMargin: fd?.operatingMargins ?? null,
      profitMargin: fd?.profitMargins ?? null,
      ebitdaMargin: fd?.ebitdaMargins ?? null,
      roe: fd?.returnOnEquity ?? null,
      roa: fd?.returnOnAssets ?? null,
      revenueGrowth: fd?.revenueGrowth ?? null,
      earningsGrowth: fd?.earningsGrowth ?? null,
    },
    trading: {
      beta: sd?.beta ?? dks?.beta ?? null,
      fiftyTwoWeekLow: sd?.fiftyTwoWeekLow ?? chartRes?.meta?.fiftyTwoWeekLow ?? null,
      fiftyTwoWeekHigh:
        sd?.fiftyTwoWeekHigh ?? chartRes?.meta?.fiftyTwoWeekHigh ?? null,
      fiftyDayAverage: sd?.fiftyDayAverage ?? null,
      twoHundredDayAverage: sd?.twoHundredDayAverage ?? null,
      targetMean: fd?.targetMeanPrice ?? null,
      targetHigh: fd?.targetHighPrice ?? null,
      targetLow: fd?.targetLowPrice ?? null,
      recommendationMean: fd?.recommendationMean ?? null,
      recommendationKey: fd?.recommendationKey ?? null,
      analystCount: fd?.numberOfAnalystOpinions ?? null,
      distribution: analystDistribution(qs),
    },
    balance: {
      totalCash: fd?.totalCash ?? null,
      totalDebt: fd?.totalDebt ?? null,
      netDebt:
        fd?.totalDebt != null && fd?.totalCash != null
          ? fd.totalDebt - fd.totalCash
          : null,
      currentRatio: fd?.currentRatio ?? null,
      freeCashFlow: fd?.freeCashflow ?? null,
    },
    calendar: {
      nextEarningsDate: isoDate(nextEarn),
      earningsCallDates: callDates
        .map((d) => isoDate(d))
        .filter((x): x is string => Boolean(x)),
      exDividendDate: isoDate(sd?.exDividendDate),
    },
    news: buildNewsFromSearch(searchRes?.news as Array<Record<string, unknown>> | undefined),
    priceHistory,
    quarters,
    balanceSheets,
    cashFlows,
  };

  return bundle;
}

export function formatMarketDataForPrompt(b: MarketDataBundle): string {
  const p = b.profile;
  const q = b.quote;
  const v = b.valuation;
  const f = b.fundamentals;
  const t = b.trading;
  const bal = b.balance;
  const dist = t.distribution;
  const distLine = dist
    ? `Strong buy ${dist.strongBuy} · Buy ${dist.buy} · Hold ${dist.hold} · Sell ${dist.sell} · Strong sell ${dist.strongSell} (${dist.period})`
    : "N/A";

  const lines: string[] = [];

  lines.push(
    `--- COMPANY OVERVIEW ---`,
    `${p.name ?? b.ticker} (${b.ticker}) | ${p.sector ?? "—"} · ${p.industry ?? "—"}`,
    `Mkt Cap: ${fmtUsdShort(q.marketCap)} | Website: ${p.website ?? "—"}`,
    p.summary ? p.summary.slice(0, 500) + (p.summary.length > 500 ? "…" : "") : "—",
  );

  lines.push(
    ``,
    `--- LIVE QUOTE ---`,
    q.currentPrice != null
      ? `$${fmtNum(q.currentPrice, 2)} | Chg: ${fmtNum(q.change, 2)} (${fmtPctRatio((q.changePercent ?? 0) / 100)})`
      : "Price N/A",
    `Vol: ${q.volume != null ? q.volume.toLocaleString() : "N/A"} | Open: ${q.dayOpen != null ? `$${fmtNum(q.dayOpen, 2)}` : "N/A"} | H/L: ${q.dayHigh != null && q.dayLow != null ? `$${fmtNum(q.dayHigh, 2)}/$${fmtNum(q.dayLow, 2)}` : "N/A"}`,
  );

  lines.push(
    ``,
    `--- VALUATION ---`,
    `Trailing P/E: ${fmtNum(v.trailingPE)} | Forward P/E: ${fmtNum(v.forwardPE)} | PEG: ${fmtNum(v.peg)}`,
    `P/B: ${fmtNum(v.priceToBook)} | P/S: ${fmtNum(v.priceToSales)} | EV/Revenue: ${fmtNum(v.evToRevenue)} | EV/EBITDA: ${fmtNum(v.evToEbitda)}`,
  );

  lines.push(
    ``,
    `--- FUNDAMENTALS (TTM / reported) ---`,
    `Revenue: ${fmtUsdShort(f.revenue)} | EBITDA: ${fmtUsdShort(f.ebitda)} | Net income: ${fmtUsdShort(f.netIncome)}`,
    `Gross margin: ${fmtPctRatio(f.grossMargin)} | Operating margin: ${fmtPctRatio(f.operatingMargin)} | EBITDA margin: ${fmtPctRatio(f.ebitdaMargin)} | Net margin: ${fmtPctRatio(f.profitMargin)}`,
    `ROE: ${fmtPctRatio(f.roe)} | ROA: ${fmtPctRatio(f.roa)} | Revenue growth (YoY): ${fmtPctRatio(f.revenueGrowth)} | Earnings growth: ${fmtPctRatio(f.earningsGrowth)}`,
  );

  lines.push(
    ``,
    `--- TRADING & ANALYSTS ---`,
    `Beta: ${fmtNum(t.beta)} | 52-week: $${fmtNum(t.fiftyTwoWeekLow, 2)} – $${fmtNum(t.fiftyTwoWeekHigh, 2)}`,
    `50-day MA: $${fmtNum(t.fiftyDayAverage, 2)} | 200-day MA: $${fmtNum(t.twoHundredDayAverage, 2)}`,
    `Analyst target (mean): $${fmtNum(t.targetMean, 2)} (low $${fmtNum(t.targetLow, 2)} · high $${fmtNum(t.targetHigh, 2)})`,
    `Recommendation mean: ${fmtNum(t.recommendationMean)} (${t.recommendationKey ?? "—"}) | Analysts: ${t.analystCount ?? "N/A"}`,
    `Ratings distribution: ${distLine}`,
  );

  lines.push(
    ``,
    `--- BALANCE SHEET & CASH FLOW (point-in-time) ---`,
    `Cash: ${fmtUsdShort(bal.totalCash)} | Total debt: ${fmtUsdShort(bal.totalDebt)} | Net debt: ${fmtUsdShort(bal.netDebt)}`,
    `Current ratio: ${fmtNum(bal.currentRatio)} | Free cash flow (recent): ${fmtUsdShort(bal.freeCashFlow)}`,
  );

  lines.push(``, `--- QUARTERLY BALANCE SHEET (last ${b.balanceSheets.length}) ---`);
  if (!b.balanceSheets.length) {
    lines.push("(Unavailable.)");
  } else {
    for (const row of b.balanceSheets) {
      lines.push(
        `${row.periodEnd}: Cash ${fmtUsdShort(row.totalCash)} | Debt ${fmtUsdShort(row.totalDebt)} | Net debt ${fmtUsdShort(row.netDebt)} | Assets ${fmtUsdShort(row.totalAssets)}`,
      );
    }
  }

  lines.push(``, `--- QUARTERLY CASH FLOW (last ${b.cashFlows.length}) ---`);
  if (!b.cashFlows.length) {
    lines.push("(Unavailable.)");
  } else {
    for (const row of b.cashFlows) {
      lines.push(
        `${row.periodEnd}: Operating CF ${fmtUsdShort(row.operatingCashFlow)} | Free CF ${fmtUsdShort(row.freeCashFlow)}`,
      );
    }
  }

  lines.push(
    ``,
    `--- NEXT EARNINGS ---`,
    `Next earnings date: ${b.calendar.nextEarningsDate ?? "—"}`,
    b.calendar.earningsCallDates.length
      ? `Earnings call date(s): ${b.calendar.earningsCallDates.join(", ")}`
      : ``,
  );

  lines.push(``, `--- QUARTERLY FINANCIALS (last ${b.quarters.length} quarters) ---`);
  if (!b.quarters.length) {
    lines.push("(Quarterly fundamentals unavailable for this symbol.)");
  } else {
    for (const row of b.quarters) {
      const om = row.operatingMargin != null ? fmtPctRatio(row.operatingMargin) : "N/A";
      lines.push(
        `${row.periodEnd}: Revenue ${fmtUsdShort(row.revenue)} | Net income ${fmtUsdShort(row.netIncome)} | Op margin ${om} | EPS actual ${row.epsActual != null ? fmtNum(row.epsActual, 2) : "N/A"} vs est ${row.epsEstimate != null ? fmtNum(row.epsEstimate, 2) : "N/A"} → ${row.epsSurprise}`,
      );
    }
  }

  lines.push(``, `--- NEWS ---`);
  if (!b.news.length) {
    lines.push("(No headlines returned.)");
  } else {
    b.news.forEach((n, i) => {
      lines.push(`${i + 1}. ${n.title} (${n.publisher})`);
    });
  }

  if (b.errors.length) {
    lines.push(``, `--- PARTIAL DATA WARNINGS ---`, ...b.errors.map((e) => `· ${e}`));
  }

  return lines.filter((l) => l !== "").join("\n");
}

export function bundleHasDisplayableData(b: MarketDataBundle): boolean {
  return Boolean(
    b.quote.currentPrice != null ||
      b.priceHistory.length > 0 ||
      b.quarters.some(
        (q) => q.revenue != null || q.netIncome != null || q.epsActual != null,
      ) ||
      b.profile.name != null,
  );
}

export async function getCachedMarketDataBundle(ticker: string): Promise<MarketDataBundle> {
  const key = ticker.trim().toUpperCase();
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) {
    return hit.bundle;
  }
  const bundle = await fetchMarketDataBundle(key);
  cache.set(key, { expires: now + MARKET_DATA_CACHE_TTL_MS, bundle });
  return bundle;
}

export function clearMarketDataCache(): void {
  cache.clear();
}
