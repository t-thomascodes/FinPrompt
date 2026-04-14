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
  variables: Variable[];
  enrichTicker?: string;
}

export interface Variable {
  key: string;
  label: string;
  placeholder: string;
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
  rating: number;
  fullPrompt: string;
  marketDataStructured?: MarketDataBundle | null;
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
}

export interface ExecuteRequestBody {
  template: string;
  variables: Record<string, string>;
  enrichTicker?: string;
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
}

export type ExportRequestBody = ExportPayload & {
  filename?: string;
};
