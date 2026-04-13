import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
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
  parseOutput,
  parseTableRows,
  type ParsedSection,
} from "@/lib/parseOutput";

const BODY_SIZE = 22;
const TITLE_SIZE = 28;
const SMALL_SIZE = 18;

function mdRuns(text: string, size = BODY_SIZE): TextRun[] {
  const runs: TextRun[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      runs.push(
        new TextRun({ text: text.slice(last, m.index), font: "Arial", size }),
      );
    }
    runs.push(
      new TextRun({ text: m[1], bold: true, font: "Arial", size }),
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    runs.push(new TextRun({ text: text.slice(last), font: "Arial", size }));
  }
  return runs.length ? runs : [new TextRun({ text, font: "Arial", size })];
}

function border() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  };
}

type DocBlock = Paragraph | Table;

function sectionsToBlocks(sections: ParsedSection[]): DocBlock[] {
  const out: DocBlock[] = [];
  for (const s of sections) {
    switch (s.type) {
      case "heading":
        out.push(
          new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: s.content,
                bold: true,
                font: "Arial",
                size: BODY_SIZE + 2,
              }),
            ],
          }),
        );
        break;
      case "numbered": {
        const line = `${s.level ?? 1}. **${s.title ?? ""}**${s.content ? s.content : ""}`;
        out.push(
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: mdRuns(line, BODY_SIZE + 2),
          }),
        );
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
        out.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: rows.map(
              (cells) =>
                new TableRow({
                  children: cells.map(
                    (c) =>
                      new TableCell({
                        borders: border(),
                        children: [
                          new Paragraph({
                            children: mdRuns(c),
                          }),
                        ],
                      }),
                  ),
                }),
            ),
          }),
        );
        break;
      }
      default:
        out.push(
          new Paragraph({
            spacing: { after: 120 },
            children: mdRuns(s.content),
          }),
        );
    }
  }
  return out;
}

function marketDataParagraphs(marketData: string): Paragraph[] {
  const lines = marketData.split(/\r?\n/).filter((l) => l.trim());
  return [
    new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({
          text: "Data Context",
          bold: true,
          font: "Arial",
          size: BODY_SIZE,
        }),
      ],
    }),
    ...lines.map(
      (line) =>
        new Paragraph({
          spacing: { after: 60 },
          children: mdRuns(line, SMALL_SIZE),
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
          size: TITLE_SIZE,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `${payload.category} · ${payload.timestamp}`,
          font: "Arial",
          size: SMALL_SIZE,
          color: "555555",
        }),
      ],
    }),
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "AAAAAA" },
      },
      spacing: { after: 240 },
      children: [new TextRun({ text: "" })],
    }),
  ];

  if (payload.marketData?.trim()) {
    children.push(...marketDataParagraphs(payload.marketData.trim()));
  }

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
                    text: "FinPrompt",
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
                    text: `Generated by FinPrompt · ${payload.timestamp}`,
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
