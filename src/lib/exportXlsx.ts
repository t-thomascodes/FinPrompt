import ExcelJS from "exceljs";
import type { ExportPayload } from "@/lib/types";
import {
  parseOutput,
  parseTableRows,
  parseMarketDataSheetRows,
  type ParsedSection,
} from "@/lib/parseOutput";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD6E3F0" },
};

const ALT_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF5F7FA" },
};

function stripMd(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, "$1");
}

function colLetter(idx: number): string {
  let n = idx;
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function appendSectionRows(
  ws: ExcelJS.Worksheet,
  startRow: number,
  sections: ParsedSection[],
): number {
  let r = startRow;
  for (const s of sections) {
    switch (s.type) {
      case "heading":
      case "numbered": {
        const label =
          s.type === "numbered" && s.title
            ? `${s.level ?? 1}. ${s.title}${s.content ? " " + s.content : ""}`
            : s.content;
        const row = ws.getRow(r);
        row.getCell(1).value = stripMd(label);
        row.getCell(1).font = { bold: true, name: "Arial", size: 11 };
        r += 1;
        break;
      }
      case "bullet": {
        const row = ws.getRow(r);
        row.getCell(1).value = `• ${stripMd(s.content)}`;
        row.getCell(1).font = { name: "Arial", size: 11 };
        r += 1;
        break;
      }
      case "code": {
        const row = ws.getRow(r);
        row.getCell(1).value = s.content;
        row.getCell(1).font = { name: "Courier New", size: 10 };
        row.getCell(1).alignment = { wrapText: true };
        r += 1;
        break;
      }
      case "table": {
        const rows = parseTableRows(s.content);
        if (!rows.length) break;
        const header = rows[0];
        const body = rows.slice(1);
        const start = r;
        ws.getRow(r).values = [undefined, ...header];
        ws.getRow(r).eachCell({ includeEmpty: false }, (cell) => {
          cell.font = { bold: true, name: "Arial", size: 11 };
          cell.fill = HEADER_FILL;
          cell.border = {
            top: { style: "thin", color: { argb: "FF999999" } },
            left: { style: "thin", color: { argb: "FF999999" } },
            bottom: { style: "thin", color: { argb: "FF999999" } },
            right: { style: "thin", color: { argb: "FF999999" } },
          };
        });
        r += 1;
        for (let i = 0; i < body.length; i += 1) {
          ws.getRow(r).values = [undefined, ...body[i]];
          ws.getRow(r).eachCell({ includeEmpty: false }, (cell) => {
            cell.font = { name: "Arial", size: 11 };
            if (i % 2 === 0) cell.fill = ALT_FILL;
            cell.border = {
              top: { style: "thin", color: { argb: "FFCCCCCC" } },
              left: { style: "thin", color: { argb: "FFCCCCCC" } },
              bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
              right: { style: "thin", color: { argb: "FFCCCCCC" } },
            };
          });
          r += 1;
        }
        if (body.length > 0) {
          const endCol = colLetter(header.length);
          ws.addTable({
            name: `Tbl_${start}_${Date.now()}`,
            ref: `A${start}:${endCol}${r - 1}`,
            headerRow: true,
            style: {
              theme: "TableStyleMedium2",
              showRowStripes: true,
            },
            columns: header.map((h) => ({ name: h })),
            rows: body,
          });
        }
        r += 1;
        break;
      }
      default: {
        const row = ws.getRow(r);
        row.getCell(1).value = stripMd(s.content);
        row.getCell(1).font = { name: "Arial", size: 11 };
        row.getCell(1).alignment = { wrapText: true };
        r += 1;
      }
    }
  }
  return r;
}

export async function buildXlsxBuffer(payload: ExportPayload): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FinPrompt";

  const analysis = wb.addWorksheet("Analysis");
  let row = 1;
  analysis.mergeCells(row, 1, row, 8);
  analysis.getCell(row, 1).value = payload.title;
  analysis.getCell(row, 1).font = { bold: true, size: 14, name: "Arial" };
  row += 1;
  analysis.mergeCells(row, 1, row, 8);
  analysis.getCell(row, 1).value = `${payload.category} · ${payload.timestamp}`;
  analysis.getCell(row, 1).font = { size: 11, name: "Arial", color: { argb: "FF555555" } };
  row += 2;

  const parsed = parseOutput(payload.output);
  row = appendSectionRows(analysis, row, parsed);
  analysis.getColumn(1).width = 92;

  if (payload.marketData?.trim()) {
    const md = wb.addWorksheet("Market Data");
    md.getRow(1).values = [undefined, "Metric", "Value", "Category"];
    md.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
      cell.font = { bold: true, name: "Arial" };
      cell.fill = HEADER_FILL;
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    const rows = parseMarketDataSheetRows(payload.marketData.trim());
    let r = 2;
    for (let i = 0; i < rows.length; i += 1) {
      const item = rows[i];
      const excelRow = md.getRow(r);
      excelRow.getCell(1).value = item.metric;
      excelRow.getCell(2).value = item.value;
      excelRow.getCell(3).value = item.category;
      excelRow.eachCell({ includeEmpty: false }, (cell) => {
        cell.font = { name: "Arial", size: 11 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFCCCCCC" } },
          left: { style: "thin", color: { argb: "FFCCCCCC" } },
          bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
          right: { style: "thin", color: { argb: "FFCCCCCC" } },
        };
        if (i % 2 === 0) cell.fill = ALT_FILL;
      });
      r += 1;
    }
    md.getColumn(1).width = 36;
    md.getColumn(2).width = 48;
    md.getColumn(3).width = 22;
  }

  const meta = wb.addWorksheet("Metadata");
  const entries: [string, string][] = [
    ["Workflow", payload.title],
    ["Category", payload.category],
    ["Inputs", payload.inputs],
    ["Timestamp", payload.timestamp],
    ["Rating", payload.rating != null ? String(payload.rating) : "—"],
    ["Full prompt", payload.fullPrompt ?? "—"],
  ];
  meta.getCell(1, 1).value = "Field";
  meta.getCell(1, 2).value = "Value";
  meta.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { bold: true, name: "Arial" };
    cell.fill = HEADER_FILL;
  });
  let mr = 2;
  for (const [k, v] of entries) {
    meta.getCell(mr, 1).value = k;
    meta.getCell(mr, 2).value = v;
    meta.getRow(mr).eachCell({ includeEmpty: false }, (cell) => {
      cell.font = { name: "Arial", size: 11 };
      cell.alignment = { wrapText: true };
    });
    mr += 1;
  }
  meta.getColumn(1).width = 18;
  meta.getColumn(2).width = 100;

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
