/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  /* Opt-in dark theme. Nothing emits `dark:` variants yet - this only makes a
     future theme possible without a config change. */
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          /* Accents, borders, active states, selection, tints. NOT solid fills
             behind text: white on #FF4E00 is 3.31:1 and fails WCAG AA. */
          primary: "#FF4E00",
          secondary: "#E64500",
          /* Solid button fills. Same hue as primary (18.2 deg vs 18.4 deg),
             white on it measures 4.93:1 - clears AA 4.5:1 for 14px text. */
          deep: "#CC3E00",
          /* Hover / active for a `deep` fill. White on it measures 6.06:1. */
          deeper: "#B33700",
          neutral: "#FFFFFF",
          black: "#000000",
        },
      },
      fontFamily: {
        canva: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
