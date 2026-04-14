"use client";

import { useCallback, useState } from "react";

type Args = {
  promptId: string;
  categoryId: string;
  variantKey: string;
};

export type VariantTemplatePanelVm = {
  open: boolean;
  onToggle: () => void;
  template: string | null;
  loading: boolean;
  error: string;
  copied: boolean;
  onCopy: () => void;
};

export function useVariantTemplatePanel({
  promptId,
  categoryId,
  variantKey,
}: Args): VariantTemplatePanelVm {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (template !== null || loading) return;
    if (variantKey.startsWith("legacy:")) {
      setError(
        "This group predates stored templates. Open a run and use View prompt there to copy text.",
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({
        promptId,
        categoryId,
        fingerprint: variantKey,
      });
      const res = await fetch(`/api/workflow-history/prompt-template?${q.toString()}`);
      const raw = (await res.json().catch(() => ({}))) as {
        template?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(
          typeof raw.error === "string"
            ? raw.error
            : "Could not load the template for this version.",
        );
        return;
      }
      if (typeof raw.template !== "string" || !raw.template.trim()) {
        setError("Empty template response.");
        return;
      }
      setTemplate(raw.template);
    } catch {
      setError("Network error while loading the template.");
    } finally {
      setLoading(false);
    }
  }, [promptId, categoryId, variantKey, template, loading]);

  const onToggle = useCallback(() => {
    setOpen((was) => {
      const next = !was;
      if (next) void load();
      return next;
    });
  }, [load]);

  const onCopy = useCallback(async () => {
    const t = template;
    if (!t?.trim()) return;
    try {
      await navigator.clipboard.writeText(t);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard access failed. Select the text below and copy manually.");
    }
  }, [template]);

  return {
    open,
    onToggle,
    template,
    loading,
    error,
    copied,
    onCopy,
  };
}

export function VariantTemplateToolbar({ vm }: { vm: VariantTemplatePanelVm }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={vm.onToggle}
        className="rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface px-2 py-0.5 font-sans text-[10px] font-medium text-fp-text-secondary hover:border-fp-border-hover hover:text-fp-text-primary"
        aria-expanded={vm.open}
      >
        {vm.open ? "Hide template" : "View template"}
      </button>
      {vm.open && vm.template ? (
        <button
          type="button"
          onClick={() => void vm.onCopy()}
          className="rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface-secondary px-2 py-0.5 font-sans text-[10px] font-semibold text-fp-text-primary hover:border-fp-border-hover"
        >
          {vm.copied ? "Copied" : "Copy"}
        </button>
      ) : null}
      {vm.loading ? (
        <span className="font-sans text-[10px] text-fp-text-muted">Loading…</span>
      ) : null}
    </div>
  );
}

export function VariantTemplateExpansion({ vm }: { vm: VariantTemplatePanelVm }) {
  if (!vm.error && !(vm.open && vm.template)) return null;
  return (
    <div className="flex flex-col gap-2 pl-6">
      {vm.error ? (
        <p className="m-0 font-sans text-[10px] leading-snug text-fp-risk">{vm.error}</p>
      ) : null}
      {vm.open && vm.template ? (
        <pre className="m-0 max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface-secondary p-2.5 font-mono text-[10px] leading-relaxed text-fp-text-secondary">
          {vm.template}
        </pre>
      ) : null}
    </div>
  );
}
