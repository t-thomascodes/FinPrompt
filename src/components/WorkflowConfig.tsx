"use client";

import type { CSSProperties } from "react";
import { useMeridian } from "@/context/MeridianContext";
import {
  listTemplatePlaceholderKeys,
  templateWithFriendlyPlaceholders,
} from "@/lib/templateDisplay";
import { getInstructionBody } from "@/lib/promptInstructionFooter";

export function WorkflowConfig() {
  const {
    selectedPrompt,
    activeCategoryObj,
    variables,
    setVariables,
    editingPrompt,
    setEditingPrompt,
    editText,
    setEditText,
    handleSaveEdit,
    handleForkPrompt,
    handleRun,
    loading,
    dataLoading,
    setError,
  } = useMeridian();

  if (!selectedPrompt || !activeCategoryObj) return null;

  const color = activeCategoryObj.color;
  const missingVars = selectedPrompt.variables.some((v) => {
    if (v.optional) return false;
    if (
      selectedPrompt.enrichPeerTickers &&
      v.key === selectedPrompt.enrichPeerTickers
    ) {
      return false;
    }
    return !variables[v.key]?.trim();
  });
  const disabled = loading || dataLoading || missingVars;

  return (
    <div className="shrink-0 border-b-[0.5px] border-fp-border bg-fp-surface px-4 py-4 sm:px-6 sm:py-[18px]">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-base font-bold text-fp-text-primary">
              {selectedPrompt.title}
            </h2>
            {selectedPrompt.enrichTicker ? (
              <span
                className="rounded-fp-badge px-1.5 py-0.5 font-mono text-[9px] font-semibold"
                style={{
                  background: "#E1F5EE",
                  color: "#0F6E56",
                }}
              >
                {"\u25C9 LIVE"}
                {selectedPrompt.enrichPeerTickers
                  ? ` + ${selectedPrompt.enrichPeerTickers}`
                  : ""}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-fp-text-muted">
            {selectedPrompt.description}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setError("");
              setEditingPrompt(selectedPrompt);
              setEditText(
                getInstructionBody(
                  selectedPrompt.template,
                  selectedPrompt.instructionFooter,
                ),
              );
            }}
            className="rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface px-2.5 py-1 font-sans text-[11px] text-fp-text-secondary transition-colors hover:border-fp-border-hover hover:text-fp-text-primary"
          >
            {"\u270E"} Edit
          </button>
          <span
            className="flex items-center rounded-fp-badge px-2.5 py-1 font-sans text-[10px] font-semibold"
            style={{ background: `${color}18`, color }}
          >
            {activeCategoryObj.label}
          </span>
        </div>
      </div>

      {editingPrompt?.id === selectedPrompt.id ? (
        <div className="mb-3.5">
          <p className="mb-2 font-sans text-[10px] leading-snug text-fp-text-dim">
            {editingPrompt.instructionFooter ? (
              <>
                Edit your instructions only. Ticker line, company name (when applicable), and live
                market data are appended after this text automatically — you do not need to include
                them. Any tokens below must stay in your text exactly (e.g.{" "}
                <span className="font-mono text-fp-text-secondary">{"{{TICKER}}"}</span>
                ).
              </>
            ) : (
              <>
                Edit the instructions only. Each field below must stay in the text exactly as a
                token (e.g.{" "}
                <span className="font-mono text-fp-text-secondary">{"{{TICKER}}"}</span>
                ); values are filled from the inputs when you run the workflow.
              </>
            )}
          </p>
          <div className="mb-2 flex flex-wrap gap-1">
            {listTemplatePlaceholderKeys(
              getInstructionBody(
                editingPrompt.template,
                editingPrompt.instructionFooter,
              ),
            ).map((key) => {
              const v = editingPrompt.variables.find((x) => x.key === key);
              return (
                <span
                  key={key}
                  className="rounded-fp-badge border-[0.5px] border-fp-border bg-fp-surface-secondary px-1.5 py-px font-mono text-[9px] text-fp-text-secondary"
                  title="Required token — do not remove or rename"
                >
                  {v ? `${v.label}: ` : ""}
                  {"{{"}
                  {key}
                  {"}}"}
                </span>
              );
            })}
          </div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-[160px] w-full resize-y rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface p-3 font-mono text-xs leading-relaxed text-fp-text-secondary outline-none focus:ring-2 focus:ring-offset-1"
            style={
              {
                ["--tw-ring-color" as string]: `${color}55`,
              } as CSSProperties
            }
          />
          {editingPrompt.instructionFooter ? (
            <div className="mt-2 rounded-fp-card border-[0.5px] border-dashed border-fp-border bg-fp-surface-secondary/60 px-3 py-2">
              <div className="mb-1 font-sans text-[9px] font-semibold uppercase tracking-wide text-fp-text-muted">
                Appended automatically (not editable)
              </div>
              <div className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-fp-text-dim">
                {templateWithFriendlyPlaceholders(
                  editingPrompt.instructionFooter,
                  editingPrompt.variables,
                )}
              </div>
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveEdit}
              className="rounded-fp-btn px-3.5 py-1.5 font-sans text-[11px] font-bold text-white"
              style={{ background: color }}
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleForkPrompt}
              className="rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface-secondary px-3.5 py-1.5 font-sans text-[11px] text-fp-text-secondary"
            >
              Fork as New
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setEditingPrompt(null);
                setEditText("");
              }}
              className="rounded-fp-btn border-[0.5px] border-transparent bg-transparent px-3.5 py-1.5 font-sans text-[11px] text-fp-text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="mb-3.5 flex flex-wrap gap-2.5">
        {selectedPrompt.variables.map((v) => (
          <div key={v.key} className="min-w-[180px] flex-1">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-fp-text-muted">
              {v.label}
            </label>
            <input
              type="text"
              value={variables[v.key] ?? ""}
              onChange={(e) =>
                setVariables((prev) => ({ ...prev, [v.key]: e.target.value }))
              }
              placeholder={v.placeholder}
              className="w-full rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface px-3 py-2 font-mono text-[13px] text-fp-text-primary outline-none transition-shadow focus:ring-2 focus:ring-offset-1"
              style={
                {
                  ["--tw-ring-color" as string]: `${color}66`,
                } as CSSProperties
              }
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => void handleRun()}
          disabled={disabled}
          aria-busy={loading || dataLoading}
          className="w-full rounded-fp-card px-6 py-2.5 font-sans text-xs font-bold transition-opacity disabled:cursor-not-allowed sm:w-auto"
          style={{
            background: disabled ? "#E8E8EA" : color,
            color: disabled ? "#B0B0B0" : "#FFFFFF",
          }}
        >
          {dataLoading
            ? "Fetching data..."
            : loading
              ? "Running..."
              : "\u25B6 Execute Workflow"}
        </button>
        {selectedPrompt.enrichTicker ? (
          <span className="text-[10px] text-fp-text-muted">
            Yahoo Finance data → Enrich → Execute → Log
          </span>
        ) : null}
      </div>
    </div>
  );
}
