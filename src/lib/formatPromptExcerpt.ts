/** Single-line preview for long prompts (UI + stored excerpt). */
export function formatPromptExcerpt(raw: string, max = 180): string {
  const one = raw.replace(/\s+/g, " ").trim();
  if (!one) return "";
  if (one.length <= max) return one;
  return `${one.slice(0, max - 1)}\u2026`;
}
