import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f5f1e8",
        canvas: "#f0ebdf",
        ink: "#152238",
        slate: "#55657d",
        line: "#d8d0c4",
        signal: "#1d6a67",
        ember: "#a45c35",
        tide: "#2f5ea8",
        cloud: "#fcfaf5"
      },
      boxShadow: {
        card: "0 10px 30px rgba(21, 34, 56, 0.05)"
      },
      backgroundImage: {
        grid:
          "linear-gradient(to right, rgba(21,34,56,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(21,34,56,0.06) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
