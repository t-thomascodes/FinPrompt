"use client";

import { useFinPrompt } from "@/context/FinPromptContext";
import { Analytics } from "@/components/Analytics";
import { Header } from "@/components/Header";
import { LogDetail } from "@/components/LogDetail";
import { LogsList } from "@/components/LogsList";
import { OutputPanel } from "@/components/OutputPanel";
import { Settings } from "@/components/Settings";
import { Sidebar } from "@/components/Sidebar";
import { WorkflowConfig } from "@/components/WorkflowConfig";

export function FinPrompt() {
  const {
    view,
    selectedPrompt,
    categories,
    viewingLog,
    config,
    logs,
  } = useFinPrompt();

  const workflowCount = categories.reduce((s, c) => s + c.prompts.length, 0);
  const liveCount = categories.filter((c) =>
    c.prompts.some((p) => p.enrichTicker),
  ).length;

  return (
    <div className="flex h-screen min-h-0 flex-col bg-fp-bg text-fp-text-primary">
      <Header />
      <Settings />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {view === "workflows" ? <Sidebar /> : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden max-md:min-h-0">
          {view === "workflows" && !selectedPrompt ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3.5 px-4 py-8 text-center text-fp-text-ghost sm:py-6">
              <span className="text-5xl text-fp-text-ghost">{"\u25C8"}</span>
              <p className="text-[13px] font-medium text-fp-text-dim">
                Select a workflow to begin
              </p>
              <p className="text-center text-[11px] text-fp-text-muted">
                {workflowCount} workflows · {liveCount} with live data enrichment
              </p>
              {!config.openaiConfigured ? (
                <div className="mt-1.5 max-w-sm rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface-secondary p-3 text-center shadow-fp-card">
                  <div className="mb-1 text-[11px] font-semibold text-fp-data">
                    Configure OpenAI
                  </div>
                  <p className="text-[10px] leading-relaxed text-fp-text-dim">
                    Set OPENAI_API_KEY in .env.local and restart the dev server
                    to run workflows.
                  </p>
                </div>
              ) : null}
              {!config.alphaVantageConfigured ? (
                <div className="max-w-sm rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface-secondary p-3 text-center shadow-fp-card">
                  <div className="mb-1 text-[11px] font-semibold text-fp-data">
                    Connect data layer
                  </div>
                  <p className="text-[10px] leading-relaxed text-fp-text-dim">
                    Add ALPHA_VANTAGE_API_KEY in .env.local for real-time
                    enrichment on LIVE templates.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {view === "workflows" && selectedPrompt ? (
            <>
              <WorkflowConfig />
              <OutputPanel />
            </>
          ) : null}

          {view === "logs" && !viewingLog ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="m-0 text-base font-bold text-fp-text-primary">
                    Output Log
                  </h2>
                  <p className="mt-1 text-xs text-fp-text-dim">
                    Every workflow execution is logged for traceability and
                    refinement.
                  </p>
                </div>
                <span className="font-mono text-[11px] text-fp-text-ghost">
                  {logs.length} entries
                </span>
              </div>
              <LogsList />
            </div>
          ) : null}

          {view === "logs" && viewingLog ? <LogDetail /> : null}

          {view === "analytics" ? <Analytics /> : null}
        </div>
      </div>
    </div>
  );
}
