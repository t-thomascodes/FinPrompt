"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { useMeridian } from "@/context/MeridianContext";
import { LogRunRow } from "@/components/LogsList";
import { formatTemplatePreviewForUi } from "@/lib/templateDisplay";
import type { Category, Variable, WorkflowLog } from "@/lib/types";
import { makeVariantLabelKey } from "@/lib/variantLabelKey";
import {
  useVariantTemplatePanel,
  VariantTemplateExpansion,
  VariantTemplateToolbar,
} from "@/components/VariantTemplatePanel";

function stableLegacyVariantKey(log: WorkflowLog): string {
  const keys = Object.keys(log.variables).sort();
  const body = keys.map((k) => `${k}=${log.variables[k] ?? ""}`).join("&");
  return `legacy:${log.categoryId}:${log.promptId}:${body}|${log.inputs}`;
}

function variantKey(log: WorkflowLog): string {
  if (log.fullPromptFingerprint) return log.fullPromptFingerprint;
  return stableLegacyVariantKey(log);
}

function variantExcerpt(logs: WorkflowLog[], variables?: Variable[]): string {
  const stored = logs.find((l) => l.fullPromptExcerpt?.trim());
  if (stored?.fullPromptExcerpt) {
    return formatTemplatePreviewForUi(stored.fullPromptExcerpt, variables, 180);
  }
  const withFull = logs.find((l) => l.fullPrompt?.trim());
  if (withFull?.fullPrompt) {
    return formatTemplatePreviewForUi(withFull.fullPrompt, variables, 180);
  }
  return "Open a run to see the prompt. Older rows may not store an excerpt.";
}

function resolveWorkflowTitle(
  categoryId: string,
  promptId: string,
  categories: Category[],
  fallback: string,
): string {
  const cat = categories.find((c) => c.id === categoryId);
  const p = cat?.prompts.find((x) => x.id === promptId);
  return p?.title ?? fallback;
}

type VariantGroup = {
  variantKey: string;
  excerpt: string;
  logs: WorkflowLog[];
};

type WorkflowGroup = {
  workflowKey: string;
  categoryId: string;
  promptId: string;
  title: string;
  category: Category | undefined;
  variants: VariantGroup[];
};

const DIVISION_ORDER = ["research", "risk", "operations"] as const;
type DivisionId = (typeof DIVISION_ORDER)[number];

type DivisionSection = {
  id: string;
  label: string;
  icon: string;
  color: string;
  workflows: WorkflowGroup[];
};

function partitionByDivision(
  tree: WorkflowGroup[],
  categories: Category[],
): DivisionSection[] {
  const buckets = new Map<string, WorkflowGroup[]>();
  for (const id of DIVISION_ORDER) buckets.set(id, []);
  const other: WorkflowGroup[] = [];

  for (const w of tree) {
    if (DIVISION_ORDER.includes(w.categoryId as DivisionId)) {
      buckets.get(w.categoryId)!.push(w);
    } else {
      other.push(w);
    }
  }

  const sections: DivisionSection[] = DIVISION_ORDER.map((id) => {
    const cat = categories.find((c) => c.id === id);
    return {
      id,
      label: cat?.label ?? id,
      icon: cat?.icon ?? "",
      color: cat?.color ?? "#888888",
      workflows: buckets.get(id) ?? [],
    };
  });

  if (other.length > 0) {
    sections.push({
      id: "_other",
      label: "Other",
      icon: "\u25CA",
      color: "#854F0B",
      workflows: other,
    });
  }

  return sections;
}

function buildTree(categories: Category[], logs: WorkflowLog[]): WorkflowGroup[] {
  const wfMap = new Map<string, WorkflowLog[]>();
  const wfFirstIdx = new Map<string, number>();

  logs.forEach((log, i) => {
    const wk = `${log.categoryId}\0${log.promptId}`;
    if (!wfFirstIdx.has(wk)) wfFirstIdx.set(wk, i);
    let list = wfMap.get(wk);
    if (!list) {
      list = [];
      wfMap.set(wk, list);
    }
    list.push(log);
  });

  const catOrder = new Map(categories.map((c, i) => [c.id, i] as const));

  return Array.from(wfMap.entries())
    .map(([workflowKey, wfLogs]) => {
      const [categoryId, promptId] = workflowKey.split("\0") as [string, string];
      const byVariant = new Map<string, WorkflowLog[]>();
      const varFirstIdx = new Map<string, number>();

      wfLogs.forEach((log, j) => {
        const vk = variantKey(log);
        if (!varFirstIdx.has(vk)) varFirstIdx.set(vk, j);
        let vl = byVariant.get(vk);
        if (!vl) {
          vl = [];
          byVariant.set(vk, vl);
        }
        vl.push(log);
      });

      const cat = categories.find((c) => c.id === categoryId);
      const promptMeta = cat?.prompts.find((p) => p.id === promptId);
      const promptVariables = promptMeta?.variables;

      const variants: VariantGroup[] = Array.from(byVariant.entries())
        .map(([vk, vl]) => ({
          variantKey: vk,
          excerpt: variantExcerpt(vl, promptVariables),
          logs: vl,
        }))
        .sort((a, b) => (varFirstIdx.get(a.variantKey) ?? 0) - (varFirstIdx.get(b.variantKey) ?? 0));

      return {
        workflowKey,
        categoryId,
        promptId,
        title: resolveWorkflowTitle(
          categoryId,
          promptId,
          categories,
          wfLogs[0]?.promptTitle ?? promptId,
        ),
        category: categories.find((c) => c.id === categoryId),
        variants,
      };
    })
    .sort((a, b) => {
      const byCat =
        (catOrder.get(a.categoryId) ?? 999) - (catOrder.get(b.categoryId) ?? 999);
      if (byCat !== 0) return byCat;
      return (
        (wfFirstIdx.get(a.workflowKey) ?? 0) - (wfFirstIdx.get(b.workflowKey) ?? 0)
      );
    });
}

type VariantRenameState = {
  varUiKey: string;
  promptId: string;
  variantKey: string;
  draft: string;
};

type HistoryVariantRowProps = {
  wf: WorkflowGroup;
  v: VariantGroup;
  vi: number;
  section: DivisionSection;
  varUiKey: string;
  vOpen: boolean;
  toggleVar: (key: string) => void;
  variantLabels: Record<string, string>;
  setVariantLabel: (promptId: string, variantKey: string, label: string) => boolean;
  setError: (s: string) => void;
  variantRename: VariantRenameState | null;
  setVariantRename: Dispatch<SetStateAction<VariantRenameState | null>>;
  setViewingLog: (log: WorkflowLog | null) => void;
  rateLog: (logId: string, rating: number) => void | Promise<void>;
  deleteLog: (logId: string) => void | Promise<void>;
};

function HistoryVariantRow({
  wf,
  v,
  vi,
  section,
  varUiKey,
  vOpen,
  toggleVar,
  variantLabels,
  setVariantLabel,
  setError,
  variantRename,
  setVariantRename,
  setViewingLog,
  rateLog,
  deleteLog,
}: HistoryVariantRowProps) {
  const tmplVm = useVariantTemplatePanel({
    promptId: wf.promptId,
    categoryId: wf.categoryId,
    variantKey: v.variantKey,
  });
  const fp = v.logs[0]?.fullPromptFingerprint;
  const defaultPromptLabel = `Prompt ${vi + 1}`;
  const vk = makeVariantLabelKey(wf.promptId, v.variantKey);
  const displayLabel = variantLabels[vk]?.trim() || defaultPromptLabel;
  const editingThis = variantRename?.varUiKey === varUiKey;

  return (
    <li className="rounded-fp-card border-[0.5px] border-fp-border/80 bg-fp-bg/40">
      <div className="flex flex-col gap-1 px-2.5 py-2 transition-colors hover:bg-fp-surface-secondary/50">
        <div className="flex w-full flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleVar(varUiKey)}
            className="shrink-0 font-mono text-[10px] text-fp-text-muted"
            aria-expanded={vOpen}
            aria-label={vOpen ? "Collapse runs" : "Expand runs"}
          >
            {vOpen ? "\u25BC" : "\u25B6"}
          </button>
          <div className="min-w-0 flex-1">
            {editingThis && variantRename ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={variantRename.draft}
                  onChange={(e) =>
                    setVariantRename((prev) =>
                      prev ? { ...prev, draft: e.target.value } : prev,
                    )
                  }
                  className="min-w-[10rem] flex-1 rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface px-2 py-1 font-sans text-[11px] font-semibold text-fp-text-primary outline-none focus:ring-2 focus:ring-offset-1"
                  style={
                    {
                      ["--tw-ring-color" as string]: `${section.color}55`,
                    } as CSSProperties
                  }
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    const ok = setVariantLabel(
                      variantRename.promptId,
                      variantRename.variantKey,
                      variantRename.draft,
                    );
                    if (ok) setVariantRename(null);
                  }}
                  className="rounded-fp-btn px-2 py-1 font-sans text-[10px] font-bold text-white"
                  style={{ background: section.color }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setVariantRename(null);
                  }}
                  className="rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface-secondary px-2 py-1 font-sans text-[10px] text-fp-text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVariantLabel(variantRename.promptId, variantRename.variantKey, "");
                    setVariantRename(null);
                    setError("");
                  }}
                  className="rounded-fp-btn border-[0.5px] border-fp-border bg-transparent px-2 py-1 font-sans text-[10px] text-fp-text-muted hover:text-fp-text-secondary"
                >
                  Reset name
                </button>
              </div>
            ) : (
              <span className="inline-flex min-w-0 items-center gap-1">
                <span className="truncate text-[11px] font-semibold text-fp-text-primary">
                  {displayLabel}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setVariantRename({
                      varUiKey,
                      promptId: wf.promptId,
                      variantKey: v.variantKey,
                      draft: displayLabel,
                    });
                  }}
                  className="inline-flex shrink-0 rounded p-0.5 text-fp-text-muted hover:bg-fp-surface-secondary hover:text-fp-text-primary"
                  aria-label="Rename this prompt group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                    aria-hidden
                  >
                    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
              </span>
            )}
          </div>
          {!editingThis ? <VariantTemplateToolbar vm={tmplVm} /> : null}
          {fp ? (
            <span className="shrink-0 rounded bg-fp-surface-secondary px-1 font-mono text-[9px] text-fp-text-muted">
              {fp}
            </span>
          ) : (
            <span className="shrink-0 rounded bg-fp-surface-secondary px-1 font-mono text-[9px] text-fp-text-muted">
              legacy
            </span>
          )}
          <span className="ml-auto shrink-0 font-mono text-[10px] text-fp-text-muted">
            {v.logs.length} run{v.logs.length === 1 ? "" : "s"}
          </span>
        </div>
        <p className="m-0 pl-6 font-sans text-[10px] leading-snug text-fp-text-dim">{v.excerpt}</p>
        {!editingThis ? <VariantTemplateExpansion vm={tmplVm} /> : null}
        {vOpen ? (
          <div className="space-y-2 border-t-[0.5px] border-fp-border/80 px-2 pb-2 pt-2">
            {v.logs.map((log) => (
              <LogRunRow
                key={log.id}
                log={log}
                emphasizeInputs
                onView={() => setViewingLog(log)}
                onRate={(r) => rateLog(log.id, r)}
                onDelete={() => void deleteLog(log.id)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function WorkflowHistory() {
  const {
    categories,
    logs,
    setViewingLog,
    rateLog,
    deleteLog,
    variantLabels,
    setVariantLabel,
    setError,
  } = useMeridian();
  const [openWorkflow, setOpenWorkflow] = useState<Record<string, boolean>>({});
  const [openVariant, setOpenVariant] = useState<Record<string, boolean>>({});
  const [variantRename, setVariantRename] = useState<VariantRenameState | null>(null);

  const tree = useMemo(() => buildTree(categories, logs), [categories, logs]);
  const sections = useMemo(
    () => partitionByDivision(tree, categories),
    [tree, categories],
  );

  const toggleWf = (k: string) => {
    setOpenWorkflow((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const toggleVar = (k: string) => {
    setOpenVariant((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  if (logs.length === 0) {
    return (
      <div className="mt-20 text-center text-fp-text-muted">
        <div className="mb-3 text-4xl text-fp-text-ghost">{"\u25E2"}</div>
        <p className="text-xs">
          No workflow runs yet. History is organized by Equity research, Risk and
          compliance, and Fund operations, then workflow name, prompt template
          version, then each execution.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        const sectionRuns = section.workflows.reduce(
          (n, w) => n + w.variants.reduce((m, v) => m + v.logs.length, 0),
          0,
        );

        return (
          <div key={section.id}>
            <div
              className="mb-3 flex flex-wrap items-center gap-2 border-b-[0.5px] border-fp-border pb-2 pl-1"
              style={{ borderLeft: `3px solid ${section.color}` }}
            >
              <span className="text-lg leading-none" aria-hidden>
                {section.icon}
              </span>
              <h3 className="m-0 text-[13px] font-bold text-fp-text-primary">
                {section.label}
              </h3>
              <span className="ml-auto font-mono text-[10px] text-fp-text-muted">
                {sectionRuns} run{sectionRuns === 1 ? "" : "s"}
              </span>
            </div>

            {section.workflows.length === 0 ? (
              <p className="m-0 pl-1 text-[11px] text-fp-text-muted">
                No runs in this area yet.
              </p>
            ) : (
              <div className="space-y-3">
                {section.workflows.map((wf) => {
                  const wfOpen = openWorkflow[wf.workflowKey] ?? false;
                  const runCount = wf.variants.reduce((n, v) => n + v.logs.length, 0);
                  const liveCount = wf.variants
                    .flatMap((v) => v.logs)
                    .filter((l) => l.hadData).length;

                  return (
                    <section
                      key={wf.workflowKey}
                      className="rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface shadow-fp-card"
                    >
                      <div className="flex w-full items-start gap-2 px-3 py-2.5 transition-colors hover:bg-fp-surface-secondary/60">
                        <button
                          type="button"
                          onClick={() => toggleWf(wf.workflowKey)}
                          className="mt-0.5 shrink-0 font-mono text-[10px] text-fp-text-muted"
                          aria-expanded={wfOpen}
                          aria-label={wfOpen ? "Collapse workflow" : "Expand workflow"}
                        >
                          {wfOpen ? "\u25BC" : "\u25B6"}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold text-fp-text-primary">
                            {wf.title}
                          </div>
                        </div>
                        {liveCount > 0 ? (
                          <span className="shrink-0 rounded-fp-badge bg-fp-research-light px-1 py-px font-mono text-[8px] font-semibold text-fp-research">
                            LIVE{liveCount > 1 ? ` ×${liveCount}` : ""}
                          </span>
                        ) : null}
                        <span className="shrink-0 font-mono text-[10px] text-fp-text-muted">
                          {runCount} run{runCount === 1 ? "" : "s"} · {wf.variants.length}{" "}
                          prompt
                          {wf.variants.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      {wfOpen ? (
                        <div className="space-y-2 border-t-[0.5px] border-fp-border px-3 pb-3 pt-2">
                          <p className="m-0 font-sans text-[10px] text-fp-text-dim">
                            Each group is one prompt template version. Use the pencil to name a
                            group (e.g. &quot;Conservative case&quot;). View template to copy the raw
                            prompt. Runs underneath share that template; they differ by inputs or
                            time.
                          </p>
                          <ul className="m-0 list-none space-y-2 p-0">
                            {wf.variants.map((v, vi) => {
                              const varUiKey = `${wf.workflowKey}\0${v.variantKey}`;
                              const vOpen = openVariant[varUiKey] ?? false;
                              return (
                                <HistoryVariantRow
                                  key={varUiKey}
                                  wf={wf}
                                  v={v}
                                  vi={vi}
                                  section={section}
                                  varUiKey={varUiKey}
                                  vOpen={vOpen}
                                  toggleVar={toggleVar}
                                  variantLabels={variantLabels}
                                  setVariantLabel={setVariantLabel}
                                  setError={setError}
                                  variantRename={variantRename}
                                  setVariantRename={setVariantRename}
                                  setViewingLog={setViewingLog}
                                  rateLog={rateLog}
                                  deleteLog={deleteLog}
                                />
                              );
                            })}
                          </ul>
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
