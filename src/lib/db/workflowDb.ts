import { CATEGORIES as INITIAL_CATEGORIES } from "@/lib/categories";
import type { Category, PromptTemplate, Variable, WorkflowLog } from "@/lib/types";
import type { MarketDataBundle } from "@/lib/marketDataTypes";
import { normalizeStarRating } from "@/lib/normalizeRating";
import type { SupabaseClient } from "@supabase/supabase-js";

type CategoryRow = {
  id: string;
  label: string;
  icon: string;
  color: string;
  sort_order: number;
};

type PromptRow = {
  id: string;
  category_id: string;
  title: string;
  description: string;
  template: string;
  variables: unknown;
  enrich_ticker: string | null;
  sort_order: number;
};

type WorkflowLogRow = {
  id: string;
  prompt_id: string;
  prompt_title: string;
  category_id: string;
  inputs: string;
  variables: unknown;
  output: string;
  market_data: string;
  market_data_structured: MarketDataBundle | null;
  had_data: boolean;
  rating: number;
  full_prompt: string;
  created_at: string;
};

/** Columns for /api/app-state — omits huge fields so the response stays small and reliable. */
type WorkflowLogListRow = Pick<
  WorkflowLogRow,
  | "id"
  | "prompt_id"
  | "prompt_title"
  | "category_id"
  | "inputs"
  | "variables"
  | "output"
  | "had_data"
  | "rating"
  | "created_at"
>;

export function rowToWorkflowLog(row: WorkflowLogRow): WorkflowLog {
  const vars = row.variables;
  return {
    id: row.id,
    promptId: row.prompt_id,
    promptTitle: row.prompt_title,
    categoryId: row.category_id,
    inputs: row.inputs,
    variables:
      vars && typeof vars === "object" && !Array.isArray(vars)
        ? (vars as Record<string, string>)
        : {},
    output: row.output ?? "",
    marketData: row.market_data ?? "",
    hadData: Boolean(row.had_data),
    timestamp: new Date(row.created_at).toLocaleString(),
    rating: normalizeStarRating(row.rating),
    fullPrompt: row.full_prompt ?? "",
    marketDataStructured: row.market_data_structured ?? null,
  };
}

/**
 * Full memo text is only needed on the log detail route. Sending every run's full GPT output
 * in /api/app-state can exceed JSON/edge response limits; the handler then falls back to the
 * three demo seed logs (HTTP 200), which looks like 'only my first three runs' after refresh.
 */
const APP_STATE_LIST_OUTPUT_MAX_CHARS = 3200;

function outputPreviewForAppState(raw: string): string {
  const s = raw ?? "";
  if (s.length <= APP_STATE_LIST_OUTPUT_MAX_CHARS) return s;
  return s.slice(0, APP_STATE_LIST_OUTPUT_MAX_CHARS);
}

export function rowToWorkflowLogList(row: WorkflowLogListRow): WorkflowLog {
  const vars = row.variables;
  return {
    id: row.id,
    promptId: row.prompt_id,
    promptTitle: row.prompt_title,
    categoryId: row.category_id,
    inputs: row.inputs,
    variables:
      vars && typeof vars === "object" && !Array.isArray(vars)
        ? (vars as Record<string, string>)
        : {},
    output: outputPreviewForAppState(row.output ?? ""),
    marketData: "",
    hadData: Boolean(row.had_data),
    timestamp: new Date(row.created_at).toLocaleString(),
    rating: normalizeStarRating(row.rating),
    fullPrompt: "",
    marketDataStructured: null,
  };
}

function buildCategories(catRows: CategoryRow[], promptRows: PromptRow[]): Category[] {
  const sortedCats = [...catRows].sort((a, b) => a.sort_order - b.sort_order);
  const sortedPrompts = [...promptRows].sort((a, b) => a.sort_order - b.sort_order);
  return sortedCats.map((c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    color: c.color,
    prompts: sortedPrompts
      .filter((p) => p.category_id === c.id)
      .map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description ?? "",
        template: p.template,
        variables: (p.variables as Variable[]) ?? [],
        enrichTicker: p.enrich_ticker ?? undefined,
      })),
  }));
}

export async function ensureSeedData(supabase: SupabaseClient): Promise<void> {
  const { count, error: countErr } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });
  if (countErr) throw countErr;
  if ((count ?? 0) > 0) return;

  const categoryRows = INITIAL_CATEGORIES.map((cat, ci) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon,
    color: cat.color,
    sort_order: ci,
  }));

  const { error: cErr } = await supabase.from("categories").upsert(categoryRows, {
    onConflict: "id",
    ignoreDuplicates: true,
  });
  if (cErr) throw cErr;

  const promptRows = INITIAL_CATEGORIES.flatMap((cat, ci) =>
    cat.prompts.map((p, pi) => ({
      id: p.id,
      category_id: cat.id,
      title: p.title,
      description: p.description,
      template: p.template,
      variables: p.variables,
      enrich_ticker: p.enrichTicker ?? null,
      sort_order: pi,
    })),
  );

  const { error: pErr } = await supabase.from("prompts").upsert(promptRows, {
    onConflict: "id",
    ignoreDuplicates: true,
  });
  if (pErr) throw pErr;
}

export async function loadCategoriesFromDb(
  supabase: SupabaseClient,
): Promise<Category[]> {
  const { data: cats, error: cErr } = await supabase
    .from("categories")
    .select("id,label,icon,color,sort_order");
  if (cErr) throw cErr;
  const { data: prompts, error: pErr } = await supabase
    .from("prompts")
    .select("id,category_id,title,description,template,variables,enrich_ticker,sort_order");
  if (pErr) throw pErr;
  return buildCategories(
    (cats ?? []) as CategoryRow[],
    (prompts ?? []) as PromptRow[],
  );
}

const APP_STATE_LOG_COLUMNS =
  "id,prompt_id,prompt_title,category_id,inputs,variables,output,had_data,rating,created_at";

/**
 * Slim columns only — avoids multi‑MB Supabase rows (`full_prompt`, `market_data`, structured JSON).
 * Pulling `*` per row often times out or blows response limits so the client never gets logs.
 */
export async function loadLogsListForAppState(
  supabase: SupabaseClient,
): Promise<WorkflowLog[]> {
  const { data, error, count } = await supabase
    .from("workflow_logs")
    .select(APP_STATE_LOG_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(0, 299);
  if (error) throw error;
  const rows = data ?? [];
  if (typeof count === "number" && count > rows.length && rows.length <= 50) {
    console.warn(
      "[FinPrompt] workflow_logs list may be truncated:",
      "returned",
      rows.length,
      "rows but table count is",
      count,
      "— check Supabase Project Settings → API → Max rows (suggest ≥1000), or increase range below.",
    );
  }
  return rows.map((row) => rowToWorkflowLogList(row as WorkflowLogListRow));
}

export async function getWorkflowLogById(
  supabase: SupabaseClient,
  id: string,
): Promise<WorkflowLog | null> {
  const { data, error } = await supabase
    .from("workflow_logs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[FinPrompt] getWorkflowLogById:", error.message);
    return null;
  }
  if (!data) return null;
  return rowToWorkflowLog(data as WorkflowLogRow);
}

/** Postgres text/json rejects U+0000; strip so inserts do not fail on model output. */
function stripNullBytes(s: string): string {
  return s.includes("\0") ? s.replace(/\0/g, "") : s;
}

export async function insertWorkflowLog(
  supabase: SupabaseClient,
  payload: {
    promptId: string;
    promptTitle: string;
    categoryId: string;
    inputs: string;
    variables: Record<string, string>;
    output: string;
    marketData: string;
    marketDataStructured: MarketDataBundle | null;
    hadData: boolean;
    fullPrompt: string;
  },
): Promise<string | null> {
  const vars = payload.variables;
  const variablesClean =
    vars && typeof vars === "object"
      ? Object.fromEntries(
          Object.entries(vars).map(([k, v]) => [k, stripNullBytes(String(v))]),
        )
      : {};

  const { data, error } = await supabase
    .from("workflow_logs")
    .insert({
      prompt_id: stripNullBytes(payload.promptId),
      prompt_title: stripNullBytes(payload.promptTitle),
      category_id: stripNullBytes(payload.categoryId),
      inputs: stripNullBytes(payload.inputs),
      variables: variablesClean,
      output: stripNullBytes(payload.output),
      market_data: stripNullBytes(payload.marketData),
      market_data_structured: payload.marketDataStructured,
      had_data: payload.hadData,
      rating: 0,
      full_prompt: stripNullBytes(payload.fullPrompt),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[FinPrompt] workflow_logs insert failed:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function upsertPromptRow(
  supabase: SupabaseClient,
  categoryId: string,
  prompt: PromptTemplate,
  sortOrder: number,
): Promise<boolean> {
  const { error } = await supabase.from("prompts").upsert(
    {
      id: prompt.id,
      category_id: categoryId,
      title: prompt.title,
      description: prompt.description,
      template: prompt.template,
      variables: prompt.variables,
      enrich_ticker: prompt.enrichTicker ?? null,
      sort_order: sortOrder,
    },
    { onConflict: "id" },
  );
  if (error) {
    console.error("[FinPrompt] prompts upsert failed:", error.message);
    return false;
  }
  return true;
}

export async function updateLogRating(
  supabase: SupabaseClient,
  logId: string,
  rating: number,
): Promise<boolean> {
  const { error } = await supabase
    .from("workflow_logs")
    .update({ rating })
    .eq("id", logId);
  if (error) {
    console.error("[FinPrompt] workflow_logs rating update failed:", error.message);
    return false;
  }
  return true;
}
