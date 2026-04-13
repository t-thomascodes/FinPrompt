"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CATEGORIES as INITIAL_CATEGORIES } from "@/lib/categories";
import { SEED_LOGS } from "@/lib/seedLogs";
import type { Category, PromptTemplate, WorkflowLog } from "@/lib/types";

export type AppView = "workflows" | "logs" | "analytics";

type ConfigState = {
  openaiConfigured: boolean;
  alphaVantageConfigured: boolean;
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
  marketData: string;
  setMarketData: (s: string) => void;
  logs: WorkflowLog[];
  setLogs: React.Dispatch<React.SetStateAction<WorkflowLog[]>>;
  config: ConfigState;
  refreshConfig: () => Promise<void>;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
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
  rateLog: (logId: number, rating: number) => void;
  activeCategoryObj: Category | undefined;
};

const FinPromptContext = createContext<FinPromptContextValue | null>(null);

export function FinPromptProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() =>
    structuredClone(INITIAL_CATEGORIES),
  );
  const [view, setView] = useState<AppView>("workflows");
  const [activeCategory, setActiveCategory] = useState("research");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(
    null,
  );
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");
  const [marketData, setMarketData] = useState("");
  const [logs, setLogs] = useState<WorkflowLog[]>(() =>
    structuredClone(SEED_LOGS),
  );
  const [config, setConfig] = useState<ConfigState>({
    openaiConfigured: false,
    alphaVantageConfigured: false,
  });
  const [showSettings, setShowSettings] = useState(false);
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
      setConfig(d);
    } catch {
      setConfig({
        openaiConfigured: false,
        alphaVantageConfigured: false,
      });
    }
  }, []);

  useEffect(() => {
    void refreshConfig();
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
    setMarketData("");
    setEditingPrompt(null);
  }, []);

  const handleRun = useCallback(async () => {
    if (!selectedPrompt) return;
    setLoading(true);
    setOutput("");
    setError("");
    setMarketData("");

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
      };

      setMarketData(data.marketData ?? "");
      setOutput(data.output ?? "");

      const newLog: WorkflowLog = {
        id: Date.now(),
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
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        prompts: cat.prompts.map((p) =>
          p.id === editingPrompt.id ? { ...p, template: editText } : p,
        ),
      })),
    );
    if (selectedPrompt?.id === editingPrompt.id) {
      setSelectedPrompt((prev) =>
        prev ? { ...prev, template: editText } : prev,
      );
    }
    setEditingPrompt(null);
    setEditText("");
  }, [editingPrompt, editText, selectedPrompt?.id]);

  const handleForkPrompt = useCallback(() => {
    if (!selectedPrompt) return;
    const fork: PromptTemplate = {
      ...selectedPrompt,
      id: `${selectedPrompt.id}-fork-${Date.now()}`,
      title: `${selectedPrompt.title} (Custom)`,
      template: editText || selectedPrompt.template,
    };
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === activeCategory
          ? { ...cat, prompts: [...cat.prompts, fork] }
          : cat,
      ),
    );
    setEditingPrompt(null);
    setEditText("");
    setSelectedPrompt(fork);
  }, [selectedPrompt, editText, activeCategory]);

  const rateLog = useCallback((logId: number, rating: number) => {
    setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, rating } : l)));
    setViewingLog((v) =>
      v?.id === logId ? { ...v, rating } : v,
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
      marketData,
      setMarketData,
      logs,
      setLogs,
      config,
      refreshConfig,
      showSettings,
      setShowSettings,
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
      activeCategoryObj,
    }),
    [
      categories,
      view,
      activeCategory,
      selectedPrompt,
      variables,
      output,
      loading,
      dataLoading,
      error,
      marketData,
      logs,
      config,
      refreshConfig,
      showSettings,
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
      activeCategoryObj,
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
