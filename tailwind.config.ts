import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryDark: "#6F686D",
        mutedGreen: "#B3B492",
        softBeige: "#CBB8A9",
        lightNeutral: "#D8D0C1",
        lightLavender: "#E0D3DE",
      },
    },
  },
  plugins: [],
};
export default config;