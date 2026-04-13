export type ParsedSectionType =
  | "heading"
  | "numbered"
  | "bullet"
  | "paragraph"
  | "code"
  | "table";

export interface ParsedSection {
  type: ParsedSectionType;
  level?: number;
  title?: string;
  content: string;
  children?: ParsedSection[];
  /** For `heading`: markdown ## / ### depth */
  headingLevel?: 2 | 3;
}

function isTableLine(line: string): boolean {
  const t = line.trim();
  if (!t.includes("|")) return false;
  if (/^\|[\s\-:|]+\|\s*$/.test(t)) return false;
  return t.split("|").filter(Boolean).length >= 2;
}

export function parseOutput(text: string): ParsedSection[] {
  const lines = text.split(/\r?\n/);
  const sections: ParsedSection[] = [];
  let i = 0;
  let inCode = false;
  const codeBuf: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeBuf.length = 0;
      } else {
        sections.push({ type: "code", content: codeBuf.join("\n") });
        inCode = false;
      }
      i += 1;
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      i += 1;
      continue;
    }

    if (isTableLine(line)) {
      const tableLines: string[] = [];
      while (i < lines.length) {
        const L = lines[i];
        const T = L.trim();
        if (T === "") break;
        if (/^\|[\s\-:|]+\|\s*$/.test(T)) {
          i += 1;
          continue;
        }
        if (!isTableLine(L)) break;
        tableLines.push(L);
        i += 1;
      }
      if (tableLines.length) {
        sections.push({ type: "table", content: tableLines.join("\n") });
      }
      continue;
    }

    if (trimmed === "") {
      i += 1;
      continue;
    }

    if (/^###\s+/.test(trimmed)) {
      sections.push({
        type: "heading",
        content: trimmed.replace(/^###\s+/, "").trim(),
        headingLevel: 3,
      });
      i += 1;
      continue;
    }

    if (/^##\s+/.test(trimmed)) {
      sections.push({
        type: "heading",
        content: trimmed.replace(/^##\s+/, "").trim(),
        headingLevel: 2,
      });
      i += 1;
      continue;
    }

    if (/^\*\*.+\*\*$/.test(trimmed)) {
      sections.push({
        type: "heading",
        content: trimmed.replace(/^\*\*|\*\*$/g, ""),
      });
      i += 1;
      continue;
    }

    const num = trimmed.match(/^(\d+)\.\s+\*\*(.+?)\*\*(.*)$/);
    if (num) {
      sections.push({
        type: "numbered",
        level: parseInt(num[1], 10),
        title: num[2],
        content: num[3]?.trim() ?? "",
      });
      i += 1;
      continue;
    }

    const numPlain = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numPlain && !/\*\*/.test(trimmed)) {
      sections.push({
        type: "numbered",
        level: parseInt(numPlain[1], 10),
        title: numPlain[2].trim(),
        content: "",
      });
      i += 1;
      continue;
    }

    if (/^[-•\u25B8\u203A\u25BA\u25B9]\s/.test(trimmed)) {
      sections.push({
        type: "bullet",
        level: 1,
        content: trimmed.replace(/^[-•\u25B8\u203A\u25BA\u25B9]\s/, ""),
      });
      i += 1;
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const L = lines[i];
      const T = L.trim();
      if (T === "") break;
      if (T.startsWith("```")) break;
      if (isTableLine(L)) break;
      if (/^###\s+/.test(T)) break;
      if (/^##\s+/.test(T)) break;
      if (/^\*\*.+\*\*$/.test(T)) break;
      if (/^\d+\.\s+/.test(T)) break;
      if (/^[-•\u25B8\u203A\u25BA\u25B9]\s/.test(T)) break;
      para.push(L);
      i += 1;
    }
    sections.push({ type: "paragraph", content: para.join("\n") });
  }

  return sections;
}

export type SectionVariant =
  | "bull"
  | "bear"
  | "neutral"
  | "metrics"
  | "variant"
  | "consensus"
  | "surprise"
  | "default";

export type SectionCardGroup = {
  kind: "card";
  level: number;
  title: string;
  subtitle: string;
  bullets: string[];
  variant: SectionVariant;
  layout: "list" | "metrics-grid";
};

export type RenderChunk = ParsedSection | SectionCardGroup;

export function classifySectionTitle(title: string): {
  variant: SectionVariant;
  layout: "list" | "metrics-grid";
} {
  const t = title.toLowerCase();
  if (/\bbull\b/.test(t)) return { variant: "bull", layout: "list" };
  if (/\bbear\b/.test(t)) return { variant: "bear", layout: "list" };
  if (/metric|monitor/.test(t)) return { variant: "metrics", layout: "metrics-grid" };
  if (/variant|perception|divergence/.test(t))
    return { variant: "variant", layout: "list" };
  if (/consensus|expectation/.test(t))
    return { variant: "consensus", layout: "list" };
  if (/surprise|scenario/.test(t)) return { variant: "surprise", layout: "list" };
  return { variant: "default", layout: "list" };
}

/** Merge numbered headings with following bullet lists into card groups. */
export function groupSectionsForCards(sections: ParsedSection[]): RenderChunk[] {
  const out: RenderChunk[] = [];
  let i = 0;
  while (i < sections.length) {
    const s = sections[i];
    if (s.type === "numbered" && s.title) {
      const bullets: string[] = [];
      let j = i + 1;
      while (j < sections.length && sections[j].type === "bullet") {
        bullets.push(sections[j].content);
        j += 1;
      }
      const { variant, layout } = classifySectionTitle(s.title);
      out.push({
        kind: "card",
        level: s.level ?? 1,
        title: s.title,
        subtitle: s.content?.trim() ?? "",
        bullets,
        variant,
        layout,
      });
      i = j;
      continue;
    }
    out.push(s);
    i += 1;
  }
  return out;
}

export type H3SectionGroup = {
  h3Title: string | null;
  body: ParsedSection[];
};

/** Split document on `###` headings; preamble before first ### uses `h3Title: null`. */
export function partitionByH3(sections: ParsedSection[]): H3SectionGroup[] {
  const groups: H3SectionGroup[] = [];
  let currentTitle: string | null = null;
  let body: ParsedSection[] = [];

  for (const s of sections) {
    if (s.type === "heading" && s.headingLevel === 3) {
      if (body.length > 0 || currentTitle !== null) {
        groups.push({ h3Title: currentTitle, body });
        body = [];
      }
      currentTitle = s.content;
    } else {
      body.push(s);
    }
  }
  groups.push({ h3Title: currentTitle, body });

  return groups;
}

export type BodyRenderPlan =
  | { mode: "flow"; sections: ParsedSection[] }
  | { mode: "chunks"; chunks: RenderChunk[] };

export function planBodyRender(body: ParsedSection[]): BodyRenderPlan {
  const structural = body.some(
    (s) =>
      s.type === "numbered" ||
      s.type === "heading" ||
      s.type === "table" ||
      s.type === "code",
  );
  if (!structural && body.length > 0) {
    return { mode: "flow", sections: body };
  }
  return { mode: "chunks", chunks: groupSectionsForCards(body) };
}

export function parseTableRows(tableContent: string): string[][] {
  return tableContent.split("\n").map((row) =>
    row
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim()),
  );
}

/** Group content for PowerPoint: each `numbered` section starts a new slide. */
export function groupForPptx(sections: ParsedSection[]): {
  title: string;
  body: ParsedSection[];
}[] {
  const groups: { title: string; body: ParsedSection[] }[] = [];
  let current: { title: string; body: ParsedSection[] } | null = null;

  for (const s of sections) {
    if (s.type === "numbered" && s.title) {
      const slideTitle = [s.title, s.content].filter(Boolean).join(" — ");
      current = { title: slideTitle, body: [] };
      groups.push(current);
    } else if (current) {
      current.body.push(s);
    } else {
      if (!groups.length) {
        groups.push({ title: "Overview", body: [] });
      }
      groups[0].body.push(s);
    }
  }

  if (!groups.length) {
    return [{ title: "Analysis", body: sections }];
  }
  return groups;
}

export function parseMarketDataSheetRows(marketData: string): {
  metric: string;
  value: string;
  category: string;
}[] {
  const rows: { metric: string; value: string; category: string }[] = [];
  let section = "General";
  for (const line of marketData.split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith("--- ") && t.endsWith(" ---")) {
      section = t.replace(/^---\s*/, "").replace(/\s*---$/, "");
      continue;
    }
    if (!t || t.startsWith("[")) continue;
    if (/^\d+\.\s/.test(t)) {
      const rest = t.replace(/^\d+\.\s*/, "");
      rows.push({ metric: "News", value: rest, category: "News" });
      continue;
    }
    if (t.includes(":")) {
      const idx = t.indexOf(":");
      const metric = t.slice(0, idx).trim();
      const value = t.slice(idx + 1).trim();
      if (metric && value) {
        rows.push({ metric, value, category: section });
      }
      continue;
    }
    if (t.includes("|")) {
      rows.push({ metric: t, value: "", category: section });
    }
  }
  return rows;
}
