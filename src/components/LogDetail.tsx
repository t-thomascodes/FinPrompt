"use client";

import { useFinPrompt } from "@/context/FinPromptContext";
import { ExportBar } from "@/components/ExportBar";
import { MarketDataPanel } from "@/components/MarketDataPanel";
import { OutputRenderer } from "@/components/OutputRenderer";
import { StarRating } from "@/components/StarRating";
import { resolvePrimaryInput } from "@/lib/exportFilename";

export function LogDetail() {
  const { viewingLog, setViewingLog, categories, rateLog } = useFinPrompt();

  if (!viewingLog) return null;

  const cat = categories.find((c) => c.id === viewingLog.categoryId);
  const color = cat?.color ?? "#0F6E56";
  const title = `${viewingLog.promptTitle}: ${viewingLog.inputs}`;
  const primary = resolvePrimaryInput(
    viewingLog.variables,
    viewingLog.inputs,
    viewingLog.promptId,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-fp-bg">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={() => setViewingLog(null)}
          className="mb-4 rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface px-3 py-1.5 font-sans text-[11px] text-fp-text-muted hover:bg-fp-surface-secondary hover:text-fp-text-primary"
        >
          {"\u2190"} Back to logs
        </button>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <h2 className="m-0 text-base font-bold text-fp-text-primary">
            {viewingLog.promptTitle}
          </h2>
          {viewingLog.hadData ? (
            <span className="rounded-fp-badge bg-fp-research-light px-1 py-px font-mono text-[8px] font-semibold text-fp-research">
              LIVE DATA
            </span>
          ) : null}
        </div>
        <div className="mb-4 font-mono text-[11px] text-fp-text-dim">
          {viewingLog.inputs} · {viewingLog.timestamp}
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <StarRating
            rating={viewingLog.rating}
            onRate={(r) => rateLog(viewingLog.id, r)}
            size="md"
          />
          <span className="self-center text-[11px] text-fp-text-dim">
            {viewingLog.rating > 0
              ? `${viewingLog.rating}/5`
              : "Rate this output"}
          </span>
        </div>
        {viewingLog.marketData && viewingLog.hadData ? (
          <MarketDataPanel
            marketData={viewingLog.marketData}
            dataLoading={false}
            accent={color}
          />
        ) : null}
        <OutputRenderer
          text={viewingLog.output}
          accent={color}
          researchMode={cat?.id === "research"}
        />
      </div>

      {viewingLog.output.trim() ? (
        <div className="shrink-0 border-t-[0.5px] border-fp-border bg-fp-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-fp-surface/90 sm:px-6">
          <ExportBar
            title={title}
            categoryLabel={cat?.label ?? "—"}
            inputs={viewingLog.inputs}
            timestamp={viewingLog.timestamp}
            output={viewingLog.output}
            marketData={viewingLog.marketData}
            rating={viewingLog.rating}
            fullPrompt={viewingLog.fullPrompt}
            workflowSlug={viewingLog.promptId}
            primaryInput={primary}
            accent={color}
          />
        </div>
      ) : null}
    </div>
  );
}
