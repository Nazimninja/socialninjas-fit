/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./v2.html",
    "./v2/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#1F4B99',
          dark: '#07090e',
        },
      },
    },
  },
  plugins: [],
};
