import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark background system — near-black canvas, layered panels
        paper: "#0A0A0A",
        "paper-dim": "#161616",
        panel: "#121212",
        "panel-2": "#161616",
        // White is the single accent/brand color — no secondary hue
        ink: "#FFFFFF",
        "ink-soft": "#A3A3A3",
        "ink-faint": "#707070",
        kraft: "#C9C2B0",
        signal: "#A3E635",
        "signal-dim": "#84CC16",
        line: "#2A2A2A",
        sale: "#FF5449",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        grid: "1440px",
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
