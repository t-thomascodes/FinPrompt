"use client";

import { useEffect, useRef, useState } from "react";
import { useFinPrompt } from "@/context/FinPromptContext";
import { ExportBar } from "@/components/ExportBar";
import { MarketDataPanel } from "@/components/MarketDataPanel";
import { MarketCharts } from "@/components/MarketCharts";
import { OutputRenderer } from "@/components/OutputRenderer";
import { StarRating } from "@/components/StarRating";
import { coerceWorkflowLog } from "@/lib/coerceWorkflowLog";
import { resolvePrimaryInput } from "@/lib/exportFilename";
import type { WorkflowLog } from "@/lib/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function LogDetail() {
  const { viewingLog, setViewingLog, categories, rateLog, mergeServerLog, view } =
    useFinPrompt();
  const [detail, setDetail] = useState<WorkflowLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const dashboardPdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewingLog) {
      setDetail(null);
      return;
    }
    if (!UUID_RE.test(viewingLog.id)) {
      setDetail(viewingLog);
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    setDetail(viewingLog);
    let cancelled = false;
    void fetch(`/api/logs/${encodeURIComponent(viewingLog.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { log?: WorkflowLog } | null) => {
        if (cancelled || !d?.log) return;
        const log = coerceWorkflowLog(d.log);
        setDetail(log);
        mergeServerLog(log);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when log id only
  }, [viewingLog?.id, mergeServerLog]);

  useEffect(() => {
    setShowPrompt(false);
  }, [viewingLog?.id]);

  if (!viewingLog) return null;

  const entry = detail ?? viewingLog;
  const cat = categories.find((c) => c.id === entry.categoryId);
  const color = cat?.color ?? "#0F6E56";
  const title = `${entry.promptTitle}: ${entry.inputs}`;
  const primary = resolvePrimaryInput(
    entry.variables,
    entry.inputs,
    entry.promptId,
  );
  const blockExports =
    detailLoading && UUID_RE.test(entry.id) && !entry.fullPrompt?.trim();
  const promptText = entry.fullPrompt?.trim() ?? "";
  const promptLoading =
    detailLoading && UUID_RE.test(entry.id) && !promptText.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-fp-bg">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={() => setViewingLog(null)}
          className="mb-4 rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface px-3 py-1.5 font-sans text-[11px] text-fp-text-muted hover:bg-fp-surface-secondary hover:text-fp-text-primary"
        >
          {"\u2190"}{" "}
          {view === "workflowHistory" ? "Back to workflow runs" : "Back to logs"}
        </button>
        {blockExports ? (
          <p className="mb-3 font-sans text-[11px] text-fp-text-muted">
            Loading full log…
          </p>
        ) : null}
        <div className="rounded-fp-card bg-fp-bg p-3 sm:p-4">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-base font-bold text-fp-text-primary">
              {entry.promptTitle}
            </h2>
            {entry.hadData ? (
              <span className="rounded-fp-badge bg-fp-research-light px-1 py-px font-mono text-[8px] font-semibold text-fp-research">
                LIVE DATA
              </span>
            ) : null}
          </div>
          <div className="mb-3 font-mono text-[11px] text-fp-text-dim">
            {entry.inputs} · {entry.timestamp}
          </div>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowPrompt((v) => !v)}
              className="rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface px-3 py-1.5 font-sans text-[11px] font-medium text-fp-text-secondary hover:bg-fp-surface-secondary hover:text-fp-text-primary"
              aria-expanded={showPrompt}
            >
              {showPrompt ? "Hide prompt" : "View prompt"}
            </button>
            {showPrompt ? (
              <div className="mt-2 max-h-72 overflow-y-auto rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface-secondary p-3 sm:p-4">
                <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-wide text-fp-text-muted">
                  Prompt sent to the model
                </p>
                <pre className="m-0 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-fp-text-secondary">
                  {promptLoading
                    ? "Loading…"
                    : promptText || "No prompt text was stored for this log."}
                </pre>
              </div>
            ) : null}
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <StarRating
              rating={entry.rating}
              onRate={(r) => {
                void rateLog(entry.id, r);
                setDetail((prev) => (prev ? { ...prev, rating: r } : prev));
              }}
              size="md"
            />
            <span className="self-center text-[11px] text-fp-text-dim">
              {entry.rating > 0
                ? `${entry.rating}/5`
                : "Rate this output"}
            </span>
          </div>
          {entry.marketData && entry.hadData ? (
            <div ref={dashboardPdfRef}>
              <MarketDataPanel
                marketData={entry.marketData}
                dataLoading={false}
                accent={color}
                structured={entry.marketDataStructured}
              />
              {entry.marketDataStructured ? (
                <MarketCharts
                  bundle={entry.marketDataStructured}
                  workflowId={entry.promptId}
                  accent={color}
                />
              ) : null}
            </div>
          ) : null}
          <OutputRenderer
            text={entry.output}
            accent={color}
            researchMode={cat?.id === "research"}
          />
        </div>
      </div>

      {entry.output.trim() ? (
        <div className="shrink-0 border-t-[0.5px] border-fp-border bg-fp-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-fp-surface/90 sm:px-6">
          <ExportBar
            title={title}
            categoryLabel={cat?.label ?? "—"}
            inputs={entry.inputs}
            timestamp={entry.timestamp}
            output={entry.output}
            marketData={entry.marketData}
            marketStructured={entry.marketDataStructured}
            rating={entry.rating}
            fullPrompt={entry.fullPrompt}
            workflowSlug={entry.promptId}
            primaryInput={primary}
            accent={color}
            dashboardCaptureRef={dashboardPdfRef}
            fileExportsDisabled={blockExports}
          />
        </div>
      ) : null}
    </div>
  );
}
