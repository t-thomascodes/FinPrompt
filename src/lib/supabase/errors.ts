/** PostgREST / Supabase errors are often plain objects, not `Error` instances. */
export function formatSupabaseError(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;

  if (e && typeof e === "object") {
    const o = e as {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    };
    const parts = [
      o.message,
      o.code ? `[${o.code}]` : "",
      o.details ? `— ${o.details}` : "",
      o.hint ? `(hint: ${o.hint})` : "",
    ].filter(Boolean);
    if (parts.length) return parts.join(" ");
  }

  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
