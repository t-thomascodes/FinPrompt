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
  id: number;
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
}

export interface MarketDataResult {
  quote: Record<string, string> | null;
  overview: Record<string, string> | null;
  news: Array<{
    title: string;
    source: string;
    overall_sentiment_label: string;
  }>;
  formatted: string;
}

export interface ExportPayload {
  title: string;
  output: string;
  marketData?: string;
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
}

export interface ExecuteResponseBody {
  output: string;
  marketData: string;
  hadData: boolean;
  fullPrompt: string;
}

export type ExportRequestBody = ExportPayload & {
  filename?: string;
};
