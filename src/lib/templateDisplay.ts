import type { Variable } from "@/lib/types";
import { formatPromptExcerpt } from "@/lib/formatPromptExcerpt";

/** Keys inside {{ ... }} in order of first appearance. */
export function listTemplatePlaceholderKeys(template: string): string[] {
  const keys: string[] = [];
  const re = /\{\{\s*([^}]+?)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    keys.push(String(m[1]).trim());
  }
  return keys;
}

function humanizePlaceholderKey(key: string): string {
  return key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function labelMapFromVariables(variables: Variable[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const v of variables) {
    m[v.key] = v.label;
  }
  return m;
}

/**
 * Show `{{TICKER}}` as `[Ticker]` (or `[Ticker symbol]` from catalog labels) for list previews.
 */
export function templateWithFriendlyPlaceholders(
  template: string,
  variables?: Variable[],
): string {
  const labelByKey = variables ? labelMapFromVariables(variables) : undefined;
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, raw: string) => {
    const key = String(raw).trim();
    const label = labelByKey?.[key] ?? humanizePlaceholderKey(key);
    return `[${label}]`;
  });
}

/** Single-line preview for workflow pills / history (no raw {{}}). */
export function formatTemplatePreviewForUi(
  template: string,
  variables?: Variable[],
  max = 180,
): string {
  return formatPromptExcerpt(
    templateWithFriendlyPlaceholders(template, variables),
    max,
  );
}

/** Every `{{token}}` from the original must still exist unchanged in the edited template. */
export function validateTemplatePlaceholdersPreserved(
  originalTemplate: string,
  editedTemplate: string,
): string | null {
  const keys = listTemplatePlaceholderKeys(originalTemplate);
  for (const key of keys) {
    const token = `{{${key}}}`;
    if (!editedTemplate.includes(token)) {
      return `The prompt must still include ${token} (${humanizePlaceholderKey(key)}). Use Edit to change wording around it only.`;
    }
  }
  return null;
}
