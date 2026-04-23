/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12253a",
        cloud: "#f4f8fb",
        coral: "#ff6f61",
        mint: "#6fd3c1",
      },
    },
  },
  plugins: [],
};
