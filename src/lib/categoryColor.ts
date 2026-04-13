const DEFAULT = "#0F6E56";

const MAP: Record<string, string> = {
  "equity research": "#0F6E56",
  research: "#0F6E56",
  "risk & compliance": "#993C1D",
  risk: "#993C1D",
  "fund operations": "#0F6E56",
  operations: "#0F6E56",
  "data analysis": "#854F0B",
  data: "#854F0B",
};

export function categoryAccentHex(categoryLabel: string): string {
  const k = categoryLabel.trim().toLowerCase();
  return MAP[k] ?? DEFAULT;
}

export function categoryIdToHex(categoryId: string): string {
  const id = categoryId.trim().toLowerCase();
  if (id === "research") return "#0F6E56";
  if (id === "risk") return "#993C1D";
  if (id === "operations") return "#0F6E56";
  if (id === "data") return "#854F0B";
  return DEFAULT;
}
