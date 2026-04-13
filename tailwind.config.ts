import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fp: {
          bg: "#FAFAFA",
          surface: "#FFFFFF",
          "surface-secondary": "#F5F5F7",
          border: "rgba(0,0,0,0.08)",
          "border-hover": "rgba(0,0,0,0.15)",
          "text-primary": "#1A1A1A",
          "text-secondary": "#4A4A4A",
          "text-muted": "#8A8A8A",
          "text-dim": "#B0B0B0",
          "text-ghost": "#C8C8C8",
          research: "#0F6E56",
          "research-light": "#E1F5EE",
          risk: "#993C1D",
          "risk-light": "#FAECE7",
          operations: "#0F6E56",
          "operations-light": "#E1F5EE",
          data: "#854F0B",
          "data-light": "#FAEEDA",
          bull: "#0F6E56",
          "bull-light": "#E1F5EE",
          "bull-accent": "#5DCAA5",
          bear: "#A32D2D",
          "bear-light": "#FCEBEB",
          "bear-accent": "#E24B4A",
          neutral: "#534AB7",
          "neutral-light": "#EEEDFE",
          "neutral-border": "#AFA9EC",
          warning: "#BA7517",
          "warning-light": "#FAEEDA",
          sentiment: {
            bull: "#5DCAA5",
            mid: "#EF9F27",
            bear: "#E24B4A",
          },
        },
      },
      borderRadius: {
        "fp-card": "8px",
        "fp-btn": "6px",
        "fp-badge": "4px",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "fp-card": "0 1px 3px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
