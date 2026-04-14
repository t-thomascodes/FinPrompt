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

  const createdRaw = o.created_at ?? o.createdAt;
  const createdAt =
    typeof createdRaw === "string" && createdRaw
      ? (() => {
          const d = new Date(createdRaw);
          return Number.isFinite(d.getTime()) ? d.toISOString() : undefined;
        })()
      : undefined;

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
    createdAt,
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
    fullPromptFingerprint:
      typeof o.fullPromptFingerprint === "string" && o.fullPromptFingerprint
        ? o.fullPromptFingerprint
        : typeof o.full_prompt_fingerprint === "string" &&
            o.full_prompt_fingerprint
          ? o.full_prompt_fingerprint
          : undefined,
    fullPromptExcerpt:
      typeof o.fullPromptExcerpt === "string" && o.fullPromptExcerpt
        ? o.fullPromptExcerpt
        : typeof o.full_prompt_excerpt === "string" && o.full_prompt_excerpt
          ? o.full_prompt_excerpt
          : undefined,
  };
}
