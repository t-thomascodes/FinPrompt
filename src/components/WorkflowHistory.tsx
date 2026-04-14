"use client";

import { useMemo, useState } from "react";
import { useFinPrompt } from "@/context/FinPromptContext";
import { LogRunRow } from "@/components/LogsList";
import type { Category, WorkflowLog } from "@/lib/types";

/** Stable key: same catalog template string merges runs (e.g. forks share one prompt). */
function groupKeyForLog(categories: Category[], log: WorkflowLog): string {
  for (const cat of categories) {
    const p = cat.prompts.find((x) => x.id === log.promptId);
    if (p) return `template:${p.template}`;
  }
  return `promptId:${log.promptId}`;
}

function displayTitleForGroup(
  categories: Category[],
  key: string,
  logs: WorkflowLog[],
): string {
  if (key.startsWith("template:")) {
    const template = key.slice("template:".length);
    for (const cat of categories) {
      const p = cat.prompts.find((x) => x.template === template);
      if (p) return p.title;
    }
  }
  return logs[0]?.promptTitle ?? "Prompt";
}

type PromptGroup = {
  key: string;
  title: string;
  logs: WorkflowLog[];
  categoryIds: string[];
};

function buildPromptGroups(categories: Category[], logs: WorkflowLog[]): PromptGroup[] {
  const byKey = new Map<string, WorkflowLog[]>();
  const firstIndex = new Map<string, number>();

  logs.forEach((log, i) => {
    const k = groupKeyForLog(categories, log);
    if (!firstIndex.has(k)) firstIndex.set(k, i);
    let list = byKey.get(k);
    if (!list) {
      list = [];
      byKey.set(k, list);
    }
    list.push(log);
  });

  const catOrder = new Map(categories.map((c, i) => [c.id, i] as const));

  return Array.from(byKey.entries())
    .map(([key, runLogs]) => {
      const categoryIds = Array.from(new Set(runLogs.map((l) => l.categoryId))).sort(
        (a, b) => (catOrder.get(a) ?? 999) - (catOrder.get(b) ?? 999),
      );
      return {
        key,
        title: displayTitleForGroup(categories, key, runLogs),
        logs: runLogs,
        categoryIds,
      };
    })
    .sort((a, b) => (firstIndex.get(a.key) ?? 0) - (firstIndex.get(b.key) ?? 0));
}

export function WorkflowHistory() {
  const { categories, logs, setViewingLog, rateLog } = useFinPrompt();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const grouped = useMemo(
    () => buildPromptGroups(categories, logs),
    [categories, logs],
  );

  const toggle = (key: string) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (logs.length === 0) {
    return (
      <div className="mt-20 text-center text-fp-text-muted">
        <div className="mb-3 text-4xl text-fp-text-ghost">{"\u25E2"}</div>
        <p className="text-xs">
          No workflow runs yet. Executions will appear here grouped by the prompt
          template (same wording); each row under a prompt is a different run
          (e.g. another ticker).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grouped.map((g) => {
        const isOpen = open[g.key] ?? false;
        const liveCount = g.logs.filter((l) => l.hadData).length;
        const typeLabels = g.categoryIds
          .map((id) => categories.find((c) => c.id === id))
          .filter((c): c is Category => Boolean(c));

        return (
          <section
            key={g.key}
            className="rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface shadow-fp-card"
          >
            <button
              type="button"
              onClick={() => toggle(g.key)}
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-fp-surface-secondary/60"
              aria-expanded={isOpen}
            >
              <span className="mt-0.5 font-mono text-[10px] text-fp-text-muted" aria-hidden>
                {isOpen ? "\u25BC" : "\u25B6"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-fp-text-primary">
                  {g.title}
                </div>
                {typeLabels.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {typeLabels.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-0.5 rounded-fp-badge border-[0.5px] border-fp-border bg-fp-bg px-1.5 py-px font-sans text-[9px] text-fp-text-dim"
                        style={{ borderLeftColor: c.color, borderLeftWidth: 2 }}
                      >
                        <span aria-hidden>{c.icon}</span>
                        {c.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              {liveCount > 0 ? (
                <span className="shrink-0 rounded-fp-badge bg-fp-research-light px-1 py-px font-mono text-[8px] font-semibold text-fp-research">
                  LIVE{liveCount > 1 ? ` ×${liveCount}` : ""}
                </span>
              ) : null}
              <span className="shrink-0 font-mono text-[10px] text-fp-text-muted">
                {g.logs.length} run{g.logs.length === 1 ? "" : "s"}
              </span>
            </button>
            {isOpen ? (
              <div className="space-y-2 border-t-[0.5px] border-fp-border px-3 pb-3 pt-2">
                <p className="m-0 font-sans text-[10px] text-fp-text-dim">
                  Same prompt template; each run can use different inputs. Newest
                  first. Open a run for full output, variables, and metadata.
                </p>
                {g.logs.map((log) => (
                  <LogRunRow
                    key={log.id}
                    log={log}
                    emphasizeInputs
                    onView={() => setViewingLog(log)}
                    onRate={(r) => rateLog(log.id, r)}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
