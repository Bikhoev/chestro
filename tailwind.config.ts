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
        chestro: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        surface: {
          DEFAULT: "#f0f4f8",
          card: "#ffffff",
          muted: "#e2e8f0",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
      },
      animation: {
        "shine": "btn-shine 2.5s ease-in-out infinite",
      },
      keyframes: {
        "btn-shine": {
          "0%": { transform: "translateX(-100%) skewX(-12deg)", opacity: "0.5" },
          "100%": { transform: "translateX(200%) skewX(-12deg)", opacity: "0" },
        },
      },
      boxShadow: {
        "glow": "0 0 24px rgba(13, 148, 136, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
