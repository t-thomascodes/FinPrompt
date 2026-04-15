"use client";

import { useMeridian } from "@/context/MeridianContext";
import { clearDemoSession } from "@/lib/demoSession";

export function Header() {
  const { view, setView, logs, setViewingLog } = useMeridian();

  return (
    <header className="flex shrink-0 flex-col gap-3 border-b-[0.5px] border-fp-border bg-fp-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src="/logo.svg"
          width={30}
          height={30}
          alt=""
          className="h-[30px] w-[30px] shrink-0"
          decoding="async"
        />
        <div>
          <div className="text-[15px] font-bold text-fp-text-primary">
            Meridian
          </div>
          <div className="text-[10px] uppercase tracking-[1.5px] text-fp-text-muted">
            AI Workflow Layer for Asset Management
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
        {(
          [
            { id: "workflows" as const, label: "Workflows" },
            { id: "logs" as const, label: `Logs (${logs.length})` },
            { id: "workflowHistory" as const, label: "By workflow" },
            { id: "analytics" as const, label: "Analytics" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setView(tab.id);
              setViewingLog(null);
            }}
            className={`rounded-fp-btn px-3.5 py-1.5 font-sans text-xs font-medium transition-colors ${
              view === tab.id
                ? "bg-fp-surface-secondary font-semibold text-fp-text-primary"
                : "text-fp-text-muted hover:bg-fp-surface-secondary/80 hover:text-fp-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            clearDemoSession();
            window.location.reload();
          }}
          className="rounded-fp-btn px-3 py-1.5 font-sans text-[11px] font-medium text-fp-text-muted hover:bg-fp-surface-secondary hover:text-fp-text-secondary"
        >
          Exit demo
        </button>
      </div>
    </header>
  );
}
