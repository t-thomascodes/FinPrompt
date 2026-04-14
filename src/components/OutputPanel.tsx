"use client";

import { useEffect, useRef } from "react";
import { useFinPrompt } from "@/context/FinPromptContext";
import { resolvePrimaryInput } from "@/lib/exportFilename";
import { MarketDataPanel } from "@/components/MarketDataPanel";
import { MarketCharts } from "@/components/MarketCharts";
import { ExportBar } from "@/components/ExportBar";
import { OutputRenderer } from "@/components/OutputRenderer";

export function OutputPanel() {
  const {
    selectedPrompt,
    activeCategoryObj,
    output,
    displayedText,
    typingDone,
    loading,
    error,
    logSyncWarning,
    marketData,
    marketStructured,
    dataLoading,
    variables,
    logs,
  } = useFinPrompt();

  const scrollRef = useRef<HTMLDivElement>(null);
  const dashboardPdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [displayedText]);

  if (!selectedPrompt || !activeCategoryObj) return null;

  const color = activeCategoryObj.color;
  const primary = resolvePrimaryInput(
    variables,
    Object.values(variables).filter(Boolean).join(", "),
    selectedPrompt.id,
  );
  const inputsJoined = Object.values(variables).filter(Boolean).join(", ");
  const title = `${selectedPrompt.title}: ${inputsJoined || primary}`;
  const latestLog = logs[0];
  const logMatches =
    latestLog?.promptId === selectedPrompt.id && latestLog.output === output;
  const fullPromptForExport = logMatches ? latestLog.fullPrompt : undefined;
  const exportTimestamp = logMatches
    ? latestLog.timestamp
    : new Date().toLocaleString();

  const showLoadingPlaceholder = loading && !output.trim();
  const showOutput = output.trim().length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-fp-bg">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
      >
        <div ref={dashboardPdfRef}>
          <MarketDataPanel
            marketData={marketData}
            dataLoading={dataLoading}
            accent={color}
            structured={marketStructured}
          />

          {marketStructured && selectedPrompt.enrichTicker ? (
            <MarketCharts
              bundle={marketStructured}
              workflowId={selectedPrompt.id}
              accent={color}
            />
          ) : null}
        </div>

        {logSyncWarning ? (
          <div
            className="mb-3 rounded-fp-card border-[0.5px] border-amber-500/35 bg-amber-500/10 p-3.5 font-mono text-xs text-amber-900 dark:text-amber-100"
            role="status"
          >
            {logSyncWarning}
          </div>
        ) : null}

        {error ? (
          <div
            className="mb-3 rounded-fp-card border-[0.5px] border-fp-risk/30 bg-fp-risk-light p-3.5 font-mono text-xs text-fp-risk"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {showLoadingPlaceholder ? (
          <div
            className="rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface p-6 text-center shadow-fp-card sm:p-8"
            aria-live="polite"
            aria-busy="true"
          >
            <div
              className="mx-auto mb-4 h-10 w-10 animate-fp-pulse rounded-full"
              style={{ background: `${color}28` }}
            />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-fp-text-dim">
              Executing workflow
            </p>
            <p className="mt-2 text-xs text-fp-text-muted">
              {dataLoading && selectedPrompt.enrichTicker
                ? "Fetching market data and calling OpenAI…"
                : "Calling OpenAI…"}
            </p>
          </div>
        ) : null}

        {showOutput ? (
          <div>
            <div className="mb-3.5 flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  loading || !typingDone ? "animate-fp-pulse bg-fp-data" : ""
                }`}
                style={
                  !(loading || !typingDone) ? { background: color } : undefined
                }
              />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-fp-text-dim">
                {loading
                  ? "Executing..."
                  : typingDone
                    ? "Complete"
                    : "Streaming"}
              </span>
            </div>
            <div className="relative text-xs leading-relaxed">
              <OutputRenderer
                text={displayedText}
                accent={color}
                researchMode={activeCategoryObj.id === "research"}
              />
              {!typingDone && !loading && displayedText.length > 0 ? (
                <span
                  className="ml-0.5 inline-block h-3.5 w-1.5 animate-fp-blink align-text-bottom"
                  style={{ background: color }}
                  aria-hidden
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {!output && !loading && !error && !marketData ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-1.5 text-fp-text-ghost">
            <span className="text-[10px] uppercase tracking-widest">
              Configure inputs and execute
            </span>
          </div>
        ) : null}
      </div>

      {showOutput ? (
        <div className="shrink-0 border-t-[0.5px] border-fp-border bg-fp-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-fp-surface/90 sm:px-6">
          <ExportBar
            title={title}
            categoryLabel={activeCategoryObj.label}
            inputs={inputsJoined}
            timestamp={exportTimestamp}
            output={output}
            marketData={marketData}
            marketStructured={marketStructured ?? undefined}
            rating={logMatches ? latestLog.rating : undefined}
            fullPrompt={fullPromptForExport}
            workflowSlug={selectedPrompt.id}
            primaryInput={primary}
            accent={color}
            dashboardCaptureRef={dashboardPdfRef}
            fileExportsDisabled={loading}
          />
        </div>
      ) : null}
    </div>
  );
}
