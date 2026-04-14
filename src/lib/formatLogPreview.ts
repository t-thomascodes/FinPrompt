/** Plain-text preview for log cards — strips common Markdown so the list isn’t raw `**bold**`. */
export function stripMarkdownForPreview(raw: string, maxLen: number): string {
  let s = raw
    .replace(/\r\n/g, "\n")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[\t ]*([-*+]|\d+\.)\s+/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen).trimEnd()}…`;
}
