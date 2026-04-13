export function fillTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  let filled = template;
  for (const [k, val] of Object.entries(variables)) {
    filled = filled.replaceAll(`{{${k}}}`, val || `[${k}]`);
  }
  return filled;
}
