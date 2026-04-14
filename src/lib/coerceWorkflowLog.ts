import { normalizeStarRating } from "@/lib/normalizeRating";
import type { MarketDataBundle } from "@/lib/marketDataTypes";
import type { WorkflowLog } from "@/lib/types";

/** Normalize a log from JSON (camelCase or snake_case) after fetch. */
export function coerceWorkflowLog(raw: unknown): WorkflowLog {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const vars = o.variables;
  const structured =
    (o.marketDataStructured ?? o.market_data_structured) as | MarketDataBundle
      | null
      | undefined;

  return {
    id: String(o.id ?? ""),
    promptId: String(o.promptId ?? o.prompt_id ?? ""),
    promptTitle: String(o.promptTitle ?? o.prompt_title ?? ""),
    categoryId: String(o.categoryId ?? o.category_id ?? ""),
    inputs: String(o.inputs ?? ""),
    variables:
      vars && typeof vars === "object" && !Array.isArray(vars)
        ? (vars as Record<string, string>)
        : {},
    output: String(o.output ?? ""),
    marketData: String(o.marketData ?? o.market_data ?? ""),
    hadData: Boolean(o.hadData ?? o.had_data),
    timestamp:
      typeof o.timestamp === "string" && o.timestamp
        ? o.timestamp
        : o.created_at
          ? new Date(String(o.created_at)).toLocaleString()
          : "",
    rating: normalizeStarRating(
      o.rating ?? o.star_rating ?? (o as { starRating?: unknown }).starRating,
    ),
    fullPrompt: String(o.fullPrompt ?? o.full_prompt ?? ""),
    marketDataStructured:
      structured !== undefined ? structured : null,
  };
}
