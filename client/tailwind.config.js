/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A0F1E",
          light: "#111827",
          card: "#151B2E",
        },
        accent: {
          blue: "#2563EB",
          orange: "#F97316",
        },
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.15)",
        glow: "0 0 20px rgba(37, 99, 235, 0.3)",
      },
    },
  },
  plugins: [],
};
