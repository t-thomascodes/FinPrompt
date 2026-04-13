"use client";

import { useFinPrompt } from "@/context/FinPromptContext";
import { StarRating } from "@/components/StarRating";
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
        <LogEntry
          key={log.id}
          log={log}
          onView={() => setViewingLog(log)}
          onRate={(r) => rateLog(log.id, r)}
        />
      ))}
    </div>
  );
}

function LogEntry({
  log,
  onView,
  onRate,
}: {
  log: WorkflowLog;
  onView: () => void;
  onRate: (r: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={onView}
      className="group mb-2 w-full cursor-pointer rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface p-3.5 text-left shadow-fp-card transition-colors hover:border-fp-border-hover"
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div>
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
            {log.inputs} · {log.timestamp}
          </div>
        </div>
        <StarRating
          rating={log.rating}
          onRate={onRate}
          stopPropagation
        />
      </div>
      <p className="line-clamp-2 text-left text-[11px] leading-snug text-fp-text-muted">
        {log.output?.slice(0, 150)}...
      </p>
    </button>
  );
}
