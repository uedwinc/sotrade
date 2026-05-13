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
        paper: "#efe8da",
        canvas: "#e7dece",
        ink: "#0f1b2d",
        slate: "#394860",
        line: "#cfc2ac",
        signal: "#1d6a67",
        ember: "#a45c35",
        tide: "#2f5ea8",
        cloud: "#f8f4eb"
      },
      boxShadow: {
        card: "0 8px 24px rgba(15, 27, 45, 0.045)"
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
