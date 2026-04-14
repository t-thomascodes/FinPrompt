import OpenAI from "openai";
import { MAX_PEER_TICKERS, parsePeerTickersFromVariable } from "@/lib/marketData";

const DISCOVERY_MODEL =
  process.env.OPENAI_PEER_DISCOVERY_MODEL?.trim() || "gpt-4o-mini";

/**
 * Suggest peer tickers from company context + primary market excerpt (no peer data yet).
 * Used when the user leaves Peer tickers blank but live peer enrichment is desired.
 */
export async function discoverPeerTickersViaOpenAI(
  client: OpenAI,
  params: {
    ticker: string;
    companyName: string;
    marketSnippet: string;
  },
): Promise<string[]> {
  const { ticker, companyName, marketSnippet } = params;
  const t = ticker.trim().toUpperCase();
  const user = [
    `Primary company: ${companyName.trim() || "(name not provided)"} (${t})`,
    `Below is an excerpt of live market data for ${t}. Use it to choose comparable US-listed equity peers for valuation / comparable-company analysis.`,
    "",
    "--- excerpt ---",
    marketSnippet.slice(0, 2500),
    "--- end ---",
    "",
    `Return ONLY 4 to ${MAX_PEER_TICKERS} peer ticker symbols, comma-separated, no other text.`,
    `Rules: common stock tickers (NYSE/NASDAQ-style); exclude ${t}; prefer same industry or direct competitors where the excerpt supports it; no ETFs, mutual funds, or indices; uppercase symbols only.`,
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: DISCOVERY_MODEL,
    max_tokens: 96,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You output only a comma-separated list of stock ticker symbols. No sentences, bullets, numbering, or markdown.",
      },
      { role: "user", content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  const cleaned = raw
    .replace(/^```[\w]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
  const parsed = parsePeerTickersFromVariable(cleaned);
  return parsed.filter((s) => s !== t).slice(0, MAX_PEER_TICKERS);
}
