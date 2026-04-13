"use client";

import { useFinPrompt } from "@/context/FinPromptContext";

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
  } = useFinPrompt();

  const category = categories.find((c) => c.id === activeCategory);

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
        {category?.prompts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPrompt(p)}
            className={`mb-0.5 block w-full rounded-fp-card border-[0.5px] p-2.5 text-left transition-colors ${
              selectedPrompt?.id === p.id
                ? "border-fp-border-hover bg-fp-surface-secondary shadow-fp-card"
                : "border-transparent hover:border-fp-border"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-semibold ${
                  selectedPrompt?.id === p.id
                    ? "text-fp-text-primary"
                    : "text-fp-text-secondary"
                }`}
              >
                {p.title}
              </span>
              {p.enrichTicker ? (
                <span className="rounded-fp-badge bg-fp-research-light px-1 py-px font-mono text-[8px] font-semibold text-fp-research">
                  LIVE
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 font-sans text-[10px] leading-snug text-fp-text-muted">
              {p.description}
            </p>
          </button>
        ))}
      </div>
    </aside>
  );
}
