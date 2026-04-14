const DEFAULT = "#0F6E56";

const MAP: Record<string, string> = {
  "equity research": "#0F6E56",
  research: "#0F6E56",
  "risk and compliance": "#993C1D",
  "risk & compliance": "#993C1D",
  risk: "#993C1D",
  "fund operations": "#1B4F72",
  operations: "#1B4F72",
};

export function categoryAccentHex(categoryLabel: string): string {
  const k = categoryLabel.trim().toLowerCase();
  return MAP[k] ?? DEFAULT;
}

export function categoryIdToHex(categoryId: string): string {
  const id = categoryId.trim().toLowerCase();
  if (id === "research") return "#0F6E56";
  if (id === "risk") return "#993C1D";
  if (id === "operations") return "#1B4F72";
  return DEFAULT;
}
