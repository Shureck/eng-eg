/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontSize: {
        base: ["17px", { lineHeight: "1.55" }],
      },
      minHeight: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};
