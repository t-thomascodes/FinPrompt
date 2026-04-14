function safeSegment(s: string, max = 64): string {
  const t = s
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return (t || "export").slice(0, max);
}

/** Derive YYYY-MM-DD for filenames from locale timestamps (e.g. 4/10/2026, 9:14:22 AM) or ISO strings. */
export function exportDateFromTimestamp(timestamp: string): string {
  const trimmed = timestamp.trim();
  if (!trimmed) {
    return new Date().toISOString().slice(0, 10);
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }

  const m = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const month = m[1].padStart(2, "0");
    const day = m[2].padStart(2, "0");
    return `${m[3]}-${month}-${day}`;
  }

  return new Date().toISOString().slice(0, 10);
}

export function buildExportBasename(
  workflowSlug: string,
  primaryInput: string,
  referenceTimestamp?: string,
): string {
  const date = referenceTimestamp
    ? exportDateFromTimestamp(referenceTimestamp)
    : new Date().toISOString().slice(0, 10);
  return `meridian_${safeSegment(workflowSlug)}_${safeSegment(primaryInput)}_${date}`;
}

export function resolvePrimaryInput(
  variables: Record<string, string>,
  inputs: string,
  workflowSlug: string,
): string {
  const first = Object.values(variables).find((v) => v?.trim());
  if (first) return first.trim();
  const fromInputs = inputs
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  if (fromInputs) return fromInputs;
  return workflowSlug;
}
