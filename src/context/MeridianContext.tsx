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
import {
  loadLocalVariantLabels,
  saveLocalVariantLabels,
} from "@/lib/localVariantLabelStorage";
import { isForkedPromptId } from "@/lib/promptFork";
import { makeVariantLabelKey } from "@/lib/variantLabelKey";
import { SEED_LOGS } from "@/lib/seedLogs";
import type { Category, PromptTemplate, WorkflowLog } from "@/lib/types";
import type { MarketDataBundle } from "@/lib/marketDataTypes";
import { normalizeStarRating } from "@/lib/normalizeRating";
import { validateTemplatePlaceholdersPreserved } from "@/lib/templateDisplay";
import {
  buildFullTemplate,
  getInstructionBody,
} from "@/lib/promptInstructionFooter";
import { mergeSeedPromptVariables } from "@/lib/mergeSeedPromptVariables";

export type AppView = "workflows" | "logs" | "workflowHistory" | "analytics";

type ConfigState = {
  workflowsReady: boolean;
  supabaseConfigured: boolean;
};

type MeridianContextValue = {
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
  deleteLog: (logId: string) => void | Promise<void>;
  /** Custom names for template versions (By workflow → prompt groups), keyed by `makeVariantLabelKey`. */
  variantLabels: Record<string, string>;
  setVariantLabel: (promptId: string, variantKey: string, label: string) => boolean;
  /** Rename a forked workflow’s display title (sidebar Custom section). */
  renameForkedPromptTitle: (
    categoryId: string,
    promptId: string,
    title: string,
  ) => boolean;
  /** Merge server-fetched fields (e.g. rating) into the in-memory log list. */
  mergeServerLog: (log: WorkflowLog) => void;
  activeCategoryObj: Category | undefined;
  dataHydrated: boolean;
  persistenceEnabled: boolean;
};

const MeridianContext = createContext<MeridianContextValue | null>(null);

const VIEW_STORAGE_KEY = "meridian:active-view";

/** Unique URL so browsers/proxies cannot serve a stale cached /api/app-state body after reload. */
function appStateUrl(): string {
  return `/api/app-state?_=${Date.now()}&r=${Math.random().toString(36).slice(2, 10)}`;
}

const APP_STATE_FETCH_BASE: Pick<RequestInit, "cache" | "headers"> = {
  cache: "no-store",
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
};

const PERSISTED_LOG_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export function MeridianProvider({ children }: { children: React.ReactNode }) {
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
  const [variantLabels, setVariantLabels] = useState<Record<string, string>>({});
  const [dataHydrated, setDataHydrated] = useState(false);
  const [persistenceEnabled, setPersistenceEnabled] = useState(false);
  const [config, setConfig] = useState<ConfigState>({
    workflowsReady: false,
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
  /** Latest /api/config flag — hydrate error paths use this so we never show demo logs when the server expects Supabase. */
  const supabaseConfiguredRef = useRef(false);

  const refreshConfig = useCallback(async () => {
    try {
      const r = await fetch("/api/config");
      const d = (await r.json()) as ConfigState;
      const supa = Boolean(d.supabaseConfigured);
      supabaseConfiguredRef.current = supa;
      setConfig({
        workflowsReady: Boolean(d.workflowsReady),
        supabaseConfigured: supa,
      });
    } catch {
      supabaseConfiguredRef.current = false;
      setConfig({
        workflowsReady: false,
        supabaseConfigured: false,
      });
    }
  }, []);

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
  /** Strict Mode runs hydrate twice; if the first fetch succeeds and the second fails, do not clobber with SEED_LOGS. */
  const hydrateSucceeded = useRef(false);

  useEffect(() => {
    const seq = ++hydrateSeq.current;
    const ac = new AbortController();
    void (async () => {
      let finishedHydration = false;
      try {
        await refreshConfig();
        const r = await fetch(appStateUrl(), {
          ...APP_STATE_FETCH_BASE,
          signal: ac.signal,
        });
        let d: {
          persistence?: string;
          categories?: Category[];
          logs?: WorkflowLog[];
          variantLabels?: Record<string, string>;
          error?: string;
        };
        try {
          d = (await r.json()) as typeof d;
        } catch {
          throw new Error("app-state: response is not JSON");
        }
        if (!r.ok) {
          if (d.persistence === "supabase") {
            if (seq !== hydrateSeq.current) return;
            setError(
              typeof d.error === "string" && d.error
                ? d.error
                : `Could not load app data (HTTP ${r.status}). Check Vercel logs and Supabase.`,
            );
            setCategories(
              mergeSeedPromptVariables(structuredClone(INITIAL_CATEGORIES)),
            );
            setLogs([]);
            setVariantLabels({});
            setPersistenceEnabled(true);
            hydrateSucceeded.current = false;
            finishedHydration = true;
            return;
          }
          console.error("[Meridian] app-state HTTP", r.status, d);
          throw new Error(`app-state: HTTP ${r.status}`);
        }
        if (seq !== hydrateSeq.current) return;
        setError("");
        if (Array.isArray(d.categories)) {
          if (d.persistence === "supabase") {
            setCategories(mergeSeedPromptVariables(d.categories));
          } else {
            setCategories(
              mergeSeedPromptVariables(loadLocalCategories() ?? d.categories),
            );
          }
        }
        if (!Array.isArray(d.logs)) {
          console.error("[Meridian] app-state: missing or invalid logs[]", d);
          throw new Error("app-state: invalid payload");
        }
        if (seq !== hydrateSeq.current) return;
        setLogs(d.logs.map((item) => coerceWorkflowLog(item)));
        setPersistenceEnabled(d.persistence === "supabase");
        if (d.persistence === "supabase") {
          setVariantLabels(
            d.variantLabels &&
              typeof d.variantLabels === "object" &&
              !Array.isArray(d.variantLabels)
              ? d.variantLabels
              : {},
          );
        } else {
          setVariantLabels(loadLocalVariantLabels() ?? {});
        }
        hydrateSucceeded.current = true;
        finishedHydration = true;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        const err = e as { name?: string };
        if (err?.name === "AbortError") return;
        if (seq !== hydrateSeq.current) return;
        if (hydrateSucceeded.current) {
          console.warn(
            "[Meridian] app-state: a later hydrate request failed; keeping data from the successful load.",
            e,
          );
          finishedHydration = true;
          const recoverForSeq = seq;
          void (async () => {
            try {
              const r = await fetch(appStateUrl(), APP_STATE_FETCH_BASE);
              let d: {
                logs?: unknown[];
                categories?: Category[];
                persistence?: string;
                variantLabels?: Record<string, string>;
                error?: string;
              };
              try {
                d = (await r.json()) as typeof d;
              } catch {
                return;
              }
              if (!r.ok) {
                if (d.persistence === "supabase") {
                  const msg =
                    typeof d.error === "string" && d.error
                      ? d.error
                      : `Could not reload app data (HTTP ${r.status}).`;
                  if (recoverForSeq === hydrateSeq.current) setError(msg);
                }
                return;
              }
              if (recoverForSeq !== hydrateSeq.current) return;
              setError("");
              if (Array.isArray(d.logs)) {
                setLogs(d.logs.map((item) => coerceWorkflowLog(item)));
              }
              if (Array.isArray(d.categories)) {
                if (d.persistence === "supabase") {
                  setCategories(mergeSeedPromptVariables(d.categories));
                } else {
                  setCategories(
                    mergeSeedPromptVariables(loadLocalCategories() ?? d.categories),
                  );
                }
              }
              if (d.persistence === "supabase" || d.persistence === "local") {
                setPersistenceEnabled(d.persistence === "supabase");
              }
              if (d.persistence === "supabase") {
                if (
                  d.variantLabels &&
                  typeof d.variantLabels === "object" &&
                  !Array.isArray(d.variantLabels)
                ) {
                  setVariantLabels(d.variantLabels);
                }
              } else if (d.persistence === "local") {
                setVariantLabels(loadLocalVariantLabels() ?? {});
              }
            } catch {
              /* keep prior state */
            }
          })();
          return;
        }
        if (supabaseConfiguredRef.current) {
          setError(
            e instanceof Error
              ? e.message
              : "Could not load app state. Check your network and try refreshing.",
          );
          setCategories(
            mergeSeedPromptVariables(structuredClone(INITIAL_CATEGORIES)),
          );
          setLogs([]);
          setVariantLabels({});
          setPersistenceEnabled(true);
          finishedHydration = true;
          return;
        }
        setCategories(
          mergeSeedPromptVariables(
            loadLocalCategories() ?? structuredClone(INITIAL_CATEGORIES),
          ),
        );
        setLogs(structuredClone(SEED_LOGS));
        setVariantLabels(loadLocalVariantLabels() ?? {});
        setPersistenceEnabled(false);
        finishedHydration = true;
      } finally {
        if (finishedHydration && seq === hydrateSeq.current) {
          setDataHydrated(true);
        }
      }
    })();
    return () => ac.abort();
  }, [refreshConfig]);

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

  /**
   * Replace the log list from /api/app-state only once the new row is visible there.
   * Avoids overwriting the optimistic prepend with a stale read (replica / timing).
   */
  const reconcileLogsAfterPersistedRun = useCallback((expectedLogId: string) => {
    const maxAttempts = 8;
    const delayMs = 350;

    void (async () => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, attempt === 0 ? 250 : delayMs));
        try {
          const r = await fetch(appStateUrl(), APP_STATE_FETCH_BASE);
          if (!r.ok) continue;
          const d = (await r.json()) as { logs?: unknown[] };
          if (!Array.isArray(d.logs)) continue;
          const mapped = d.logs.map((item) => coerceWorkflowLog(item));
          if (mapped.some((l) => l.id === expectedLogId)) {
            setLogs(mapped);
            return;
          }
        } catch {
          /* retry */
        }
      }
    })();
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
          enrichPeerTickers: selectedPrompt.enrichPeerTickers,
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
        fullPromptFingerprint?: string;
        fullPromptExcerpt?: string;
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

      const now = new Date();
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
        createdAt: now.toISOString(),
        timestamp: now.toLocaleString(),
        rating: 0,
        fullPrompt: data.fullPrompt ?? "",
        marketDataStructured: data.marketDataStructured ?? null,
        fullPromptFingerprint:
          typeof data.fullPromptFingerprint === "string" &&
          data.fullPromptFingerprint
            ? data.fullPromptFingerprint
            : undefined,
        fullPromptExcerpt:
          typeof data.fullPromptExcerpt === "string" && data.fullPromptExcerpt
            ? data.fullPromptExcerpt
            : undefined,
      };
      setLogs((prev) => [newLog, ...prev]);
      if (
        typeof data.logId === "string" &&
        data.logId.length > 0 &&
        !data.logId.startsWith("local-")
      ) {
        reconcileLogsAfterPersistedRun(data.logId);
      }
    } catch {
      setError("Network error while executing workflow.");
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  }, [selectedPrompt, variables, activeCategory, reconcileLogsAfterPersistedRun]);

  const handleSaveEdit = useCallback(() => {
    if (!editingPrompt) return;
    const fullTemplate = buildFullTemplate(
      editText,
      editingPrompt.instructionFooter,
    );
    if (!fullTemplate.trim()) return;
    const slotErr = validateTemplatePlaceholdersPreserved(
      editingPrompt.template,
      fullTemplate,
    );
    if (slotErr) {
      setError(slotErr);
      return;
    }
    setError("");
    const parentCat = categories.find((c) =>
      c.prompts.some((p) => p.id === editingPrompt.id),
    );
    const categoryId = parentCat?.id ?? activeCategory;
    const sortOrder = parentCat?.prompts.findIndex((p) => p.id === editingPrompt.id) ?? 0;
    const updated: PromptTemplate = {
      ...editingPrompt,
      template: fullTemplate,
    };

    setCategories((prev) => {
      const next = prev.map((cat) => ({
        ...cat,
        prompts: cat.prompts.map((p) =>
          p.id === editingPrompt.id ? { ...p, template: fullTemplate } : p,
        ),
      }));
      if (!persistenceEnabled) saveLocalCategories(next);
      return next;
    });
    if (selectedPrompt?.id === editingPrompt.id) {
      setSelectedPrompt((prev) =>
        prev
          ? {
              ...prev,
              template: fullTemplate,
              instructionFooter: editingPrompt.instructionFooter ?? prev.instructionFooter,
            }
          : prev,
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
        console.error("[Meridian] Failed to persist prompt edit");
      });
    }
  }, [
    editingPrompt,
    editText,
    selectedPrompt?.id,
    categories,
    activeCategory,
    persistenceEnabled,
    setError,
  ]);

  const handleForkPrompt = useCallback(() => {
    if (!selectedPrompt) return;
    const body =
      editText ||
      getInstructionBody(
        selectedPrompt.template,
        selectedPrompt.instructionFooter,
      );
    const forkTemplate = buildFullTemplate(body, selectedPrompt.instructionFooter);
    const slotErr = validateTemplatePlaceholdersPreserved(
      selectedPrompt.template,
      forkTemplate,
    );
    if (slotErr) {
      setError(slotErr);
      return;
    }
    setError("");
    const cat = categories.find((c) => c.id === activeCategory);
    const sortOrder = cat ? cat.prompts.length : 0;
    const fork: PromptTemplate = {
      ...selectedPrompt,
      id: `${selectedPrompt.id}-fork-${Date.now()}`,
      title: `${selectedPrompt.title} (Custom)`,
      template: forkTemplate,
      instructionFooter: selectedPrompt.instructionFooter,
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
        console.error("[Meridian] Failed to persist forked prompt");
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
  }, [
    selectedPrompt,
    editText,
    activeCategory,
    categories,
    persistenceEnabled,
    setError,
  ]);

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
        if (!res.ok) console.error("[Meridian] Rating was not saved to the database");
      } catch {
        console.error("[Meridian] Rating sync failed");
      }
    },
    [persistenceEnabled],
  );

  const deleteLog = useCallback(
    async (logId: string) => {
      if (!window.confirm("Delete this run? This cannot be undone.")) return;
      setViewingLog((v) => (v?.id === logId ? null : v));
      setLogs((prev) => prev.filter((l) => l.id !== logId));

      if (!persistenceEnabled) return;
      if (!PERSISTED_LOG_ID_RE.test(logId)) return;

      try {
        const res = await fetch(`/api/logs/${encodeURIComponent(logId)}`, {
          method: "DELETE",
        });
        if (!res.ok) console.error("[Meridian] Log was not deleted from the database");
      } catch {
        console.error("[Meridian] Log delete failed");
      }
    },
    [persistenceEnabled],
  );

  const setVariantLabel = useCallback(
    (promptId: string, variantKey: string, label: string): boolean => {
      const mapKey = makeVariantLabelKey(promptId, variantKey);
      const t = label.trim();
      if (!t) {
        setVariantLabels((prev) => {
          if (!(mapKey in prev)) return prev;
          const next = { ...prev };
          delete next[mapKey];
          if (!persistenceEnabled) saveLocalVariantLabels(next);
          return next;
        });
        if (persistenceEnabled) {
          void fetch("/api/variant-labels", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ promptId, variantKey, label: "" }),
          }).catch(() => {
            console.error("[Meridian] Failed to clear variant label");
          });
        }
        setError("");
        return true;
      }
      if (t.length > 120) {
        setError("Prompt name must be 120 characters or fewer.");
        return false;
      }
      setError("");
      setVariantLabels((prev) => {
        const next = { ...prev, [mapKey]: t };
        if (!persistenceEnabled) saveLocalVariantLabels(next);
        return next;
      });
      if (persistenceEnabled) {
        void fetch("/api/variant-labels", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId, variantKey, label: t }),
        }).catch(() => {
          console.error("[Meridian] Failed to persist variant label");
        });
      }
      return true;
    },
    [persistenceEnabled, setError],
  );

  const renameForkedPromptTitle = useCallback(
    (categoryId: string, promptId: string, title: string): boolean => {
      if (!isForkedPromptId(promptId)) {
        setError("Only forked workflows can be renamed here.");
        return false;
      }
      const t = title.trim();
      if (!t) {
        setError("Workflow name cannot be empty.");
        return false;
      }
      if (t.length > 120) {
        setError("Workflow name must be 120 characters or fewer.");
        return false;
      }
      let applied = false;
      setCategories((prev) => {
        const cat = prev.find((c) => c.id === categoryId);
        const prompt = cat?.prompts.find((p) => p.id === promptId);
        if (!cat || !prompt || !isForkedPromptId(prompt.id)) return prev;
        applied = true;
        const sortOrder = cat.prompts.findIndex((p) => p.id === promptId);
        const updated: PromptTemplate = { ...prompt, title: t };
        const next = prev.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                prompts: c.prompts.map((p) =>
                  p.id === promptId ? updated : p,
                ),
              }
            : c,
        );
        if (persistenceEnabled) {
          void fetch("/api/prompts", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryId, prompt: updated, sortOrder }),
          }).catch(() => {
            console.error("[Meridian] Failed to persist fork rename");
          });
        } else {
          saveLocalCategories(next);
        }
        return next;
      });
      if (!applied) return false;
      setError("");
      setLogs((prev) =>
        prev.map((l) =>
          l.promptId === promptId && l.categoryId === categoryId
            ? { ...l, promptTitle: t }
            : l,
        ),
      );
      setSelectedPrompt((prev) =>
        prev?.id === promptId ? { ...prev, title: t } : prev,
      );
      return true;
    },
    [persistenceEnabled, setError],
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
    (): MeridianContextValue => ({
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
      deleteLog,
      variantLabels,
      setVariantLabel,
      renameForkedPromptTitle,
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
      variantLabels,
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
      deleteLog,
      setVariantLabel,
      renameForkedPromptTitle,
      mergeServerLog,
      activeCategoryObj,
      dataHydrated,
      persistenceEnabled,
    ],
  );

  return (
    <MeridianContext.Provider value={value}>{children}</MeridianContext.Provider>
  );
}

export function useMeridian() {
  const ctx = useContext(MeridianContext);
  if (!ctx) throw new Error("useMeridian must be used within MeridianProvider");
  return ctx;
}
