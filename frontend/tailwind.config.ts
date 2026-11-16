import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nova: {
          page: "#f5f4ee",
          paper: "#ffffff",
          ink: "#10292d",
          muted: "#66726f",
          rule: "#e2e0d6",
          deep: "#0c2f35",
          "deep-ink": "#eef2ec",
          "deep-muted": "#93aaa6",
          gold: "#8c7b33",
          lilac: "#cdc8f6",
          "lilac-ink": "#1e1a44",
          accent: "#0f3238",
          "accent-ink": "#ffffff",
          good: "#2f7d57",
        },
      },
      fontFamily: {
        sans: [
          '"Inter Tight"',
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
}
export default config

