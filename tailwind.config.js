/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Use class: font-body  → Inter (all body text, inputs, labels)
        body:    ["Inter", "system-ui", "sans-serif"],
        // Use class: font-display → Playfair Display (English headings, hero)
        display: ["Playfair Display", "Georgia", "serif"],
        // Use class: font-num    → Space Grotesk (prices, badges, counters)
        num:     ["Space Grotesk", "monospace"],
        // Use class: font-tamil  → Tiro Tamil (Tamil script text)
        tamil:   ["Tiro Tamil", "serif"],
      },
      colors: {
        brand: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
    },
  },
  plugins: [],
};