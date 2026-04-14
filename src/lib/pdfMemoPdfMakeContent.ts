import {
  classifySectionTitle,
  parseOutput,
  parseTableRows,
  type SectionVariant,
} from "@/lib/parseOutput";
import type { Content, TableCell } from "pdfmake/interfaces";

const RULE_WIDTH_PT = 530;
const COLOR_BULL = "#0F6E56";
const COLOR_BEAR = "#A32D2D";
const COLOR_SECTION = "#111827";

/** Inline `**bold**` to pdfmake text fragments. */
export function mdToRuns(
  line: string,
): (string | { text: string; bold?: boolean })[] {
  const chunks: (string | { text: string; bold?: boolean })[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) chunks.push(line.slice(last, m.index));
    chunks.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) chunks.push(line.slice(last));
  return chunks.length ? chunks : [line];
}

function stripBoldMarkers(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, "$1");
}

function tableCell(text: string, compact: boolean): TableCell {
  return {
    text: mdToRuns(text),
    style: "body",
    fontSize: compact ? 7 : 9,
    margin: compact ? [1, 2, 1, 2] : [2, 3, 2, 3],
  };
}

/** Many-column comps tables need landscape + smaller type to avoid clipping. */
const WIDE_TABLE_COL_THRESHOLD = 6;

function thinSectionRule(): Content {
  return {
    canvas: [
      {
        type: "line",
        x1: 0,
        y1: 0,
        x2: RULE_WIDTH_PT,
        y2: 0,
        lineWidth: 0.5,
        lineColor: "#d1d5db",
      },
    ],
    margin: [0, 10, 0, 6],
  };
}

function isBullOrBear(v: SectionVariant): v is "bull" | "bear" {
  return v === "bull" || v === "bear";
}

function headerAccentForVariant(v: SectionVariant): {
  color: string;
  fontSize: number;
} {
  if (v === "bull") return { color: COLOR_BULL, fontSize: 12.5 };
  if (v === "bear") return { color: COLOR_BEAR, fontSize: 12.5 };
  if (v === "metrics" || v === "variant" || v === "consensus" || v === "surprise")
    return { color: COLOR_SECTION, fontSize: 12 };
  return { color: COLOR_SECTION, fontSize: 11.5 };
}

export function sectionsToPdfMakeContent(outputMarkdown: string): Content[] {
  const sections = parseOutput(outputMarkdown);
  const out: Content[] = [];
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
          const style = s.headingLevel === 3 ? "h3" : "h2";
          out.push({
            text: raw,
            style,
            margin: [0, 8, 0, 4],
          });
          break;
        }
        const { color, fontSize } = headerAccentForVariant(variant);
        const size =
          s.headingLevel === 3 ? Math.max(fontSize - 0.5, 11.5) : fontSize;
        out.push({
          text: raw,
          bold: true,
          fontSize: size,
          color,
          margin: [0, 8, 0, 4],
        });
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
        const { color, fontSize } = headerAccentForVariant(variant);
        out.push({
          text: [
            {
              text: `${s.level ?? 1}. `,
              bold: true,
              fontSize: fontSize - 0.5,
              color: "#6b7280",
            },
            {
              text: titlePlain,
              bold: true,
              fontSize,
              color,
            },
          ],
          margin: [0, 6, 0, 2],
        });
        if (s.content?.trim()) {
          out.push({
            text: mdToRuns(s.content.trim()),
            style: "body",
            margin: [0, 0, 0, 4],
          });
        }
        break;
      }
      case "bullet":
        out.push({
          ul: [{ text: mdToRuns(s.content) }],
          margin: [10, 2, 0, 4],
        });
        break;
      case "code":
        out.push({
          text: s.content,
          style: "codeBlock",
          margin: [10, 6, 10, 6],
          preserveLeadingSpaces: true,
        });
        break;
      case "table": {
        const rows = parseTableRows(s.content);
        if (!rows.length) break;
        const colCount = Math.max(1, ...rows.map((r) => r.length));
        const wide = colCount >= WIDE_TABLE_COL_THRESHOLD;
        const widths = Array.from({ length: colCount }, () => "*" as const);
        const tableStack: Content = {
          table: {
            widths,
            body: rows.map((r) => {
              const cells = [...r];
              while (cells.length < colCount) cells.push("");
              return cells.map((c) => tableCell(c, wide));
            }),
          },
          layout: "lightHorizontalLines",
          margin: [0, 6, 0, 10],
        };
        if (wide) {
          out.push({
            text: "",
            pageBreak: "before",
            pageOrientation: "landscape",
          });
        }
        out.push(tableStack);
        if (wide) {
          out.push({
            text: "",
            pageBreak: "before",
            pageOrientation: "portrait",
          });
        }
        break;
      }
      case "paragraph":
      default:
        out.push({
          text: mdToRuns(s.content),
          style: "body",
          margin: [0, 0, 0, 6],
        });
    }
  }

  return out;
}
