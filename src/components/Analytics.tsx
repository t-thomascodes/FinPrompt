"use client";

import { useMemo } from "react";
import { useFinPrompt } from "@/context/FinPromptContext";

export function Analytics() {
  const { logs, categories } = useFinPrompt();

  const totalRuns = logs.length;
  const rated = logs.filter((l) => l.rating > 0);
  const avgRating =
    rated.length > 0
      ? (
          rated.reduce((s, l) => s + l.rating, 0) / rated.length
        ).toFixed(1)
      : "—";
  const dataEnrichedRuns = logs.filter((l) => l.hadData).length;

  const catBreakdown = useMemo(
    () =>
      categories.map((c) => {
        const catLogs = logs.filter((l) => l.categoryId === c.id);
        const catRated = catLogs.filter((l) => l.rating > 0);
        const avg =
          catRated.length > 0
            ? (
                catRated.reduce((s, l) => s + l.rating, 0) / catRated.length
              ).toFixed(1)
            : "—";
        return { ...c, runs: catLogs.length, avgRating: avg };
      }),
    [categories, logs],
  );

  const topPrompts = useMemo(() => {
    const titles = Array.from(new Set(logs.map((l) => l.promptTitle)));
    return titles
      .map((title) => {
        const pr = logs.filter((l) => l.promptTitle === title);
        const prRated = pr.filter((l) => l.rating > 0);
        const avg =
          prRated.length > 0
            ? (
                prRated.reduce((s, l) => s + l.rating, 0) / prRated.length
              ).toFixed(1)
            : "—";
        return { title, runs: pr.length, avg };
      })
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5);
  }, [logs]);

  const workflowCount = categories.reduce((s, c) => s + c.prompts.length, 0);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <h2 className="m-0 text-base font-bold text-fp-text-primary">
        Usage Analytics
      </h2>
      <p className="mb-5 mt-1 text-xs text-fp-text-muted">
        Track adoption, quality, and data enrichment across workflows.
      </p>

      <div className="mb-6 flex flex-wrap gap-3">
        <StatCard
          label="Total Runs"
          value={String(totalRuns)}
          sub="all workflows"
          color="#0F6E56"
        />
        <StatCard
          label="Avg Rating"
          value={avgRating}
          sub="rated outputs"
          color="#EF9F27"
        />
        <StatCard
          label="Data-Enriched"
          value={String(dataEnrichedRuns)}
          sub={
            totalRuns > 0
              ? `${Math.round((dataEnrichedRuns / totalRuns) * 100)}% of runs`
              : "0% of runs"
          }
          color="#0F6E56"
        />
        <StatCard
          label="Workflows"
          value={String(workflowCount)}
          sub={`${categories.length} categories`}
          color="#993C1D"
        />
      </div>

      <div className="mb-6">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-fp-text-muted">
          By Category
        </div>
        {catBreakdown.map((c) => (
          <div
            key={c.id}
            className="mb-1.5 flex items-center gap-3 rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface px-3.5 py-2.5 shadow-fp-card"
          >
            <span className="text-sm" style={{ color: c.color }}>
              {c.icon}
            </span>
            <span className="flex-1 text-xs font-semibold text-fp-text-secondary">
              {c.label}
            </span>
            <span
              className="min-w-[40px] text-right font-mono text-xs font-bold"
              style={{ color: c.color }}
            >
              {c.runs}
            </span>
            <span className="min-w-[30px] text-right font-mono text-[10px] text-fp-text-muted">
              runs
            </span>
            <div className="mx-1 h-4 w-px bg-fp-border" />
            <span className="min-w-[30px] text-right font-mono text-xs font-bold text-fp-data">
              {c.avgRating}
            </span>
            <span className="font-mono text-[10px] text-fp-text-muted">avg</span>
            <div className="h-1 w-20 overflow-hidden rounded-sm bg-black/[0.06]">
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${totalRuns > 0 ? (c.runs / totalRuns) * 100 : 0}%`,
                  background: c.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {topPrompts.length > 0 ? (
        <div>
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-fp-text-muted">
            Top Workflows
          </div>
          {topPrompts.map((p, i) => (
            <div
              key={p.title}
              className="mb-1 flex items-center gap-2.5 rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface px-3.5 py-2 shadow-fp-card"
            >
              <span className="font-mono text-xs font-bold text-fp-research">
                #{i + 1}
              </span>
              <span className="flex-1 text-xs text-fp-text-secondary">
                {p.title}
              </span>
              <span className="font-mono text-[11px] text-fp-operations">
                {p.runs} runs
              </span>
              <span className="font-mono text-[11px] text-fp-data">
                {"\u2605"} {p.avg}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {logs.length === 0 ? (
        <div className="mt-10 text-center text-fp-text-muted">
          <div className="mb-3 text-4xl text-fp-text-ghost">{"\u25CA"}</div>
          <p className="text-xs">
            Run workflows to start generating analytics.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="min-w-[140px] flex-1 rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface-secondary px-4 py-3.5 shadow-fp-card">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-fp-text-muted">
        {label}
      </div>
      <div className="font-mono text-2xl font-medium" style={{ color }}>
        {value}
      </div>
      {sub ? (
        <div className="mt-1 text-[11px] text-fp-text-muted">{sub}</div>
      ) : null}
    </div>
  );
}
