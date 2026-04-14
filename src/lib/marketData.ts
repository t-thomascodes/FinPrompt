import {
  bundleHasDisplayableData,
  formatMarketDataForPrompt,
  getCachedMarketDataBundle,
} from "@/lib/marketDataBundle";
import type { MarketDataBundle } from "@/lib/marketDataTypes";

export type EnrichTickerResult = {
  formatted: string;
  structured: MarketDataBundle;
  hadData: boolean;
};

export async function enrichTickerData(ticker: string): Promise<EnrichTickerResult> {
  const structured = await getCachedMarketDataBundle(ticker.trim().toUpperCase());
  const formatted = formatMarketDataForPrompt(structured);
  return {
    formatted,
    structured,
    hadData: bundleHasDisplayableData(structured),
  };
}
