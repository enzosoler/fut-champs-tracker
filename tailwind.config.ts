import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0E14",
        card: "#141A25",
        border: "#273246",
        primary: "#6366F1",
        "primary-dark": "#4F46E5",
        accent: "#2DD4BF",
        muted: "#1E293B",
        "muted-fg": "#94A3B8",
        secondary: "#1E293B",
        win: "#10B981",
        loss: "#EF4444",
        draw: "#F59E0B",
        "chart-1": "#10B981",
        "chart-2": "#EF4444",
        "chart-3": "#F59E0B",
        "chart-4": "#8B5CF6",
        "chart-5": "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Montserrat", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
