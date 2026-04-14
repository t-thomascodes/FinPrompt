"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CATEGORIES as INITIAL_CATEGORIES } from "@/lib/categories";
import { coerceWorkflowLog } from "@/lib/coerceWorkflowLog";
import { loadLocalCategories, saveLocalCategories } from "@/lib/localCatalogStorage";
import { SEED_LOGS } from "@/lib/seedLogs";
import type { Category, PromptTemplate, WorkflowLog } from "@/lib/types";
import type { MarketDataBundle } from "@/lib/marketDataTypes";
import { normalizeStarRating } from "@/lib/normalizeRating";

export type AppView = "workflows" | "logs" | "workflowHistory" | "analytics";

type ConfigState = {
  openaiConfigured: boolean;
  supabaseConfigured: boolean;
};

type FinPromptContextValue = {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  view: AppView;
  setView: (v: AppView) => void;
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  selectedPrompt: PromptTemplate | null;
  setSelectedPrompt: (p: PromptTemplate | null) => void;
  variables: Record<string, string>;
  setVariables: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  output: string;
  setOutput: (s: string) => void;
  loading: boolean;
  dataLoading: boolean;
  error: string;
  setError: (s: string) => void;
  /** Shown after execute when the run could not be written to Supabase (still visible until refresh). */
  logSyncWarning: string;
  marketData: string;
  setMarketData: (s: string) => void;
  marketStructured: MarketDataBundle | null;
  setMarketStructured: (b: MarketDataBundle | null) => void;
  logs: WorkflowLog[];
  setLogs: React.Dispatch<React.SetStateAction<WorkflowLog[]>>;
  config: ConfigState;
  refreshConfig: () => Promise<void>;
  editingPrompt: PromptTemplate | null;
  setEditingPrompt: (p: PromptTemplate | null) => void;
  editText: string;
  setEditText: (s: string) => void;
  viewingLog: WorkflowLog | null;
  setViewingLog: (l: WorkflowLog | null) => void;
  displayedText: string;
  typingDone: boolean;
  selectPrompt: (p: PromptTemplate) => void;
  handleRun: () => Promise<void>;
  handleSaveEdit: () => void;
  handleForkPrompt: () => void;
  rateLog: (logId: string, rating: number) => void | Promise<void>;
  /** Merge server-fetched fields (e.g. rating) into the in-memory log list. */
  mergeServerLog: (log: WorkflowLog) => void;
  activeCategoryObj: Category | undefined;
  dataHydrated: boolean;
  persistenceEnabled: boolean;
};

const FinPromptContext = createContext<FinPromptContextValue | null>(null);

const VIEW_STORAGE_KEY = "finprompt:active-view";

function readStoredView(): AppView | null {
  try {
    const s = sessionStorage.getItem(VIEW_STORAGE_KEY);
    if (
      s === "workflows" ||
      s === "logs" ||
      s === "workflowHistory" ||
      s === "analytics"
    )
      return s;
  } catch {
    /* private mode / quota */
  }
  return null;
}

export function FinPromptProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setViewState] = useState<AppView>("workflows");
  const [activeCategory, setActiveCategory] = useState("research");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(
    null,
  );
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");
  const [logSyncWarning, setLogSyncWarning] = useState("");
  const [marketData, setMarketData] = useState("");
  const [marketStructured, setMarketStructured] = useState<MarketDataBundle | null>(
    null,
  );
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [dataHydrated, setDataHydrated] = useState(false);
  const [persistenceEnabled, setPersistenceEnabled] = useState(false);
  const [config, setConfig] = useState<ConfigState>({
    openaiConfigured: false,
    supabaseConfigured: false,
  });
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(
    null,
  );
  const [editText, setEditText] = useState("");
  const [viewingLog, setViewingLog] = useState<WorkflowLog | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshConfig = useCallback(async () => {
    try {
      const r = await fetch("/api/config");
      const d = (await r.json()) as ConfigState;
      setConfig({
        openaiConfigured: Boolean(d.openaiConfigured),
        supabaseConfigured: Boolean(d.supabaseConfigured),
      });
    } catch {
      setConfig({
        openaiConfigured: false,
        supabaseConfigured: false,
      });
    }
  }, []);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  useLayoutEffect(() => {
    const v = readStoredView();
    if (v) setViewState(v);
  }, []);

  const setView = useCallback((v: AppView) => {
    setViewState(v);
    try {
      sessionStorage.setItem(VIEW_STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const hydrateSeq = useRef(0);

  useEffect(() => {
    const seq = ++hydrateSeq.current;
    const ac = new AbortController();
    void (async () => {
      try {
        const r = await fetch("/api/app-state", {
          cache: "no-store",
          signal: ac.signal,
        });
        let d: {
          persistence?: string;
          categories?: Category[];
          logs?: WorkflowLog[];
          warning?: string;
        };
        try {
          d = (await r.json()) as typeof d;
        } catch {
          throw new Error("app-state: response is not JSON");
        }
        if (!r.ok) {
          console.error("[FinPrompt] app-state HTTP", r.status, d);
          throw new Error(`app-state: HTTP ${r.status}`);
        }
        if (seq !== hydrateSeq.current) return;
        if (d.warning) console.warn(d.warning);
        if (Array.isArray(d.categories)) {
          if (d.persistence === "supabase") {
            setCategories(d.categories);
          } else {
            setCategories(loadLocalCategories() ?? d.categories);
          }
        }
        if (!Array.isArray(d.logs)) {
          console.error("[FinPrompt] app-state: missing or invalid logs[]", d);
          throw new Error("app-state: invalid payload");
        }
        setLogs(d.logs.map((item) => coerceWorkflowLog(item)));
        setPersistenceEnabled(d.persistence === "supabase");
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        const err = e as { name?: string };
        if (err?.name === "AbortError") return;
        if (seq !== hydrateSeq.current) return;
        setCategories(
          loadLocalCategories() ?? structuredClone(INITIAL_CATEGORIES),
        );
        setLogs(structuredClone(SEED_LOGS));
        setPersistenceEnabled(false);
      } finally {
        if (seq === hydrateSeq.current) setDataHydrated(true);
      }
    })();
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDisplayedText("");
    setTypingDone(false);
    if (!output) return;
    let i = 0;
    const step = output.length > 6000 ? 16 : output.length > 2000 ? 8 : 3;
    const intervalMs = output.length > 6000 ? 4 : 6;
    timerRef.current = setInterval(() => {
      i += step;
      setDisplayedText(output.slice(0, i));
      if (i >= output.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setDisplayedText(output);
        setTypingDone(true);
      }
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [output]);

  const activeCategoryObj = useMemo(
    () => categories.find((c) => c.id === activeCategory),
    [categories, activeCategory],
  );

  const selectPrompt = useCallback((p: PromptTemplate) => {
    setSelectedPrompt(p);
    setVariables({});
    setOutput("");
    setError("");
    setLogSyncWarning("");
    setMarketData("");
    setMarketStructured(null);
    setEditingPrompt(null);
  }, []);

  const handleRun = useCallback(async () => {
    if (!selectedPrompt) return;
    setLoading(true);
    setOutput("");
    setError("");
    setLogSyncWarning("");
    setMarketData("");
    setMarketStructured(null);

    const tk = selectedPrompt.enrichTicker;
    const ticker = tk ? variables[tk]?.trim().toUpperCase() : "";

    if (tk && ticker) {
      setDataLoading(true);
    }

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selectedPrompt.template,
          variables,
          enrichTicker: selectedPrompt.enrichTicker,
          logMeta: {
            promptId: selectedPrompt.id,
            promptTitle: selectedPrompt.title,
            categoryId: activeCategory,
            inputs: Object.values(variables).filter(Boolean).join(", "),
          },
        }),
      });

      const raw = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          typeof raw.error === "string"
            ? raw.error
            : "Workflow execution failed.",
        );
        setLoading(false);
        setDataLoading(false);
        return;
      }

      const data = raw as {
        output: string;
        marketData: string;
        hadData: boolean;
        fullPrompt: string;
        marketDataStructured?: MarketDataBundle | null;
        logId?: string | null;
        logSaveError?: string | null;
      };

      setMarketData(data.marketData ?? "");
      setMarketStructured(data.marketDataStructured ?? null);
      setOutput(data.output ?? "");

      const saveErr =
        typeof data.logSaveError === "string" ? data.logSaveError.trim() : "";
      if (saveErr) setLogSyncWarning(saveErr);

      const logId =
        typeof data.logId === "string" && data.logId.length > 0
          ? data.logId
          : `local-${globalThis.crypto?.randomUUID?.() ?? String(Date.now())}`;

      const newLog: WorkflowLog = {
        id: logId,
        promptId: selectedPrompt.id,
        promptTitle: selectedPrompt.title,
        categoryId: activeCategory,
        inputs: Object.values(variables).filter(Boolean).join(", "),
        variables: { ...variables },
        output: data.output ?? "",
        marketData: data.marketData ?? "",
        hadData: Boolean(data.hadData),
        timestamp: new Date().toLocaleString(),
        rating: 0,
        fullPrompt: data.fullPrompt ?? "",
        marketDataStructured: data.marketDataStructured ?? null,
      };
      setLogs((prev) => [newLog, ...prev]);
    } catch {
      setError("Network error while executing workflow.");
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  }, [selectedPrompt, variables, activeCategory]);

  const handleSaveEdit = useCallback(() => {
    if (!editingPrompt || !editText) return;
    const parentCat = categories.find((c) =>
      c.prompts.some((p) => p.id === editingPrompt.id),
    );
    const categoryId = parentCat?.id ?? activeCategory;
    const sortOrder = parentCat?.prompts.findIndex((p) => p.id === editingPrompt.id) ?? 0;
    const updated: PromptTemplate = { ...editingPrompt, template: editText };

    setCategories((prev) => {
      const next = prev.map((cat) => ({
        ...cat,
        prompts: cat.prompts.map((p) =>
          p.id === editingPrompt.id ? { ...p, template: editText } : p,
        ),
      }));
      if (!persistenceEnabled) saveLocalCategories(next);
      return next;
    });
    if (selectedPrompt?.id === editingPrompt.id) {
      setSelectedPrompt((prev) =>
        prev ? { ...prev, template: editText } : prev,
      );
    }
    setEditingPrompt(null);
    setEditText("");

    if (persistenceEnabled && sortOrder >= 0) {
      void fetch("/api/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          prompt: updated,
          sortOrder,
        }),
      }).catch(() => {
        console.error("[FinPrompt] Failed to persist prompt edit");
      });
    }
  }, [
    editingPrompt,
    editText,
    selectedPrompt?.id,
    categories,
    activeCategory,
    persistenceEnabled,
  ]);

  const handleForkPrompt = useCallback(() => {
    if (!selectedPrompt) return;
    const cat = categories.find((c) => c.id === activeCategory);
    const sortOrder = cat ? cat.prompts.length : 0;
    const fork: PromptTemplate = {
      ...selectedPrompt,
      id: `${selectedPrompt.id}-fork-${Date.now()}`,
      title: `${selectedPrompt.title} (Custom)`,
      template: editText || selectedPrompt.template,
    };

    if (persistenceEnabled) {
      void fetch("/api/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: activeCategory,
          prompt: fork,
          sortOrder,
        }),
      }).catch(() => {
        console.error("[FinPrompt] Failed to persist forked prompt");
      });
    }

    setCategories((prev) => {
      const next = prev.map((c) =>
        c.id === activeCategory
          ? { ...c, prompts: [...c.prompts, fork] }
          : c,
      );
      if (!persistenceEnabled) saveLocalCategories(next);
      return next;
    });
    setEditingPrompt(null);
    setEditText("");
    setSelectedPrompt(fork);
  }, [selectedPrompt, editText, activeCategory, categories, persistenceEnabled]);

  const rateLog = useCallback(
    async (logId: string, rating: number) => {
      setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, rating } : l)));
      setViewingLog((v) => (v?.id === logId ? { ...v, rating } : v));

      if (!persistenceEnabled) return;
      if (logId.startsWith("seed-") || logId.startsWith("local-")) return;

      try {
        const res = await fetch(`/api/logs/${encodeURIComponent(logId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        });
        if (!res.ok) console.error("[FinPrompt] Rating was not saved to the database");
      } catch {
        console.error("[FinPrompt] Rating sync failed");
      }
    },
    [persistenceEnabled],
  );

  const mergeServerLog = useCallback((log: WorkflowLog) => {
    const rating = normalizeStarRating(log.rating);
    setLogs((prev) =>
      prev.map((l) =>
        l.id === log.id
          ? {
              ...l,
              ...log,
              rating,
              marketDataStructured:
                log.marketDataStructured ?? l.marketDataStructured ?? null,
            }
          : l,
      ),
    );
  }, []);

  const value = useMemo(
    (): FinPromptContextValue => ({
      categories,
      setCategories,
      view,
      setView,
      activeCategory,
      setActiveCategory,
      selectedPrompt,
      setSelectedPrompt,
      variables,
      setVariables,
      output,
      setOutput,
      loading,
      dataLoading,
      error,
      setError,
      logSyncWarning,
      marketData,
      setMarketData,
      marketStructured,
      setMarketStructured,
      logs,
      setLogs,
      config,
      refreshConfig,
      editingPrompt,
      setEditingPrompt,
      editText,
      setEditText,
      viewingLog,
      setViewingLog,
      displayedText,
      typingDone,
      selectPrompt,
      handleRun,
      handleSaveEdit,
      handleForkPrompt,
      rateLog,
      mergeServerLog,
      activeCategoryObj,
      dataHydrated,
      persistenceEnabled,
    }),
    [
      categories,
      view,
      setView,
      activeCategory,
      selectedPrompt,
      variables,
      output,
      loading,
      dataLoading,
      error,
      logSyncWarning,
      marketData,
      marketStructured,
      logs,
      config,
      refreshConfig,
      editingPrompt,
      editText,
      viewingLog,
      displayedText,
      typingDone,
      selectPrompt,
      handleRun,
      handleSaveEdit,
      handleForkPrompt,
      rateLog,
      mergeServerLog,
      activeCategoryObj,
      dataHydrated,
      persistenceEnabled,
    ],
  );

  return (
    <FinPromptContext.Provider value={value}>{children}</FinPromptContext.Provider>
  );
}

export function useFinPrompt() {
  const ctx = useContext(FinPromptContext);
  if (!ctx) throw new Error("useFinPrompt must be used within FinPromptProvider");
  return ctx;
}
