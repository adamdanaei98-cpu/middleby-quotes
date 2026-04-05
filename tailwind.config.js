/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#003250',
        'dk-navy': '#032436',
        'brand-red': '#E12C3E',
        'brand-blue': '#0074BB',
      },
    },
  },
  plugins: [],
};
