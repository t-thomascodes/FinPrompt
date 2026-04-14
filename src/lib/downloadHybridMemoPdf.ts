import { captureDashboardPng } from "@/lib/pdfDashboardImages";
import { sectionsToPdfMakeContent } from "@/lib/pdfMemoPdfMakeContent";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";

export type HybridPdfMeta = {
  title: string;
  categoryLabel: string;
  inputs: string;
  timestamp: string;
  rating?: number;
  filename: string;
};

const IMAGE_WIDTH_PT = 530;
/** Max image height so the dashboard stays on one PDF page (Letter, with margins). */
const DASHBOARD_FIT_HEIGHT_PT = 598;

type PdfMakeCtor = {
  vfs: Record<string, string>;
  fonts: Record<
    string,
    { normal: string; bold: string; italics: string; bolditalics: string }
  >;
  createPdf: (doc: TDocumentDefinitions) => { download: (name?: string) => void };
};

export async function downloadHybridMemoPdf(
  meta: HybridPdfMeta,
  dashboardEl: HTMLElement | null,
  outputMarkdown: string,
): Promise<void> {
  const dashboardPng = await captureDashboardPng(dashboardEl);

  const pdfMakeMod = await import("pdfmake/build/pdfmake");
  const vfsMod = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeMod.default as unknown as PdfMakeCtor;
  const vfsRaw = vfsMod as Record<string, unknown>;
  const vfs =
    (typeof vfsRaw.default === "object" && vfsRaw.default !== null
      ? vfsRaw.default
      : vfsRaw) as Record<string, string>;

  pdfMake.vfs = vfs;
  pdfMake.fonts = {
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
  };

  const analysisBlocks = sectionsToPdfMakeContent(outputMarkdown);
  const content: Content[] = [];

  if (dashboardPng) {
    content.push(
      {
        text: "Market data dashboard",
        style: "sectionLabel",
        margin: [0, 0, 0, 6],
      },
      {
        image: dashboardPng,
        fit: [IMAGE_WIDTH_PT, DASHBOARD_FIT_HEIGHT_PT],
        margin: [0, 0, 0, 2],
      },
      { text: "", pageBreak: "after" },
    );
  }

  content.push(
    { text: meta.title, style: "docTitle" },
    {
      text: `${meta.categoryLabel} · ${meta.timestamp}`,
      style: "muted",
      margin: [0, 4, 0, 2],
    },
  );
  if (meta.inputs?.trim()) {
    content.push({
      text: `Inputs: ${meta.inputs}`,
      style: "muted",
      margin: [0, 0, 0, 4],
    });
  }
  if (meta.rating != null && meta.rating > 0) {
    content.push({
      text: `Rating: ${meta.rating}/5`,
      style: "muted",
      margin: [0, 0, 0, 10],
    });
  } else {
    content.push({ text: "", margin: [0, 0, 0, 10] });
  }

  content.push({
    text: "Analysis",
    style: "h2",
    margin: [0, 0, 0, 6],
  });
  content.push(...analysisBlocks);

  const docDefinition: TDocumentDefinitions = {
    pageMargins: [40, 52, 40, 52],
    content,
    styles: {
      docTitle: { fontSize: 16, bold: true, color: "#111111" },
      sectionLabel: { fontSize: 10, bold: true, color: "#374151" },
      h2: { fontSize: 13, bold: true, color: "#111111" },
      h3: { fontSize: 11.5, bold: true, color: "#1a1a1a" },
      body: { fontSize: 10.5, lineHeight: 1.32, color: "#222222" },
      muted: { fontSize: 9.5, color: "#555555" },
      codeBlock: {
        fontSize: 9,
        color: "#1e293b",
        fillColor: "#f1f5f9",
      },
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 10.5,
    },
  };

  const name = meta.filename.endsWith(".pdf")
    ? meta.filename
    : `${meta.filename}.pdf`;
  pdfMake.createPdf(docDefinition).download(name);
}
