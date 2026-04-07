import type { Config } from "tailwindcss";

// Leap Scholar brand tokens — sourced from leapscholar.com.
// Single source of truth for color, type, and rounding.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Leap primary purple family
        purple: {
          DEFAULT: "#5452E4",
          light: "#807EFC",
          pale: "#C2C1FF",
          tint: "#EFEEFF",
        },
        // Deep navy used by Leap for headings and dark text
        navy: {
          DEFAULT: "#1C1B64",
          900: "#15144D",
          700: "#1C1B64",
          500: "#3A398A",
          300: "#9B9AC8",
        },
        // Body text scale
        ink: {
          DEFAULT: "#0F1419",
          muted: "#5A6473",
          faint: "#8A93A3",
        },
        rule: "#E6E6E6",
        surface: "#F8F8F8",
        // Semantic (Leap palette)
        success: "#007A4D",
        danger: "#D31510",
        warn: "#E8C600",
        // Fit-band colors map onto semantics
        reach: "#D31510",
        target: "#5452E4",
        safety: "#007A4D",
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightish: "-0.01em",
        tighter2: "-0.02em",
      },
      borderRadius: {
        xl: "12px",
      },
      boxShadow: {
        leap: "0 4px 20px -4px rgba(84, 82, 228, 0.20)",
        card: "0 1px 2px rgba(15, 20, 25, 0.04), 0 1px 1px rgba(15, 20, 25, 0.03)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        slideIn: "slideIn 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        fadeIn: "fadeIn 180ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
