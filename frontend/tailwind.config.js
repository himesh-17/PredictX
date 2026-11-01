/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        industrial: {
          bg: "#0B1220",
          panel: "#111B2E",
          panelAlt: "#172338",
          border: "#1E293B",
          textPrimary: "#F1F5F9",
          textSecondary: "#94A3B8",
          cyan: "#22D3EE",
          blue: "#60A5FA",
          green: "#34D399",
          amber: "#FBBF24",
          red: "#F87171",
        },
      },
    },
  },
  plugins: [],
};
