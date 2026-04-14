const STORAGE_KEY = "meridian:v1:variant-labels";

function isRecordOfStrings(x: unknown): x is Record<string, string> {
  if (!x || typeof x !== "object" || Array.isArray(x)) return false;
  return Object.entries(x as Record<string, unknown>).every(
    ([k, v]) => typeof k === "string" && typeof v === "string",
  );
}

export function loadLocalVariantLabels(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecordOfStrings(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalVariantLabels(map: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}
