import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft light-grey canvas, white cards, near-black ink, one blue accent.
        paper: "#F3F4F6",
        "paper-dim": "#E9EBEF",
        panel: "#FFFFFF",
        "panel-2": "#F7F8FA",
        ink: "#16181E",
        "ink-soft": "#586073",
        "ink-faint": "#98A0B3",
        kraft: "#C9C2B0",
        signal: "#2D6BF3",
        "signal-dim": "#1F54D6",
        line: "#E3E5EA",
        sale: "#E5484D",
        yellow: "#FFD84D",
        "yellow-soft": "#FFF4CC",
      },
      fontFamily: {
        display: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        grid: "1240px",
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
        md: "12px",
        lg: "20px",
        xl: "28px",
        "2xl": "32px",
        "3xl": "40px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,24,30,.04), 0 12px 32px -16px rgba(22,24,30,.16)",
        lift: "0 24px 48px -22px rgba(22,24,30,.3)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        chIn: {
          from: { opacity: "0", transform: "translateY(.35em)" },
          to: { opacity: "1", transform: "none" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        "fade-up": "fadeUp .45s cubic-bezier(.2,.8,.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;
