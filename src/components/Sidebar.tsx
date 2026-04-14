"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useMeridian } from "@/context/MeridianContext";
import { isForkedPromptId } from "@/lib/promptFork";
import type { PromptTemplate } from "@/lib/types";

function PencilGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function PromptRow({
  p,
  selected,
  onSelect,
  onRenameClick,
}: {
  p: PromptTemplate;
  selected: boolean;
  onSelect: () => void;
  /** When set, shows a pencil control beside the title (forked workflows). */
  onRenameClick?: () => void;
}) {
  return (
    <div
      className={`mb-0.5 rounded-fp-card border-[0.5px] transition-colors ${
        selected
          ? "border-fp-border-hover bg-fp-surface-secondary shadow-fp-card"
          : "border-transparent hover:border-fp-border"
      }`}
    >
      <div className="flex items-start gap-0.5">
        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 p-2.5 pb-2 text-left"
        >
          <div className="flex items-start gap-1.5">
            <span
              className={`min-w-0 flex-1 break-words text-xs font-semibold leading-snug ${
                selected ? "text-fp-text-primary" : "text-fp-text-secondary"
              }`}
            >
              {p.title}
            </span>
            {p.enrichTicker ? (
              <span className="mt-px shrink-0 rounded-fp-badge bg-fp-research-light px-1 py-px font-mono text-[8px] font-semibold text-fp-research">
                LIVE
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 font-sans text-[10px] leading-snug text-fp-text-muted">
            {p.description}
          </p>
        </button>
        {onRenameClick ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRenameClick();
            }}
            className="mr-1 shrink-0 self-start rounded p-1 pt-2.5 text-fp-text-muted opacity-80 transition-colors hover:bg-fp-surface-secondary hover:text-fp-text-secondary hover:opacity-100"
            aria-label="Rename workflow"
          >
            <PencilGlyph />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function Sidebar() {
  const {
    categories,
    activeCategory,
    setActiveCategory,
    selectedPrompt,
    selectPrompt,
    setSelectedPrompt,
    setOutput,
    setMarketData,
    setEditingPrompt,
    logs,
    renameForkedPromptTitle,
    setError,
  } = useMeridian();

  const category = categories.find((c) => c.id === activeCategory);

  const { standardPrompts, customPrompts } = useMemo(() => {
    const prompts = category?.prompts ?? [];
    const standard: PromptTemplate[] = [];
    const custom: PromptTemplate[] = [];
    for (const p of prompts) {
      if (isForkedPromptId(p.id)) custom.push(p);
      else standard.push(p);
    }
    return { standardPrompts: standard, customPrompts: custom };
  }, [category?.prompts]);

  const [customExpanded, setCustomExpanded] = useState(true);
  const [forkRename, setForkRename] = useState<{ id: string; draft: string } | null>(
    null,
  );

  return (
    <aside className="flex max-h-[min(42vh,22rem)] w-full shrink-0 flex-col overflow-y-auto border-b-[0.5px] border-fp-border bg-fp-surface py-3.5 md:max-h-none md:h-auto md:w-[260px] md:min-w-[260px] md:border-b-0 md:border-r-[0.5px]">
      <div className="mb-3.5 px-2.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setActiveCategory(cat.id);
              setSelectedPrompt(null);
              setOutput("");
              setMarketData("");
              setEditingPrompt(null);
              setForkRename(null);
            }}
            className={`mb-0.5 flex w-full items-center gap-2 rounded-r-[6px] py-2 pl-2.5 pr-2 text-left text-xs transition-colors ${
              activeCategory === cat.id && cat.id === "research"
                ? "bg-fp-research-light"
                : ""
            }`}
            style={{
              background:
                activeCategory === cat.id && cat.id !== "research"
                  ? `${cat.color}18`
                  : activeCategory === cat.id && cat.id === "research"
                    ? undefined
                    : "transparent",
              borderLeft:
                activeCategory === cat.id
                  ? `2px solid ${cat.color}`
                  : "2px solid transparent",
              color: activeCategory === cat.id ? cat.color : "#8A8A8A",
              fontWeight: activeCategory === cat.id ? 600 : 400,
            }}
          >
            <span className="text-sm">{cat.icon}</span>
            <span className="font-sans">{cat.label}</span>
            <span className="ml-auto font-mono text-[10px] text-fp-text-muted">
              {logs.filter((l) => l.categoryId === cat.id).length}
            </span>
          </button>
        ))}
      </div>
      <div className="px-2.5">
        <div className="px-2.5 pb-1 pt-1.5 text-[9px] font-semibold uppercase tracking-widest text-fp-text-muted">
          Workflows
        </div>
        {standardPrompts.map((p) => (
          <PromptRow
            key={p.id}
            p={p}
            selected={selectedPrompt?.id === p.id}
            onSelect={() => selectPrompt(p)}
          />
        ))}

        {customPrompts.length > 0 ? (
          <div className="mt-2 border-t-[0.5px] border-fp-border pt-2">
            <button
              type="button"
              onClick={() => setCustomExpanded((v) => !v)}
              className="mb-1 flex w-full items-center gap-2 rounded-fp-card px-2 py-1.5 text-left transition-colors hover:bg-fp-surface-secondary/70"
              aria-expanded={customExpanded}
            >
              <span className="font-mono text-[10px] text-fp-text-muted" aria-hidden>
                {customExpanded ? "\u25BC" : "\u25B6"}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-fp-text-secondary">
                Custom
              </span>
              <span className="ml-auto font-mono text-[10px] text-fp-text-muted">
                {customPrompts.length}
              </span>
            </button>
            {customExpanded ? (
              <div className="space-y-1">
                {customPrompts.map((p) => (
                  <div key={p.id} className="mb-0.5">
                    <PromptRow
                      p={p}
                      selected={selectedPrompt?.id === p.id}
                      onSelect={() => selectPrompt(p)}
                      onRenameClick={
                        forkRename?.id === p.id
                          ? undefined
                          : () => {
                              setError("");
                              setForkRename({ id: p.id, draft: p.title });
                            }
                      }
                    />
                    {forkRename?.id === p.id ? (
                      <div className="mt-1 flex flex-col gap-1.5 rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface-secondary/50 p-2">
                        <input
                          type="text"
                          value={forkRename.draft}
                          onChange={(e) =>
                            setForkRename((prev) =>
                              prev ? { ...prev, draft: e.target.value } : prev,
                            )
                          }
                          className="w-full rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface px-2 py-1.5 font-sans text-[11px] text-fp-text-primary outline-none focus:ring-2 focus:ring-offset-1"
                          style={
                            {
                              ["--tw-ring-color" as string]: "#0F6E5655",
                            } as CSSProperties
                          }
                          autoFocus
                        />
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const ok = renameForkedPromptTitle(
                                activeCategory,
                                p.id,
                                forkRename.draft,
                              );
                              if (ok) setForkRename(null);
                            }}
                            className="rounded-fp-btn bg-fp-research px-2.5 py-1 font-sans text-[10px] font-bold text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setError("");
                              setForkRename(null);
                            }}
                            className="rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface px-2.5 py-1 font-sans text-[10px] text-fp-text-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
