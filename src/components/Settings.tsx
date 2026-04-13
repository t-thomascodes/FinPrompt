"use client";

import { useFinPrompt } from "@/context/FinPromptContext";

export function Settings() {
  const { showSettings, config, refreshConfig } = useFinPrompt();

  if (!showSettings) return null;

  return (
    <div className="flex flex-wrap items-end gap-4 border-b-[0.5px] border-fp-border bg-fp-surface-secondary px-4 py-3.5 sm:px-6">
      <div className="min-w-[280px] flex-1 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-fp-text-muted">
          Server configuration
        </p>
        <p className="text-xs leading-relaxed text-fp-text-secondary">
          API keys are read from{" "}
          <span className="font-mono text-fp-text-primary">.env.local</span> on
          the server only. Set{" "}
          <span className="font-mono text-[11px]">OPENAI_API_KEY</span> and{" "}
          <span className="font-mono text-[11px]">ALPHA_VANTAGE_API_KEY</span>,
          then restart <span className="font-mono text-[11px]">next dev</span>.
        </p>
        <button
          type="button"
          onClick={() => void refreshConfig()}
          className="rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface px-3 py-1.5 font-sans text-[11px] text-fp-text-secondary transition-colors hover:border-fp-border-hover hover:text-fp-text-primary"
        >
          Refresh status
        </button>
      </div>
      <div className="flex flex-wrap gap-3 pb-0.5">
        <StatusPill label="OpenAI" ok={config.openaiConfigured} />
        <StatusPill label="Alpha Vantage" ok={config.alphaVantageConfigured} />
      </div>
    </div>
  );
}

function StatusPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface px-3 py-2">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          background: ok ? "#0F6E56" : "#A32D2D",
        }}
      />
      <span className="font-mono text-[11px] text-fp-text-secondary">
        {label}: {ok ? "configured" : "missing"}
      </span>
    </div>
  );
}
