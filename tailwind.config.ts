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
        ink: "#08111f",
        mist: "#eaf4ff",
        signal: "#73f0bf",
        ember: "#ff9b71",
        tide: "#75a8ff",
        chrome: "#8ea0b8"
      },
      boxShadow: {
        glow: "0 20px 80px rgba(117, 168, 255, 0.22)"
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at top left, rgba(117,168,255,0.25), transparent 28%), radial-gradient(circle at top right, rgba(115,240,191,0.18), transparent 22%), linear-gradient(180deg, #05101d 0%, #08111f 40%, #0b1526 100%)"
      }
    }
  },
  plugins: []
};

export default config;
