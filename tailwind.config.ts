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
          wash: "#F5F5FF", // softer than tint, for section backgrounds
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
          strong: "#0B1220", // display body
          muted: "#5A6473",
          subtle: "#737E8D", // between muted and faint; easier read than faint
          faint: "#8A93A3",
        },
        rule: {
          DEFAULT: "#EAEAEF",
          strong: "#D8D8E0",
          soft: "#F1F1F5",
        },
        surface: {
          DEFAULT: "#F8F8FA",
          raised: "#FFFFFF",
          sunken: "#F3F3F7",
        },
        // Semantic (Leap palette). warn replaced with a deeper gold that
        // actually clears 4.5:1 on white; warn-pale still used for fills.
        success: {
          DEFAULT: "#007A4D",
          tint: "#E6F2ED",
        },
        danger: {
          DEFAULT: "#D31510",
          tint: "#FDECEB",
        },
        warn: {
          DEFAULT: "#A5740A", // WCAG AA on white
          tint: "#FBF1D8",
        },
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
        "2xl": "16px",
      },
      boxShadow: {
        leap: "0 4px 20px -4px rgba(84, 82, 228, 0.20)",
        card: "0 1px 2px rgba(15, 20, 25, 0.04), 0 1px 1px rgba(15, 20, 25, 0.03)",
        cardRaised:
          "0 1px 2px rgba(15, 20, 25, 0.05), 0 10px 40px -18px rgba(28, 27, 100, 0.18)",
        ring: "0 0 0 3px rgba(84, 82, 228, 0.12)",
      },
      fontSize: {
        // Explicit type scale. First value = size, second = line-height.
        eyebrow: ["10px", { lineHeight: "14px", letterSpacing: "0.10em" }],
        micro: ["11px", { lineHeight: "16px" }],
        caption: ["12px", { lineHeight: "18px" }],
        body: ["13.5px", { lineHeight: "22px" }],
        lede: ["15px", { lineHeight: "24px" }],
        h4: ["16px", { lineHeight: "22px", letterSpacing: "-0.005em" }],
        h3: ["19px", { lineHeight: "26px", letterSpacing: "-0.01em" }],
        h2: ["24px", { lineHeight: "30px", letterSpacing: "-0.018em" }],
        h1: ["32px", { lineHeight: "36px", letterSpacing: "-0.022em" }],
        display: ["44px", { lineHeight: "46px", letterSpacing: "-0.028em" }],
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
