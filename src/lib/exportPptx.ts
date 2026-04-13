import pptxgen from "pptxgenjs";
import type { ExportPayload } from "@/lib/types";
import { categoryAccentHex } from "@/lib/categoryColor";
import {
  groupForPptx,
  parseOutput,
  parseTableRows,
  parseMarketDataSheetRows,
  type ParsedSection,
} from "@/lib/parseOutput";

function stripMd(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, "$1");
}

function sectionToTextParts(
  sections: ParsedSection[],
): pptxgen.TextProps[] {
  const parts: pptxgen.TextProps[] = [];
  for (const s of sections) {
    if (s.type === "bullet") {
      parts.push({
        text: stripMd(s.content),
        options: {
          bullet: { type: "bullet", characterCode: "2022" },
          breakLine: true,
          fontSize: 13,
          color: "E0E0E0",
          fontFace: "Arial",
        },
      });
    } else if (s.type === "heading") {
      parts.push({
        text: stripMd(s.content),
        options: {
          breakLine: true,
          bold: true,
          fontSize: 14,
          color: "FFFFFF",
          fontFace: "Arial",
        },
      });
    } else if (s.type === "paragraph") {
      parts.push({
        text: stripMd(s.content),
        options: {
          breakLine: true,
          fontSize: 13,
          color: "D0D0D0",
          fontFace: "Arial",
        },
      });
    } else if (s.type === "code") {
      parts.push({
        text: s.content,
        options: {
          breakLine: true,
          fontSize: 11,
          color: "B0B8C8",
          fontFace: "Courier New",
        },
      });
    } else if (s.type === "table") {
      const rows = parseTableRows(s.content);
      parts.push({
        text: rows.map((r) => r.join("  ·  ")).join("\n"),
        options: {
          breakLine: true,
          fontSize: 11,
          color: "C8C8C8",
          fontFace: "Arial",
        },
      });
    } else if (s.type === "numbered") {
      const line = `${s.level ?? 1}. ${s.title ?? ""}${s.content ? " " + s.content : ""}`;
      parts.push({
        text: stripMd(line),
        options: {
          breakLine: true,
          bold: true,
          fontSize: 13,
          color: "F0F0F0",
          fontFace: "Arial",
        },
      });
    }
  }
  return parts;
}

export async function buildPptxBuffer(payload: ExportPayload): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.author = "FinPrompt";
  pptx.title = payload.title;

  const accent = categoryAccentHex(payload.category).replace("#", "");
  const accentRgb = accent.length === 6 ? accent : "00D4AA";

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "0A0E17" };
  titleSlide.addText("FinPrompt", {
    x: 8.2,
    y: 0.35,
    w: 1.8,
    h: 0.35,
    fontSize: 9,
    color: "5A6577",
    fontFace: "Arial",
  });
  titleSlide.addText(payload.title, {
    x: 0.55,
    y: 1.35,
    w: 9,
    h: 1.5,
    fontSize: 28,
    bold: true,
    color: "FFFFFF",
    fontFace: "Arial",
  });
  titleSlide.addText(`${payload.inputs} · ${payload.timestamp}`, {
    x: 0.55,
    y: 2.85,
    w: 9,
    h: 0.6,
    fontSize: 14,
    color: "7A8599",
    fontFace: "Arial",
  });
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 5.25,
    w: 10,
    h: 0.2,
    fill: { color: accentRgb },
    line: { color: accentRgb, width: 0 },
  });

  const groups = groupForPptx(parseOutput(payload.output));
  for (const g of groups) {
    const slide = pptx.addSlide();
    slide.background = { color: "0A0E17" };
    slide.addText(g.title, {
      x: 0.55,
      y: 0.45,
      w: 9,
      h: 0.75,
      fontSize: 20,
      bold: true,
      color: accentRgb,
      fontFace: "Arial",
    });
    const parts = sectionToTextParts(g.body);
    if (parts.length) {
      slide.addText(parts, {
        x: 0.55,
        y: 1.25,
        w: 9,
        h: 4.85,
        valign: "top",
        fontFace: "Arial",
      });
    }
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 5.25,
      w: 10,
      h: 0.12,
      fill: { color: accentRgb },
      line: { color: accentRgb, width: 0 },
    });
  }

  const md = payload.marketData?.trim() ?? "";
  if (
    md &&
    !md.startsWith("[") &&
    md.includes("---")
  ) {
    const slide = pptx.addSlide();
    slide.background = { color: "0A0E17" };
    slide.addText("Data Context", {
      x: 0.55,
      y: 0.45,
      w: 9,
      h: 0.75,
      fontSize: 20,
      bold: true,
      color: accentRgb,
      fontFace: "Arial",
    });
    const rows = parseMarketDataSheetRows(md).slice(0, 16);
    const left = rows
      .filter((_, i) => i % 2 === 0)
      .map((r) => `${r.metric}: ${r.value || "—"}`)
      .join("\n");
    const right = rows
      .filter((_, i) => i % 2 === 1)
      .map((r) => `${r.metric}: ${r.value || "—"}`)
      .join("\n");
    slide.addText(left, {
      x: 0.55,
      y: 1.2,
      w: 4.4,
      h: 4.5,
      fontSize: 11,
      color: "C8C8C8",
      fontFace: "Arial",
      valign: "top",
    });
    slide.addText(right, {
      x: 5.05,
      y: 1.2,
      w: 4.4,
      h: 4.5,
      fontSize: 11,
      color: "C8C8C8",
      fontFace: "Arial",
      valign: "top",
    });
  }

  const out = await pptx.write({ outputType: "nodebuffer" });
  return out as Buffer;
}
