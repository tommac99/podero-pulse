import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        podero: {
          purple:  "#7D5BE6",
          charcoal:"#262626",
          warm:    "#F0F0E9",
          teal:    "#54E3EA",
          red:     "#F44563",
          blue:    "#057BFF",
          yellow:  "#B28504",
          green:   "#079C43",
        },
      },
      fontFamily: {
        sans: ["Urbanist", "Arial", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
