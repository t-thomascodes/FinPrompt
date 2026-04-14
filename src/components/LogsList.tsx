"use client";

import { useFinPrompt } from "@/context/FinPromptContext";
import { StarRating } from "@/components/StarRating";
import { stripMarkdownForPreview } from "@/lib/formatLogPreview";
import { normalizeStarRating } from "@/lib/normalizeRating";
import type { WorkflowLog } from "@/lib/types";

export function LogsList() {
  const { logs, setViewingLog, rateLog } = useFinPrompt();

  if (logs.length === 0) {
    return (
      <div className="mt-20 text-center text-fp-text-muted">
        <div className="mb-3 text-4xl text-fp-text-ghost">{"\u25E2"}</div>
        <p className="text-xs">
          No workflow runs yet. Execute a workflow to start building your log.
        </p>
      </div>
    );
  }

  return (
    <div>
      {logs.map((log) => (
        <LogRunRow
          key={log.id}
          log={log}
          onView={() => setViewingLog(log)}
          onRate={(r) => rateLog(log.id, r)}
        />
      ))}
    </div>
  );
}

export function LogRunRow({
  log,
  onView,
  onRate,
  /** When true, lead with inputs (e.g. ticker) — prompt title is the shared parent. */
  emphasizeInputs = false,
}: {
  log: WorkflowLog;
  onView: () => void;
  onRate: (r: number) => void;
  emphasizeInputs?: boolean;
}) {
  const preview = stripMarkdownForPreview(log.output ?? "", 200);
  const stars = normalizeStarRating(log.rating);
  const inputsLine = log.inputs?.trim() || "—";
  const secondaryLine = emphasizeInputs
    ? log.timestamp
    : `${log.inputs} · ${log.timestamp}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView();
        }
      }}
      className="group mb-2 w-full cursor-pointer rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface p-3.5 text-left shadow-fp-card transition-colors hover:border-fp-border-hover"
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div>
          {emphasizeInputs ? (
            <>
              <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[13px] font-semibold text-fp-text-primary">
                  {inputsLine}
                </span>
                {log.hadData ? (
                  <span className="rounded-fp-badge bg-fp-research-light px-1 py-px font-mono text-[8px] font-semibold text-fp-research">
                    LIVE
                  </span>
                ) : null}
              </div>
              <div className="font-mono text-[10px] text-fp-text-muted">
                {secondaryLine}
              </div>
            </>
          ) : (
            <>
              <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[13px] font-semibold text-fp-text-primary">
                  {log.promptTitle}
                </span>
                {log.hadData ? (
                  <span className="rounded-fp-badge bg-fp-research-light px-1 py-px font-mono text-[8px] font-semibold text-fp-research">
                    LIVE
                  </span>
                ) : null}
              </div>
              <div className="font-mono text-[10px] text-fp-text-muted">
                {secondaryLine}
              </div>
            </>
          )}
        </div>
        <StarRating
          rating={stars}
          onRate={onRate}
          stopPropagation
        />
      </div>
      {preview ? (
        <p className="line-clamp-2 text-left text-[11px] leading-snug text-fp-text-secondary">
          {preview}
        </p>
      ) : null}
    </div>
  );
}
