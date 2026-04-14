import {
  bundleHasDisplayableData,
  formatMarketDataForPrompt,
  formatMarketDataForPromptCompact,
  getCachedMarketDataBundle,
} from "@/lib/marketDataBundle";
import type { MarketDataBundle } from "@/lib/marketDataTypes";

export type EnrichTickerResult = {
  formatted: string;
  structured: MarketDataBundle;
  hadData: boolean;
};

/** Max peer symbols appended after primary market data (each triggers a Yahoo bundle fetch). */
export const MAX_PEER_TICKERS = 6;

/**
 * Parse comma/semicolon/newline-separated tickers; dedupe; cap at MAX_PEER_TICKERS.
 */
export function parsePeerTickersFromVariable(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,;\n]+/)) {
    const sym = part.trim().toUpperCase().replace(/\s+/g, "");
    if (!sym || !/^[A-Z0-9.-]+$/.test(sym)) continue;
    if (seen.has(sym)) continue;
    seen.add(sym);
    out.push(sym);
    if (out.length >= MAX_PEER_TICKERS) break;
  }
  return out;
}

export async function enrichTickerData(ticker: string): Promise<EnrichTickerResult> {
  const structured = await getCachedMarketDataBundle(ticker.trim().toUpperCase());
  const formatted = formatMarketDataForPrompt(structured);
  return {
    formatted,
    structured,
    hadData: bundleHasDisplayableData(structured),
  };
}

/**
 * Full market block for the primary ticker plus compact blocks for each peer (parallel fetch, cache-aware).
 * Pass `primary` when already fetched (e.g. after peer discovery) to avoid a duplicate Yahoo round-trip.
 */
export async function enrichTickerDataWithPeers(
  primaryTicker: string,
  peerTickers: string[],
  options?: { primary?: EnrichTickerResult },
): Promise<EnrichTickerResult> {
  const primary = options?.primary ?? (await enrichTickerData(primaryTicker));
  const primaryU = primaryTicker.trim().toUpperCase();
  const limited = Array.from(
    new Set(peerTickers.map((t) => t.trim().toUpperCase()).filter((t) => t && t !== primaryU)),
  ).slice(0, MAX_PEER_TICKERS);

  if (limited.length === 0) {
    return primary;
  }

  const peerBlocks = await Promise.all(
    limited.map(async (sym) => {
      try {
        const b = await getCachedMarketDataBundle(sym);
        if (!bundleHasDisplayableData(b)) {
          return { sym, text: "(Insufficient market data returned.)", had: false };
        }
        return {
          sym,
          text: formatMarketDataForPromptCompact(b),
          had: true,
        };
      } catch {
        return { sym, text: "(Data fetch failed.)", had: false };
      }
    }),
  );

  let anyPeerData = false;
  const peerBody = peerBlocks
    .map(({ sym, text, had }) => {
      if (had) anyPeerData = true;
      return `--- PEER: ${sym} ---\n${text}`;
    })
    .join("\n\n");

  const banner =
    "\n\n========== COMPARABLE PEERS (live data) ==========\n" +
    "Use ONLY the figures in each PEER block below for that symbol’s row in the comps table. " +
    "Do not invent peer valuation multiples or growth rates.\n\n";

  return {
    formatted: primary.formatted + banner + peerBody,
    structured: primary.structured,
    hadData: primary.hadData || anyPeerData,
  };
}
