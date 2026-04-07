import type { Config } from "tailwindcss";

// Brand tokens — defensible Leap-Scholar approximation. Single source of truth.
// When real Leap brand hexes arrive, swap them here.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1B2A4E",
          900: "#0F1A33",
          700: "#1B2A4E",
          500: "#3A4E7A",
          300: "#9DA9C2",
        },
        accent: {
          DEFAULT: "#F26B3A",
          700: "#D9531F",
        },
        ink: {
          DEFAULT: "#0F1419",
          muted: "#5A6473",
          faint: "#8A93A3",
        },
        rule: "#E3E6EC",
        surface: "#F7F8FA",
        reach: "#B23A48",
        target: "#1F6FB2",
        safety: "#2E8B57",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightish: "-0.01em",
      },
    },
  },
  plugins: [],
};
export default config;
