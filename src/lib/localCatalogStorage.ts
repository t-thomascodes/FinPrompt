import type { Category, PromptTemplate, Variable } from "@/lib/types";

const STORAGE_KEY = "meridian:v1:local-categories";

function isVariable(x: unknown): x is Variable {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.key !== "string" ||
    typeof o.label !== "string" ||
    typeof o.placeholder !== "string"
  )
    return false;
  if (o.optional !== undefined && typeof o.optional !== "boolean") return false;
  return true;
}

function isPromptTemplate(x: unknown): x is PromptTemplate {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.title !== "string" ||
    typeof o.description !== "string" ||
    typeof o.template !== "string" ||
    !Array.isArray(o.variables)
  )
    return false;
  if (!o.variables.every(isVariable)) return false;
  if (o.enrichTicker !== undefined && typeof o.enrichTicker !== "string")
    return false;
  if (
    o.enrichPeerTickers !== undefined &&
    typeof o.enrichPeerTickers !== "string"
  )
    return false;
  if (
    o.instructionFooter !== undefined &&
    typeof o.instructionFooter !== "string"
  )
    return false;
  return true;
}

function isCategory(x: unknown): x is Category {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.label !== "string" ||
    typeof o.icon !== "string" ||
    typeof o.color !== "string" ||
    !Array.isArray(o.prompts)
  )
    return false;
  return o.prompts.every(isPromptTemplate);
}

/** Full category tree saved in local/demo mode (no Supabase). */
export function loadLocalCategories(): Category[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every(isCategory)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalCategories(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch {
    /* quota / private mode */
  }
}
