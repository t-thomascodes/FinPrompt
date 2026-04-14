/** Appended after the user-editable instruction body (not shown in the editor). */
export const INSTRUCTION_FOOTER_BULL_BEAR =
  "\n\nTicker: {{TICKER}} ({{COMPANY_NAME}})\n\n{{MARKET_DATA}}";

export const INSTRUCTION_FOOTER_MARKET_DATA = "\n\n{{MARKET_DATA}}";

/** Default footers for built-in prompt ids (used when DB has no column or empty value). */
export const DEFAULT_INSTRUCTION_FOOTER_BY_PROMPT_ID: Record<string, string> = {
  "bull-bear": INSTRUCTION_FOOTER_BULL_BEAR,
  "earnings-prep": INSTRUCTION_FOOTER_MARKET_DATA,
  "comp-analysis": INSTRUCTION_FOOTER_MARKET_DATA,
  "risk-assessment": INSTRUCTION_FOOTER_MARKET_DATA,
};

/**
 * Prefer DB value when it matches the template tail; else fall back to built-in default for id.
 */
export function resolveInstructionFooter(
  template: string,
  dbFooter: string | null | undefined,
  promptId: string,
): string | undefined {
  const fromDb = (dbFooter ?? "").trim();
  if (fromDb && template.endsWith(fromDb)) return fromDb;
  const fallback = DEFAULT_INSTRUCTION_FOOTER_BY_PROMPT_ID[promptId];
  if (fallback && template.endsWith(fallback)) return fallback;
  return undefined;
}

export function getInstructionBody(template: string, footer: string | undefined): string {
  if (!footer || !template.endsWith(footer)) return template;
  return template.slice(0, template.length - footer.length).replace(/\s+$/, "");
}

export function buildFullTemplate(body: string, footer: string | undefined): string {
  const b = body.replace(/\s+$/, "");
  if (!footer?.trim()) return b;
  return b + footer;
}
