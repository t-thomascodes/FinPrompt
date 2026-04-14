"use client";

import {
  useCallback,
  useEffect,
  useState,
  type RefObject,
} from "react";
import { buildExportBasename } from "@/lib/exportFilename";
import { downloadHybridMemoPdf } from "@/lib/downloadHybridMemoPdf";
import type { ExportPayload } from "@/lib/types";
import type { MarketDataBundle } from "@/lib/marketDataTypes";

type Props = {
  title: string;
  categoryLabel: string;
  inputs: string;
  timestamp: string;
  output: string;
  marketData: string;
  marketStructured?: MarketDataBundle | null;
  rating?: number;
  fullPrompt?: string;
  workflowSlug: string;
  primaryInput: string;
  accent: string;
  /** Metrics + charts region only; captured as PNG for PDF pages 1–2. */
  dashboardCaptureRef?: RefObject<HTMLElement | null>;
  /** When true, file exports are blocked (e.g. response still in flight). Copy may still work if output exists. */
  fileExportsDisabled?: boolean;
  /** When false, bar is meant to sit in a sticky/docked footer (no extra top margin / divider). */
  docked?: boolean;
};

function IconDoc() {
  return (
    <svg
      className="h-4 w-4 shrink-0 opacity-90"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function IconSheet() {
  return (
    <svg
      className="h-4 w-4 shrink-0 opacity-90"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  );
}

function IconSlides() {
  return (
    <svg
      className="h-4 w-4 shrink-0 opacity-90"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function IconPdf() {
  return (
    <svg
      className="h-4 w-4 shrink-0 opacity-90"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 15h6M9 11h6M9 19h4" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg
      className="h-4 w-4 shrink-0 opacity-90"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function ExportBar(props: Props) {
  const docked = props.docked !== false;
  const [busy, setBusy] = useState<null | "docx" | "xlsx" | "pptx" | "pdf">(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
    setErr("");
  }, [props.output]);

  const base = buildExportBasename(
    props.workflowSlug,
    props.primaryInput,
    props.timestamp,
  );

  const payload = useCallback((): ExportPayload => {
    return {
      title: props.title,
      output: props.output,
      marketData: props.marketData || undefined,
      marketDataStructured: props.marketStructured ?? undefined,
      category: props.categoryLabel,
      inputs: props.inputs,
      timestamp: props.timestamp,
      rating: props.rating,
      fullPrompt: props.fullPrompt,
    };
  }, [props]);

  const downloadBlob = useCallback(
    async (kind: "docx" | "xlsx" | "pptx") => {
      const filename = `${base}.${kind}`;
      const res = await fetch(`/api/export/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload(),
          filename,
        }),
      });

      const ct = res.headers.get("content-type") ?? "";
      if (!res.ok || ct.includes("application/json")) {
        const text = await res.text();
        let parsed: { error?: string } | null = null;
        try {
          parsed = JSON.parse(text) as { error?: string };
        } catch {
          parsed = null;
        }
        throw new Error(
          typeof parsed?.error === "string"
            ? parsed.error
            : text.slice(0, 200) || `Export failed (${res.status})`,
        );
      }

      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    },
    [base, payload],
  );

  const download = useCallback(
    async (kind: "docx" | "xlsx" | "pptx") => {
      setErr("");
      setBusy(kind);
      try {
        await downloadBlob(kind);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Export failed");
      } finally {
        setBusy(null);
      }
    },
    [downloadBlob],
  );

  const downloadPdfHybrid = useCallback(async () => {
    setErr("");
    setBusy("pdf");
    try {
      await downloadHybridMemoPdf(
        {
          title: props.title,
          categoryLabel: props.categoryLabel,
          inputs: props.inputs,
          timestamp: props.timestamp,
          rating: props.rating,
          filename: `${base}.pdf`,
        },
        props.dashboardCaptureRef?.current ?? null,
        props.output,
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setBusy(null);
    }
  }, [
    base,
    props.title,
    props.categoryLabel,
    props.inputs,
    props.timestamp,
    props.rating,
    props.output,
    props.dashboardCaptureRef,
  ]);

  const copy = useCallback(async () => {
    setErr("");
    const text = props.output;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("Could not copy to clipboard");
    }
  }, [props.output]);

  if (!props.output.trim()) return null;

  const fileDisabled = !!busy || props.fileExportsDisabled;
  const btn =
    "inline-flex min-h-[40px] min-w-0 items-center justify-center gap-2 rounded-fp-btn border-[0.5px] border-fp-border bg-fp-surface px-3.5 py-2 font-sans text-xs font-medium text-fp-text-secondary transition-colors hover:bg-fp-surface-secondary hover:text-fp-text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[7.5rem]";
  const accentBorder = { borderColor: `${props.accent}44` } as const;

  return (
    <div className={docked ? "" : "mt-4 border-t-[0.5px] border-fp-border pt-3"}>
      {err ? (
        <p className="mb-2 font-mono text-[11px] text-fp-risk" role="alert">
          {err}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        <button
          type="button"
          className={btn}
          style={accentBorder}
          disabled={fileDisabled}
          aria-busy={busy === "docx"}
          onClick={() => void download("docx")}
        >
          <IconDoc />
          {busy === "docx" ? "…" : "Word"}
        </button>
        <button
          type="button"
          className={btn}
          style={accentBorder}
          disabled={fileDisabled}
          aria-busy={busy === "xlsx"}
          onClick={() => void download("xlsx")}
        >
          <IconSheet />
          {busy === "xlsx" ? "…" : "Excel"}
        </button>
        <button
          type="button"
          className={btn}
          style={accentBorder}
          disabled={fileDisabled}
          aria-busy={busy === "pptx"}
          onClick={() => void download("pptx")}
        >
          <IconSlides />
          {busy === "pptx" ? "…" : "PowerPoint"}
        </button>
        <button
          type="button"
          className={btn}
          style={accentBorder}
          disabled={fileDisabled}
          title="Dashboard as images; analysis as selectable text"
          aria-busy={busy === "pdf"}
          onClick={() => void downloadPdfHybrid()}
        >
          <IconPdf />
          {busy === "pdf" ? "…" : "PDF"}
        </button>
        <button
          type="button"
          className={btn}
          disabled={!!busy}
          onClick={() => void copy()}
        >
          <IconCopy />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
