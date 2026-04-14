/** Forked prompts use ids like `bull-bear-fork-1730000000000`. */
export function isForkedPromptId(id: string): boolean {
  return /-fork-\d+/.test(id);
}
