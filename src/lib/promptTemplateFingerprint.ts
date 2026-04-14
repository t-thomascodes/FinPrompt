import { createHash } from "crypto";
import { formatPromptExcerpt } from "@/lib/formatPromptExcerpt";

/**
 * Identifies a "prompt" variant for the same workflow: the catalog template string
 * before variable/market substitution. Same template + different tickers ⇒ same fingerprint.
 */
export function fingerprintPromptTemplate(template: string): {
  fingerprint: string;
  excerpt: string;
} {
  const normalized = template.includes("\0") ? template.replace(/\0/g, "") : template;
  const fingerprint = createHash("sha256")
    .update(normalized, "utf8")
    .digest("hex")
    .slice(0, 16);
  return {
    fingerprint,
    excerpt: formatPromptExcerpt(normalized, 180),
  };
}
