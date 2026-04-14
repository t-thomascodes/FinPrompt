import type { MarketDataBundle } from "@/lib/marketDataTypes";

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  prompts: PromptTemplate[];
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  template: string;
  /**
   * When set, the editor only shows the instruction body; this suffix is appended on save/run.
   * Stored in Supabase as `instruction_footer` when configured.
   */
  instructionFooter?: string;
  variables: Variable[];
  enrichTicker?: string;
  /**
   * Variable key whose value is comma-separated peer tickers; each gets a compact live data block appended to MARKET_DATA.
   */
  enrichPeerTickers?: string;
}

export interface Variable {
  key: string;
  label: string;
  placeholder: string;
  /** When true, empty value still allows Execute (e.g. optional peer tickers). */
  optional?: boolean;
}

export interface WorkflowLog {
  id: string;
  promptId: string;
  promptTitle: string;
  categoryId: string;
  inputs: string;
  variables: Record<string, string>;
  output: string;
  marketData: string;
  hadData: boolean;
  timestamp: string;
  /** ISO 8601 from `created_at` when available — used for analytics bucketing. */
  createdAt?: string;
  rating: number;
  fullPrompt: string;
  marketDataStructured?: MarketDataBundle | null;
  /** sha256 prefix of the workflow template string (before ticker/market fill) */
  fullPromptFingerprint?: string;
  /** One-line preview of that template (may include {{placeholders}}) */
  fullPromptExcerpt?: string;
}

export interface ExportPayload {
  title: string;
  output: string;
  marketData?: string;
  marketDataStructured?: MarketDataBundle | null;
  category: string;
  inputs: string;
  timestamp: string;
  rating?: number;
  fullPrompt?: string;
  /**
   * Optional PNG of the metrics/charts dashboard (`data:image/png;base64,...` or raw base64).
   * When set, Word export embeds this instead of raw `marketData` text.
   */
  dashboardPngBase64?: string;
}

export interface ExecuteRequestBody {
  template: string;
  variables: Record<string, string>;
  enrichTicker?: string;
  enrichPeerTickers?: string;
  /** Persisted to Supabase when configured */
  logMeta?: {
    promptId: string;
    promptTitle: string;
    categoryId: string;
    inputs: string;
  };
}

export interface ExecuteResponseBody {
  output: string;
  marketData: string;
  hadData: boolean;
  fullPrompt: string;
  marketDataStructured: MarketDataBundle | null;
  /** Populated when the run is stored in Supabase */
  logId?: string | null;
  /**
   * When Supabase is configured and saving was attempted but failed (e.g. DB error).
   * The client still shows the run, but it will not appear after refresh.
   */
  logSaveError?: string | null;
  fullPromptFingerprint?: string;
  fullPromptExcerpt?: string;
}

export type ExportRequestBody = ExportPayload & {
  filename?: string;
};
