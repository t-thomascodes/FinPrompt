/** Join prompt id and template-variant key for stable map lookups (variant keys may contain ":"). */
const SEP = "\x1e";

export function makeVariantLabelKey(promptId: string, variantKey: string): string {
  return `${promptId}${SEP}${variantKey}`;
}
