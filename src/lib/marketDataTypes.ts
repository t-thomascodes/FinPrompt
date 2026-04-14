export type QuarterEpsSurprise = "BEAT" | "MISS" | "MEET" | "N/A";

export type MarketQuarterRow = {
  periodEnd: string;
  revenue: number | null;
  netIncome: number | null;
  operatingMargin: number | null;
  epsActual: number | null;
  epsEstimate: number | null;
  epsSurprise: QuarterEpsSurprise;
};

export type MarketNewsHeadline = {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string | null;
};

export type MarketPricePoint = {
  date: string;
  close: number;
};

export type MarketBalanceQuarter = {
  periodEnd: string;
  totalCash: number | null;
  totalDebt: number | null;
  netDebt: number | null;
  totalAssets: number | null;
};

export type MarketCashFlowQuarter = {
  periodEnd: string;
  freeCashFlow: number | null;
  operatingCashFlow: number | null;
};

export type AnalystRecDistribution = {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  period: string;
};

/** Normalized JSON returned by /api/market-data and execute enrichment. */
export type MarketDataBundle = {
  ticker: string;
  fetchedAt: string;
  errors: string[];
  profile: {
    name: string | null;
    symbol: string | null;
    sector: string | null;
    industry: string | null;
    summary: string | null;
    employees: number | null;
    website: string | null;
  };
  quote: {
    currency: string | null;
    exchange: string | null;
    currentPrice: number | null;
    previousClose: number | null;
    dayOpen: number | null;
    dayHigh: number | null;
    dayLow: number | null;
    change: number | null;
    changePercent: number | null;
    volume: number | null;
    marketCap: number | null;
  };
  valuation: {
    trailingPE: number | null;
    forwardPE: number | null;
    peg: number | null;
    priceToBook: number | null;
    priceToSales: number | null;
    evToRevenue: number | null;
    evToEbitda: number | null;
  };
  fundamentals: {
    revenue: number | null;
    ebitda: number | null;
    netIncome: number | null;
    grossMargin: number | null;
    operatingMargin: number | null;
    profitMargin: number | null;
    ebitdaMargin: number | null;
    roe: number | null;
    roa: number | null;
    revenueGrowth: number | null;
    earningsGrowth: number | null;
  };
  trading: {
    beta: number | null;
    fiftyTwoWeekLow: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyDayAverage: number | null;
    twoHundredDayAverage: number | null;
    targetMean: number | null;
    targetHigh: number | null;
    targetLow: number | null;
    recommendationMean: number | null;
    recommendationKey: string | null;
    analystCount: number | null;
    distribution: AnalystRecDistribution | null;
  };
  balance: {
    totalCash: number | null;
    totalDebt: number | null;
    netDebt: number | null;
    currentRatio: number | null;
    freeCashFlow: number | null;
  };
  calendar: {
    nextEarningsDate: string | null;
    earningsCallDates: string[];
    exDividendDate: string | null;
  };
  news: MarketNewsHeadline[];
  priceHistory: MarketPricePoint[];
  quarters: MarketQuarterRow[];
  balanceSheets: MarketBalanceQuarter[];
  cashFlows: MarketCashFlowQuarter[];
};
