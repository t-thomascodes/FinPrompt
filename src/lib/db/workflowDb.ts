import { CATEGORIES as INITIAL_CATEGORIES } from "@/lib/categories";
import type { Category, PromptTemplate, Variable, WorkflowLog } from "@/lib/types";
import type { MarketDataBundle } from "@/lib/marketDataTypes";
import { normalizeStarRating } from "@/lib/normalizeRating";
import { fingerprintPromptTemplate } from "@/lib/promptTemplateFingerprint";
import { resolveInstructionFooter } from "@/lib/promptInstructionFooter";
import { makeVariantLabelKey } from "@/lib/variantLabelKey";
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
  enrich_peer_tickers?: string | null;
  sort_order: number;
  instruction_footer?: string | null;
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
  full_prompt_fingerprint?: string | null;
  full_prompt_excerpt?: string | null;
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
  | "full_prompt_fingerprint"
  | "full_prompt_excerpt"
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
    createdAt: row.created_at,
    timestamp: new Date(row.created_at).toLocaleString(),
    rating: normalizeStarRating(row.rating),
    fullPrompt: row.full_prompt ?? "",
    marketDataStructured: row.market_data_structured ?? null,
    fullPromptFingerprint: row.full_prompt_fingerprint ?? undefined,
    fullPromptExcerpt: row.full_prompt_excerpt ?? undefined,
  };
}

/**
 * Full memo text is only needed on the log detail route. List rows use slim columns and
 * truncated previews so /api/app-state stays within response limits; overload still fails as 503.
 */
const APP_STATE_LIST_OUTPUT_MAX_CHARS = 3200;
const APP_STATE_LIST_INPUTS_MAX_CHARS = 3200;
const APP_STATE_LIST_VARIABLE_KEYS_MAX = 64;
const APP_STATE_LIST_VARIABLE_VALUE_MAX_CHARS = 800;

function previewChars(raw: string, max: number): string {
  const s = raw ?? "";
  if (s.length <= max) return s;
  return s.slice(0, max);
}

function outputPreviewForAppState(raw: string): string {
  return previewChars(raw, APP_STATE_LIST_OUTPUT_MAX_CHARS);
}

function variablesPreviewForAppState(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  let n = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (n >= APP_STATE_LIST_VARIABLE_KEYS_MAX) break;
    const s =
      typeof v === "string" ? v : v == null ? "" : JSON.stringify(v);
    out[k] = previewChars(s, APP_STATE_LIST_VARIABLE_VALUE_MAX_CHARS);
    n++;
  }
  return out;
}

export function rowToWorkflowLogList(row: WorkflowLogListRow): WorkflowLog {
  return {
    id: row.id,
    promptId: row.prompt_id,
    promptTitle: row.prompt_title,
    categoryId: row.category_id,
    inputs: previewChars(row.inputs ?? "", APP_STATE_LIST_INPUTS_MAX_CHARS),
    variables: variablesPreviewForAppState(row.variables),
    output: outputPreviewForAppState(row.output ?? ""),
    marketData: "",
    hadData: Boolean(row.had_data),
    createdAt: row.created_at,
    timestamp: new Date(row.created_at).toLocaleString(),
    rating: normalizeStarRating(row.rating),
    fullPrompt: "",
    marketDataStructured: null,
    fullPromptFingerprint: row.full_prompt_fingerprint ?? undefined,
    fullPromptExcerpt: row.full_prompt_excerpt ?? undefined,
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
      .map((p) => {
        const footer = resolveInstructionFooter(
          p.template,
          p.instruction_footer,
          p.id,
        );
        return {
          id: p.id,
          title: p.title,
          description: p.description ?? "",
          template: p.template,
          ...(footer ? { instructionFooter: footer } : {}),
          variables: (p.variables as Variable[]) ?? [],
          enrichTicker: p.enrich_ticker ?? undefined,
          enrichPeerTickers: p.enrich_peer_tickers?.trim() || undefined,
        };
      }),
  }));
}

function isMissingInstructionFooterColumnError(err: {
  message?: string;
  code?: string;
}): boolean {
  const m = (err.message ?? "").toLowerCase();
  return m.includes("instruction_footer");
}

function isMissingEnrichPeerTickersColumnError(err: {
  message?: string;
  code?: string;
}): boolean {
  const m = (err.message ?? "").toLowerCase();
  return m.includes("enrich_peer_tickers");
}

//figuring out bugs

const PROMPT_SELECT_WITH_PEER =
  "id,category_id,title,description,template,variables,enrich_ticker,enrich_peer_tickers,sort_order,instruction_footer";

const PROMPT_SELECT_WITHOUT_PEER =
  "id,category_id,title,description,template,variables,enrich_ticker,sort_order,instruction_footer";

const PROMPT_SELECT_PEER_NO_FOOTER =
  "id,category_id,title,description,template,variables,enrich_ticker,enrich_peer_tickers,sort_order";

const PROMPT_SELECT_MIN =
  "id,category_id,title,description,template,variables,enrich_ticker,sort_order";

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
      enrich_peer_tickers: p.enrichPeerTickers ?? null,
      sort_order: pi,
      instruction_footer: p.instructionFooter ?? "",
    })),
  );

  type PromptSeedRow = {
    id: string;
    category_id: string;
    title: string;
    description: string;
    template: string;
    variables: Variable[];
    enrich_ticker: string | null;
    enrich_peer_tickers?: string | null;
    sort_order: number;
    instruction_footer?: string;
  };
  let seedRows: PromptSeedRow[] = promptRows;

  let { error: pErr } = await supabase.from("prompts").upsert(seedRows, {
    onConflict: "id",
    ignoreDuplicates: true,
  });
  if (pErr && isMissingEnrichPeerTickersColumnError(pErr)) {
    seedRows = promptRows.map(({ enrich_peer_tickers: _e, ...rest }) => rest);
    ({ error: pErr } = await supabase.from("prompts").upsert(seedRows, {
      onConflict: "id",
      ignoreDuplicates: true,
    }));
    if (!pErr) {
      console.warn(
        "[Meridian] prompts seeded without enrich_peer_tickers — run supabase/migrations/007_enrich_peer_tickers.sql",
      );
    }
  }
  if (pErr && isMissingInstructionFooterColumnError(pErr)) {
    seedRows = seedRows.map(({ instruction_footer: _i, ...rest }) => rest);
    ({ error: pErr } = await supabase.from("prompts").upsert(seedRows, {
      onConflict: "id",
      ignoreDuplicates: true,
    }));
    if (!pErr) {
      console.warn(
        "[Meridian] prompts seeded without instruction_footer — run supabase/migrations/004_instruction_footer.sql",
      );
    }
  }
  if (pErr) throw pErr;
}

export async function loadCategoriesFromDb(
  supabase: SupabaseClient,
): Promise<Category[]> {
  const { data: cats, error: cErr } = await supabase
    .from("categories")
    .select("id,label,icon,color,sort_order");
  if (cErr) throw cErr;
  let prompts: PromptRow[] | null = null;
  let pErr: { message?: string; code?: string } | null = null;
  ({
    data: prompts,
    error: pErr,
  } = await supabase.from("prompts").select(PROMPT_SELECT_WITH_PEER));
  if (pErr && isMissingEnrichPeerTickersColumnError(pErr)) {
    ({
      data: prompts,
      error: pErr,
    } = await supabase.from("prompts").select(PROMPT_SELECT_WITHOUT_PEER));
    if (!pErr) {
      console.warn(
        "[Meridian] prompts loaded without enrich_peer_tickers — run supabase/migrations/007_enrich_peer_tickers.sql",
      );
    }
  }
  if (pErr && isMissingInstructionFooterColumnError(pErr)) {
    ({
      data: prompts,
      error: pErr,
    } = await supabase.from("prompts").select(PROMPT_SELECT_PEER_NO_FOOTER));
    if (!pErr) {
      console.warn(
        "[Meridian] prompts loaded without instruction_footer — run supabase/migrations/004_instruction_footer.sql",
      );
    }
  }
  if (pErr && isMissingInstructionFooterColumnError(pErr)) {
    ({
      data: prompts,
      error: pErr,
    } = await supabase.from("prompts").select(PROMPT_SELECT_MIN));
    if (!pErr) {
      console.warn(
        "[Meridian] prompts loaded without instruction_footer — run supabase/migrations/004_instruction_footer.sql",
      );
    }
  }
  if (pErr) throw pErr;
  return buildCategories(
    (cats ?? []) as CategoryRow[],
    (prompts ?? []) as PromptRow[],
  );
}

/** List payload without migration 002 variant columns — used if those columns are missing. */
const APP_STATE_LOG_COLUMNS_BASE =
  "id,prompt_id,prompt_title,category_id,inputs,variables,output,had_data,rating,created_at";

const APP_STATE_LOG_COLUMNS_FULL = `${APP_STATE_LOG_COLUMNS_BASE},full_prompt_fingerprint,full_prompt_excerpt`;

/** Prefer migration 011 excerpts so PostgREST never ships multi‑MB `output`/`inputs` per row for lists. */
const APP_STATE_LOG_SLIM =
  "id,prompt_id,prompt_title,category_id,inputs_list_excerpt,variables,output_list_excerpt,had_data,rating,created_at";

const APP_STATE_LOG_SLIM_VARIANT = `${APP_STATE_LOG_SLIM},full_prompt_fingerprint,full_prompt_excerpt`;

function isMissingListExcerptColumnsError(err: { message?: string; code?: string }): boolean {
  const m = (err.message ?? "").toLowerCase();
  return (
    m.includes("inputs_list_excerpt") ||
    m.includes("output_list_excerpt") ||
    (m.includes("list_excerpt") && m.includes("does not exist"))
  );
}

function normalizeAppStateLogRow(row: unknown): WorkflowLogListRow {
  const r = row as Record<string, unknown>;
  const inputs =
    typeof r.inputs_list_excerpt === "string"
      ? r.inputs_list_excerpt
      : String(r.inputs ?? "");
  const output =
    typeof r.output_list_excerpt === "string"
      ? r.output_list_excerpt
      : String(r.output ?? "");
  return {
    id: String(r.id ?? ""),
    prompt_id: String(r.prompt_id ?? ""),
    prompt_title: String(r.prompt_title ?? ""),
    category_id: String(r.category_id ?? ""),
    inputs,
    variables: r.variables,
    output,
    had_data: Boolean(r.had_data),
    rating: Number(r.rating ?? 0),
    created_at: String(r.created_at ?? ""),
    full_prompt_fingerprint:
      typeof r.full_prompt_fingerprint === "string" ? r.full_prompt_fingerprint : undefined,
    full_prompt_excerpt:
      typeof r.full_prompt_excerpt === "string" ? r.full_prompt_excerpt : undefined,
  };
}

function isMissingFingerprintColumnsError(err: { message?: string; code?: string }): boolean {
  const code = String(err.code ?? "");
  if (code === "42703") return true;
  const m = (err.message ?? "").toLowerCase();
  return (
    m.includes("full_prompt_fingerprint") ||
    m.includes("full_prompt_excerpt") ||
    (m.includes("column") && m.includes("does not exist"))
  );
}

function isMissingPromptTemplateSnapshotError(err: { message?: string; code?: string }): boolean {
  const m = (err.message ?? "").toLowerCase();
  return m.includes("prompt_template_snapshot");
}

/**
 * Slim columns only — avoids multi‑MB Supabase rows (`full_prompt`, `market_data`, structured JSON).
 * Pulling `*` per row often times out or blows response limits so the client never gets logs.
 */
export async function loadLogsListForAppState(
  supabase: SupabaseClient,
): Promise<WorkflowLog[]> {
  const PAGE_SIZE = 25;
  const MAX_PAGES = 12; // 300 rows max total, matches previous .limit(300)

  const runSelect = (cols: string, from: number, to: number) =>
    supabase
      .from("workflow_logs")
      .select(cols, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

  /** Run one page with the same fallback chain the original single-query path used. */
  async function fetchPage(
    from: number,
    to: number,
  ): Promise<{ rows: unknown[]; count: number | null; usedListExcerpts: boolean }> {
    let { data, error, count } = await runSelect(APP_STATE_LOG_SLIM_VARIANT, from, to);
    let usedListExcerpts = true;
    if (error && isMissingListExcerptColumnsError(error)) {
      usedListExcerpts = false;
      ({ data, error, count } = await runSelect(APP_STATE_LOG_COLUMNS_FULL, from, to));
    }
    if (error && isMissingFingerprintColumnsError(error)) {
      if (usedListExcerpts) {
        ({ data, error, count } = await runSelect(APP_STATE_LOG_SLIM, from, to));
      } else {
        ({ data, error, count } = await runSelect(APP_STATE_LOG_COLUMNS_BASE, from, to));
      }
    }
    if (error) throw error;
    return { rows: data ?? [], count: count ?? null, usedListExcerpts };
  }

  const allRows: unknown[] = [];
  let totalCount: number | null = null;
  let usedListExcerpts = true;

  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { rows, count, usedListExcerpts: ule } = await fetchPage(from, to);
    if (page === 0) {
      totalCount = count;
      usedListExcerpts = ule;
    }
    allRows.push(...rows);
    // stop early if this page was not full — we've reached the end of the table
    if (rows.length < PAGE_SIZE) break;
    // or stop if we've collected everything the count says exists
    if (typeof totalCount === "number" && allRows.length >= totalCount) break;
  }

  console.log("[Meridian] app-state logs:", {
    rows: allRows.length,
    count: totalCount,
    usedListExcerpts,
  });

  return allRows.map((row) =>
    rowToWorkflowLogList(
      usedListExcerpts
        ? normalizeAppStateLogRow(row)
        : (row as unknown as WorkflowLogListRow),
    ),
  );
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
    console.error("[Meridian] getWorkflowLogById:", error.message);
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
    /** Raw template ({{vars}}); used for variant id when fingerprint not precomputed */
    promptTemplate: string;
    /** When set (e.g. from /api/execute), avoids hashing twice */
    fullPromptFingerprint?: string;
    fullPromptExcerpt?: string;
  },
): Promise<string | null> {
  const vars = payload.variables;
  const variablesClean =
    vars && typeof vars === "object"
      ? Object.fromEntries(
          Object.entries(vars).map(([k, v]) => [k, stripNullBytes(String(v))]),
        )
      : {};

  const fpFull = stripNullBytes(payload.fullPrompt);
  const precomputed =
    typeof payload.fullPromptFingerprint === "string" &&
    payload.fullPromptFingerprint &&
    typeof payload.fullPromptExcerpt === "string"
      ? {
          fingerprint: payload.fullPromptFingerprint,
          excerpt: payload.fullPromptExcerpt,
        }
      : null;
  const tmpl = stripNullBytes(payload.promptTemplate);
  const { fingerprint, excerpt } =
    precomputed ?? fingerprintPromptTemplate(tmpl);

  const baseRow = {
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
    full_prompt: fpFull,
  };

  const withVariant = {
    ...baseRow,
    full_prompt_fingerprint: fingerprint,
    full_prompt_excerpt: excerpt,
  };

  const withSnapshot = {
    ...withVariant,
    prompt_template_snapshot: tmpl,
  };

  let { data, error } = await supabase
    .from("workflow_logs")
    .insert(withSnapshot)
    .select("id")
    .single();

  if (error && isMissingPromptTemplateSnapshotError(error)) {
    ({ data, error } = await supabase
      .from("workflow_logs")
      .insert(withVariant)
      .select("id")
      .single());
    if (!error) {
      console.warn(
        "[Meridian] workflow_logs saved without prompt_template_snapshot — run supabase/migrations/006_prompt_template_snapshot.sql",
      );
    }
  }

  if (error && isMissingFingerprintColumnsError(error)) {
    ({ data, error } = await supabase
      .from("workflow_logs")
      .insert(baseRow)
      .select("id")
      .single());
    if (!error) {
      console.warn(
        "[Meridian] workflow_logs saved without fingerprint columns — run supabase/migrations/002_log_prompt_variant.sql",
      );
    }
  }

  if (error) {
    console.error("[Meridian] workflow_logs insert failed:", error.message);
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
  const payload: Record<string, unknown> = {
    id: prompt.id,
    category_id: categoryId,
    title: prompt.title,
    description: prompt.description,
    template: prompt.template,
    variables: prompt.variables,
    enrich_ticker: prompt.enrichTicker ?? null,
    enrich_peer_tickers: prompt.enrichPeerTickers ?? null,
    sort_order: sortOrder,
    instruction_footer: prompt.instructionFooter ?? "",
  };

  let { error } = await supabase.from("prompts").upsert(payload, { onConflict: "id" });
  if (error && isMissingEnrichPeerTickersColumnError(error)) {
    delete payload.enrich_peer_tickers;
    ({ error } = await supabase.from("prompts").upsert(payload, { onConflict: "id" }));
    if (!error) {
      console.warn(
        "[Meridian] prompt saved without enrich_peer_tickers — run supabase/migrations/007_enrich_peer_tickers.sql",
      );
    }
  }
  if (error && isMissingInstructionFooterColumnError(error)) {
    delete payload.instruction_footer;
    ({ error } = await supabase.from("prompts").upsert(payload, { onConflict: "id" }));
    if (!error) {
      console.warn(
        "[Meridian] prompt saved without instruction_footer — run supabase/migrations/004_instruction_footer.sql",
      );
    }
  }
  if (error) {
    console.error("[Meridian] prompts upsert failed:", error.message);
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
    console.error("[Meridian] workflow_logs rating update failed:", error.message);
    return false;
  }
  return true;
}

export async function deleteWorkflowLog(
  supabase: SupabaseClient,
  logId: string,
): Promise<boolean> {
  const { error } = await supabase.from("workflow_logs").delete().eq("id", logId);
  if (error) {
    console.error("[Meridian] workflow_logs delete failed:", error.message);
    return false;
  }
  return true;
}

type VariantLabelRow = {
  prompt_id: string;
  variant_key: string;
  label: string;
};

function variantRowsToMap(rows: VariantLabelRow[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const r of rows) {
    m[makeVariantLabelKey(r.prompt_id, r.variant_key)] = r.label;
  }
  return m;
}

function isMissingVariantLabelsTableError(err: { message?: string }): boolean {
  const m = (err.message ?? "").toLowerCase();
  return m.includes("prompt_variant_labels");
}

export async function loadVariantLabelsFromDb(
  supabase: SupabaseClient,
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("prompt_variant_labels")
    .select("prompt_id,variant_key,label");
  if (error) {
    if (isMissingVariantLabelsTableError(error)) {
      console.warn(
        "[Meridian] prompt_variant_labels missing — run supabase/migrations/005_prompt_variant_labels.sql",
      );
      return {};
    }
    throw error;
  }
  return variantRowsToMap((data ?? []) as VariantLabelRow[]);
}

export async function upsertVariantLabelRow(
  supabase: SupabaseClient,
  promptId: string,
  variantKey: string,
  label: string,
): Promise<boolean> {
  const { error } = await supabase.from("prompt_variant_labels").upsert(
    {
      prompt_id: promptId,
      variant_key: variantKey,
      label,
    },
    { onConflict: "prompt_id,variant_key" },
  );
  if (error) {
    console.error("[Meridian] prompt_variant_labels upsert failed:", error.message);
    return false;
  }
  return true;
}

export async function deleteVariantLabelRow(
  supabase: SupabaseClient,
  promptId: string,
  variantKey: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("prompt_variant_labels")
    .delete()
    .eq("prompt_id", promptId)
    .eq("variant_key", variantKey);
  if (error) {
    console.error("[Meridian] prompt_variant_labels delete failed:", error.message);
    return false;
  }
  return true;
}

export async function fetchPromptTemplateSnapshotFromLogs(
  supabase: SupabaseClient,
  promptId: string,
  fingerprint: string,
): Promise<string | null> {
  if (!fingerprint || fingerprint.startsWith("legacy:")) return null;
  const { data, error } = await supabase
    .from("workflow_logs")
    .select("prompt_template_snapshot")
    .eq("prompt_id", promptId)
    .eq("full_prompt_fingerprint", fingerprint)
    .not("prompt_template_snapshot", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("prompt_template_snapshot") || m.includes("does not exist")) {
      return null;
    }
    console.error("[Meridian] fetchPromptTemplateSnapshotFromLogs:", error.message);
    return null;
  }
  const t = (data as { prompt_template_snapshot?: string } | null)?.prompt_template_snapshot;
  return typeof t === "string" && t.trim() ? t : null;
}

/**
 * Resolve the raw workflow template for a variant (for copy on By workflow).
 * Order: latest log snapshot → DB catalog template if fingerprint matches → bundled seed categories.
 */
export async function resolveWorkflowPromptTemplate(
  supabase: SupabaseClient | null,
  promptId: string,
  categoryId: string,
  fingerprint: string,
): Promise<{ template: string } | { error: string }> {
  if (!fingerprint || fingerprint.startsWith("legacy:")) {
    return { error: "legacy_variant" };
  }
  if (supabase) {
    const snap = await fetchPromptTemplateSnapshotFromLogs(supabase, promptId, fingerprint);
    if (snap) return { template: snap };
    const { data: prow, error: pErr } = await supabase
      .from("prompts")
      .select("template")
      .eq("id", promptId)
      .maybeSingle();
    if (!pErr && prow?.template && typeof prow.template === "string") {
      const { fingerprint: fp } = fingerprintPromptTemplate(prow.template);
      if (fp === fingerprint) return { template: prow.template };
    }
  }
  for (const cat of INITIAL_CATEGORIES) {
    if (categoryId && cat.id !== categoryId) continue;
    const p = cat.prompts.find((x) => x.id === promptId);
    if (!p) continue;
    const { fingerprint: fp } = fingerprintPromptTemplate(p.template);
    if (fp === fingerprint) return { template: p.template };
  }
  return { error: "not_found" };
}
