/** Coerce DB / JSON star ratings to 0–5 for UI (handles string, bigint, etc.). */
export function normalizeStarRating(value: unknown): number {
  if (typeof value === "bigint") {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(5, Math.max(0, Math.round(n))) : 0;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(0, Math.round(n)));
}
