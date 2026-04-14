import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { ExportPayload } from "@/lib/types";
import {
  classifySectionTitle,
  parseOutput,
  parseTableRows,
  type ParsedSection,
  type SectionVariant,
} from "@/lib/parseOutput";

/** docx `size` is half-points (24 = 12pt). */
const SZ_BODY = 22;
const SZ_TITLE = 28;
const SZ_SMALL = 18;
const SZ_H2 = 26;
const SZ_H3 = 24;
const SZ_H4 = 22;
const SZ_NUM_LABEL = 24;
const SZ_TABLE = 20;
const SZ_TABLE_WIDE = 16;

const COLOR_BULL = "0F6E56";
const COLOR_BEAR = "A32D2D";
const COLOR_SECTION = "111827";
const COLOR_MUTED = "555555";
const COLOR_NUM = "6B7280";

function normalizeMd(s: string): string {
  return s.replace(/\*\*\*(.+?)\*\*\*/g, "**$1**");
}

function stripBoldMarkers(s: string): string {
  return normalizeMd(s).replace(/\*\*(.+?)\*\*/g, "$1");
}

function mdRuns(
  text: string,
  size = SZ_BODY,
  base: { color?: string; bold?: boolean } = {},
): TextRun[] {
  const t = normalizeMd(text);
  const runs: TextRun[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    if (m.index > last) {
      runs.push(
        new TextRun({
          text: t.slice(last, m.index),
          font: "Arial",
          size,
          color: base.color,
          bold: base.bold,
        }),
      );
    }
    runs.push(
      new TextRun({
        text: m[1],
        bold: true,
        font: "Arial",
        size,
        color: base.color,
      }),
    );
    last = m.index + m[0].length;
  }
  if (last < t.length) {
    runs.push(
      new TextRun({
        text: t.slice(last),
        font: "Arial",
        size,
        color: base.color,
        bold: base.bold,
      }),
    );
  }
  return runs.length ? runs : [new TextRun({ text: t, font: "Arial", size, ...base })];
}

function border() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  };
}

function isBullOrBear(v: SectionVariant): v is "bull" | "bear" {
  return v === "bull" || v === "bear";
}

function headerAccentForVariant(v: SectionVariant): { color: string; size: number } {
  if (v === "bull") return { color: COLOR_BULL, size: 25 };
  if (v === "bear") return { color: COLOR_BEAR, size: 25 };
  if (v === "metrics" || v === "variant" || v === "consensus" || v === "surprise")
    return { color: COLOR_SECTION, size: 24 };
  return { color: COLOR_SECTION, size: 23 };
}

function thinSectionRule(): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
    },
    children: [new TextRun({ text: "\u00A0", font: "Arial", size: 4, color: "FFFFFF" })],
  });
}

type DocBlock = Paragraph | Table;

const WIDE_TABLE_COL_THRESHOLD = 6;

function sectionsToBlocks(sections: ParsedSection[]): DocBlock[] {
  const out: DocBlock[] = [];
  let lastCaseEdge: "bull" | "bear" | null = null;

  for (const s of sections) {
    switch (s.type) {
      case "heading": {
        const raw = stripBoldMarkers(s.content);
        const { variant } = classifySectionTitle(raw);
        if (variant === "bear" && lastCaseEdge === "bull") {
          out.push(thinSectionRule());
        }
        if (isBullOrBear(variant)) {
          lastCaseEdge = variant;
        }

        if (variant === "default" || variant === "neutral") {
          let size = SZ_H2;
          if (s.headingLevel === 3) size = SZ_H3;
          if (s.headingLevel === 4) size = SZ_H4;
          out.push(
            new Paragraph({
              spacing: { before: 200, after: 120 },
              children: [
                new TextRun({
                  text: raw,
                  bold: true,
                  font: "Arial",
                  size,
                  color: "111111",
                }),
              ],
            }),
          );
          break;
        }

        const { color, size } = headerAccentForVariant(variant);
        const fontSize =
          s.headingLevel === 3 ? Math.max(size - 1, SZ_H3) : size;
        out.push(
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: raw,
                bold: true,
                font: "Arial",
                size: fontSize,
                color,
              }),
            ],
          }),
        );
        break;
      }
      case "numbered": {
        const titlePlain = stripBoldMarkers(s.title ?? "");
        const { variant } = classifySectionTitle(titlePlain);
        if (variant === "bear" && lastCaseEdge === "bull") {
          out.push(thinSectionRule());
        }
        if (isBullOrBear(variant)) {
          lastCaseEdge = variant;
        }

        const { color: titleColor, size: titleSize } = headerAccentForVariant(variant);
        const numSize = Math.max(titleSize - 2, SZ_NUM_LABEL - 2);
        const titleTint = isBullOrBear(variant) ? titleColor : COLOR_SECTION;

        const titleRuns = mdRuns(s.title ?? "", titleSize, {
          bold: true,
          color: titleTint,
        });

        out.push(
          new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({
                text: `${s.level ?? 1}. `,
                bold: true,
                font: "Arial",
                size: numSize,
                color: COLOR_NUM,
              }),
              ...titleRuns,
            ],
          }),
        );

        if (s.content?.trim()) {
          for (const chunk of s.content.trim().split(/\n+/)) {
            if (!chunk.trim()) continue;
            out.push(
              new Paragraph({
                spacing: { after: 100 },
                children: mdRuns(chunk.trim()),
              }),
            );
          }
        }
        break;
      }
      case "bullet":
        out.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: mdRuns(s.content),
          }),
        );
        break;
      case "code":
        out.push(
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: "ECEFF4" },
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: s.content,
                font: "Courier New",
                size: 20,
              }),
            ],
          }),
        );
        break;
      case "table": {
        const rows = parseTableRows(s.content);
        if (!rows.length) break;
        const colCount = Math.max(1, ...rows.map((r) => r.length));
        const wide = colCount >= WIDE_TABLE_COL_THRESHOLD;
        const cellSize = wide ? SZ_TABLE_WIDE : SZ_TABLE;
        out.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: rows.map(
              (cells, ri) =>
                new TableRow({
                  tableHeader: ri === 0,
                  children: (() => {
                    const padded = [...cells];
                    while (padded.length < colCount) padded.push("");
                    return padded.map(
                      (c) =>
                        new TableCell({
                          borders: border(),
                          shading:
                            ri === 0
                              ? { type: ShadingType.CLEAR, fill: "E5E7EB" }
                              : undefined,
                          children: [
                            new Paragraph({
                              children: mdRuns(c, cellSize, {
                                bold: ri === 0,
                              }),
                            }),
                          ],
                        }),
                    );
                  })(),
                }),
            ),
          }),
        );
        out.push(
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: "" })],
          }),
        );
        break;
      }
      case "paragraph":
      default: {
        const body = s.content ?? "";
        if (!body.trim()) break;
        for (const chunk of body.split(/\n\n+/)) {
          const t = chunk.trim();
          if (!t) continue;
          out.push(
            new Paragraph({
              spacing: { after: 120 },
              children: mdRuns(t),
            }),
          );
        }
      }
    }
  }
  return out;
}

function stripDataUrlBase64(s: string): string {
  return s.replace(/^data:image\/png;base64,/i, "").replace(/\s/g, "");
}

function pngIntrinsicSize(buf: Buffer): { w: number; h: number } | null {
  if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/** Display size in px for docx ImageRun (library converts for Word). */
function docxDashboardImageSize(
  buf: Buffer,
  maxW = 620,
  maxH = 520,
): { width: number; height: number } {
  const intrinsic = pngIntrinsicSize(buf);
  if (!intrinsic || intrinsic.w < 1 || intrinsic.h < 1) {
    return { width: maxW, height: Math.round(maxH * 0.65) };
  }
  const ratio = intrinsic.h / intrinsic.w;
  let w = maxW;
  let h = Math.round(w * ratio);
  if (h > maxH) {
    h = maxH;
    w = Math.round(h / ratio);
  }
  return { width: w, height: h };
}

function decodeDashboardPng(payload: ExportPayload): Buffer | null {
  const raw = payload.dashboardPngBase64?.trim();
  if (!raw) return null;
  try {
    const buf = Buffer.from(stripDataUrlBase64(raw), "base64");
    return buf.length > 200 ? buf : null;
  } catch {
    return null;
  }
}

function marketDataParagraphs(marketData: string): Paragraph[] {
  const lines = marketData.split(/\r?\n/).filter((l) => l.trim());
  return [
    new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({
          text: "Market data context",
          bold: true,
          font: "Arial",
          size: SZ_BODY,
          color: "111111",
        }),
      ],
    }),
    ...lines.map(
      (line) =>
        new Paragraph({
          spacing: { after: 60 },
          children: mdRuns(line, SZ_SMALL),
        }),
    ),
  ];
}

export async function buildDocxBuffer(payload: ExportPayload): Promise<Buffer> {
  const parsed = parseOutput(payload.output);
  const children: DocBlock[] = [
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: payload.title,
          bold: true,
          font: "Arial",
          size: SZ_TITLE,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: `${payload.category} · ${payload.timestamp}`,
          font: "Arial",
          size: SZ_SMALL,
          color: COLOR_MUTED,
        }),
      ],
    }),
  ];

  if (payload.inputs?.trim()) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: `Inputs: ${payload.inputs.trim()}`,
            font: "Arial",
            size: SZ_SMALL,
            color: COLOR_MUTED,
          }),
        ],
      }),
    );
  }

  if (payload.rating != null && payload.rating > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: `Rating: ${payload.rating}/5`,
            font: "Arial",
            size: SZ_SMALL,
            color: COLOR_MUTED,
          }),
        ],
      }),
    );
  }

  children.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "AAAAAA" },
      },
      spacing: { after: 240 },
      children: [new TextRun({ text: "" })],
    }),
  );

  const dashboardBuf = decodeDashboardPng(payload);
  const hasDashboard = dashboardBuf != null;
  const useRawMarketFallback = !hasDashboard && Boolean(payload.marketData?.trim());

  if (hasDashboard) {
    const dim = docxDashboardImageSize(dashboardBuf);
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: "Market data dashboard",
            bold: true,
            font: "Arial",
            size: SZ_BODY,
            color: "111111",
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new ImageRun({
            data: dashboardBuf,
            transformation: { width: dim.width, height: dim.height },
          }),
        ],
      }),
    );
  } else if (payload.marketData?.trim()) {
    children.push(...marketDataParagraphs(payload.marketData.trim()));
  }

  children.push(
    new Paragraph({
      pageBreakBefore: hasDashboard,
      spacing: { before: useRawMarketFallback ? 240 : 0, after: 120 },
      children: [
        new TextRun({
          text: "Analysis",
          bold: true,
          font: "Arial",
          size: SZ_H2,
          color: "111111",
        }),
      ],
    }),
  );

  children.push(...sectionsToBlocks(parsed));

  const doc = new Document({
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Meridian",
                    font: "Arial",
                    size: 16,
                    color: "7A8599",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Generated by Meridian · ${payload.timestamp}`,
                    font: "Arial",
                    size: 16,
                    color: "888888",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
