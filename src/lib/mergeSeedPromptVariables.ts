import { CATEGORIES as INITIAL_CATEGORIES } from "@/lib/categories";
import { isForkedPromptId } from "@/lib/promptFork";
import type { Category, PromptTemplate } from "@/lib/types";

const seedPromptById = new Map<string, PromptTemplate>();
for (const c of INITIAL_CATEGORIES) {
  for (const p of c.prompts) {
    seedPromptById.set(p.id, p);
  }
}

/**
 * Appends variables from bundled seed when the same catalog prompt id is missing keys
 * (e.g. older DB/local rows without PEERS on comp-analysis). Copies `enrichPeerTickers`
 * from seed when absent. Forked prompt ids are left unchanged.
 */
export function mergeSeedPromptVariables(categories: Category[]): Category[] {
  return categories.map((cat) => ({
    ...cat,
    prompts: cat.prompts.map((p) => {
      if (isForkedPromptId(p.id)) return p;
      const seed = seedPromptById.get(p.id);
      if (!seed) return p;
      const existingKeys = new Set(p.variables.map((v) => v.key));
      const toAdd = seed.variables.filter((v) => !existingKeys.has(v.key));
      const enrichPeerTickers = p.enrichPeerTickers ?? seed.enrichPeerTickers;
      if (toAdd.length === 0 && enrichPeerTickers === p.enrichPeerTickers) {
        return p;
      }
      return {
        ...p,
        variables: toAdd.length ? [...p.variables, ...toAdd] : p.variables,
        ...(enrichPeerTickers !== p.enrichPeerTickers
          ? { enrichPeerTickers }
          : {}),
      };
    }),
  }));
}
